/**
 * Post-build prerender script.
 *
 * 1. Starts `vite preview` on the already-built dist/
 * 2. Visits every route with headless Chromium
 * 3. Waits for React to finish rendering (data-prerender-ready on <html>)
 * 4. Deduplicates <head> tags, then force-patches canonical + og:url to the
 *    correct route URL (Helmet sometimes resolves these to "/" on first render)
 * 5. Writes dist/<route>/index.html with clean, fully-rendered HTML
 *
 * Run: npx tsx scripts/prerender.ts   (after vite build)
 */

import { chromium } from 'playwright-core'
import { preview } from 'vite'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { DATASET_CONTENT } from '../src/data/datasetContent.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = join(ROOT, 'dist')
const PORT = 4173
const SITE_URL = 'https://www.umweltpuls.de'

const STATIC_ROUTES = ['/', '/catalog', '/analysen', '/about']
const DATASET_ROUTES = Object.keys(DATASET_CONTENT).map(
  id => `/dataset/${encodeURIComponent(id)}`
)
const ALL_ROUTES = [...STATIC_ROUTES, ...DATASET_ROUTES]

function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ]
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return undefined
}

/**
 * Patch canonical, og:url, og:title, twitter:title to be route-specific.
 * We derive og:title from the already-correct <title> tag.
 * og:description and twitter:description are left as-is (site-level is fine for now).
 */
function patchRouteMeta(html: string, route: string): string {
  const fullUrl = `${SITE_URL}${route}`

  // Extract the page title from the (correct) <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  const pageTitle = titleMatch?.[1] ?? ''

  return html
    .replace(
      /(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/gi,
      `$1${fullUrl}$2`
    )
    .replace(
      /(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/gi,
      `$1${fullUrl}$2`
    )
    .replace(
      /(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/gi,
      `$1${pageTitle}$2`
    )
    .replace(
      /(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/gi,
      `$1${pageTitle}$2`
    )
}

/** For dataset routes, derive a meaningful title from DATASET_CONTENT if available. */
function datasetTitle(route: string): string | null {
  const match = route.match(/^\/dataset\/(.+)$/)
  if (!match) return null
  const id = decodeURIComponent(match[1])
  const content = DATASET_CONTENT[id]
  if (!content) return null
  // Prefer displayName, fall back to headline (truncated), then ID
  const name = content.displayName
    ?? (content.headline ? content.headline.replace(/[–—].*$/, '').trim().slice(0, 60) : id)
  return `${name} | Umweltpuls`
}

async function run() {
  const previewServer = await preview({
    root: ROOT,
    preview: { port: PORT, strictPort: true },
  })

  const base = `http://localhost:${PORT}`
  const executablePath = findChromium()
  if (executablePath) console.log(`Using browser: ${executablePath}`)

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  console.log(`Prerendering ${ALL_ROUTES.length} routes…`)
  let ok = 0, fail = 0

  for (const route of ALL_ROUTES) {
    try {
      const page = await browser.newPage()
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 })

      // Wait for React to render and Helmet to flush page-specific meta tags.
      // We check that og:title has been set to something other than the generic
      // homepage title — that means the route-specific SEO component has run.
      const HOMEPAGE_TITLE = 'Umweltpuls'
      await page.waitForFunction(
        (homepageTitle) => {
          if (!document.documentElement.dataset.prerenderReady) return false
          if (window.location.pathname === '/') return true
          const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? ''
          // Wait until og:title is set and differs from the bare homepage brand name
          return ogTitle.length > 0 && ogTitle !== homepageTitle
        },
        HOMEPAGE_TITLE,
        { timeout: 8000 }
      ).catch(() => {})

      // Deduplicate head tags in-browser.
      // react-helmet-async sets data-rh="true" on every tag it manages.
      // Strategy: prefer the data-rh tag; otherwise keep first.
      await page.evaluate(() => {
        const head = document.head

        // Deduplicate <title>: prefer data-rh, else keep first
        const titles = Array.from(head.querySelectorAll('title'))
        if (titles.length > 1) {
          const keep = titles.find(t => t.hasAttribute('data-rh')) ?? titles[0]
          titles.forEach(t => { if (t !== keep) t.remove() })
        }

        // Deduplicate <meta> by name/property/http-equiv: prefer data-rh, else keep first
        const metaSeen = new Map<string, Element>()
        Array.from(head.querySelectorAll('meta')).forEach(m => {
          const key = m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv')
          if (!key) return
          if (!metaSeen.has(key)) {
            metaSeen.set(key, m)
          } else {
            if (m.hasAttribute('data-rh')) {
              metaSeen.get(key)!.remove()
              metaSeen.set(key, m)
            } else {
              m.remove()
            }
          }
        })

        // Deduplicate <link rel="canonical">: prefer data-rh, else keep first
        const canonicals = Array.from(head.querySelectorAll('link[rel="canonical"]'))
        if (canonicals.length > 1) {
          const keep = canonicals.find(c => c.hasAttribute('data-rh')) ?? canonicals[0]
          canonicals.forEach(c => { if (c !== keep) c.remove() })
        }
      })

      const snapshotHtml = await page.content()
      await page.close()

      // Patch route-specific meta: canonical, og:url, og:title, twitter:title.
      // For dataset pages, also inject the known title from DATASET_CONTENT
      // since the API hasn't loaded yet at snapshot time.
      let html = patchRouteMeta(snapshotHtml, route)
      const dsTitle = datasetTitle(route)
      if (dsTitle) {
        const id = decodeURIComponent((route.match(/^\/dataset\/(.+)$/)?.[1] ?? ''))
        const lead = DATASET_CONTENT[id]?.lead ?? ''
        html = html
          .replace(/(<title[^>]*>)[^<]*(<\/title>)/i, `$1${dsTitle}$2`)
          .replace(/(<meta[^>]*og:title[^>]*content=")[^"]*(")/gi, `$1${dsTitle}$2`)
          .replace(/(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/gi, `$1${dsTitle}$2`)
        if (lead) {
          html = html
            .replace(/(<meta[^>]*name="description"[^>]*content=")[^"]*(")/gi, `$1${lead.slice(0, 160)}$2`)
            .replace(/(<meta[^>]*og:description[^>]*content=")[^"]*(")/gi, `$1${lead.slice(0, 160)}$2`)
            .replace(/(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/gi, `$1${lead.slice(0, 160)}$2`)
        }
      }

      const segments = route === '/' ? [] : route.split('/').filter(Boolean)
      const outDir = join(DIST, ...segments)
      mkdirSync(outDir, { recursive: true })
      writeFileSync(join(outDir, 'index.html'), html, 'utf-8')
      ok++
      if (ok % 10 === 0 || ok === ALL_ROUTES.length) {
        process.stdout.write(`  ${ok}/${ALL_ROUTES.length} routes done\n`)
      }
    } catch (e) {
      console.warn(`  FAIL ${route}: ${(e as Error).message}`)
      fail++
    }
  }

  await browser.close()
  previewServer.httpServer.close()

  console.log(`\nPrerender complete: ${ok} OK, ${fail} failed.`)
  if (ok === 0) process.exit(1)
}

run().catch(e => { console.error(e); process.exit(1) })
