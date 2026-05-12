/**
 * Post-build prerender script.
 *
 * 1. Starts `vite preview` on the already-built dist/
 * 2. Visits every route with headless Chromium
 * 3. Waits for React to finish rendering (data-prerender-ready on <html>)
 * 4. Writes dist/<route>/index.html with fully-rendered HTML
 *
 * Run: node --import tsx/esm scripts/prerender.mjs   (after vite build)
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

      // Wait for React + Helmet to finish (set by main.tsx after initial render)
      await page.waitForFunction(
        () => document.documentElement.dataset.prerenderReady === 'true',
        { timeout: 8000 }
      ).catch(() => {})

      const html = await page.content()
      await page.close()

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
  // Don't fail CI for individual route timeouts (e.g. slow external API)
  // Only fail if nothing rendered at all
  if (ok === 0) process.exit(1)
}

run().catch(e => { console.error(e); process.exit(1) })
