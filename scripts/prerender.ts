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

/** Trim a description to max 155 chars, breaking at a word boundary. */
function trimDesc(text: string, max = 155): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut) + '…'
}

const BUILD_DATE = new Date().toISOString().slice(0, 10)

/** Build JSON-LD for a route. Returns null for routes without structured data. */
function buildJsonLd(route: string): string | null {
  const siteUrl = 'https://www.umweltpuls.de'

  if (route === '/') {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}/#website`,
          url: siteUrl,
          name: 'Umweltpuls',
          description: 'Klimadaten, Emissionstrends und Umweltindikatoren des Umweltbundesamts — interaktiv erkunden, filtern und exportieren.',
          inLanguage: 'de-DE',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/catalog?category={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'Umweltpuls',
          url: siteUrl,
          description: 'Privates, nicht-kommerzielles Projekt zur interaktiven Aufbereitung von Umweltdaten des Umweltbundesamts.',
        },
      ],
    })
  }

  if (route === '/about') {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Ist das eine offizielle Publikation des Umweltbundesamts?',
          acceptedAnswer: { '@type': 'Answer', text: 'Nein. Dieses Projekt ist ein privates Vorhaben ohne jede Verbindung zum Umweltbundesamt (UBA) oder einer anderen Behörde.' },
        },
        {
          '@type': 'Question',
          name: 'Woher kommen die Daten?',
          acceptedAnswer: { '@type': 'Answer', text: 'Alle Daten stammen aus der öffentlich zugänglichen SDMX-REST-API des Umweltbundesamts (daten.uba.de).' },
        },
        {
          '@type': 'Question',
          name: 'Ist die Nutzung kostenlos?',
          acceptedAnswer: { '@type': 'Answer', text: 'Ja, Umweltpuls ist vollständig kostenlos und werbefrei.' },
        },
      ],
    })
  }

  if (route === '/hitze') {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Hitze in Deutschland seit 1951',
      description: 'Heiße Tage (Tmax ≥ 30 °C) und Sommertage (Tmax ≥ 25 °C) je Landkreis in Deutschland von 1951 bis heute, aggregiert aus den gegitterten 1-km-Jahresrastern des Deutschen Wetterdiensts und als animierte Karte dargestellt.',
      url: `${siteUrl}/hitze`,
      inLanguage: 'de-DE',
      keywords: ['Hitze', 'Heiße Tage', 'Sommertage', 'Klimawandel', 'Hitzewellen', 'DWD', 'Deutschland', 'Klimadaten'],
      creator: { '@type': 'GovernmentOrganization', name: 'Deutscher Wetterdienst', url: 'https://www.dwd.de' },
      publisher: { '@type': 'Organization', name: 'Umweltpuls', url: siteUrl },
      license: 'https://www.govdata.de/dl-de/by-2-0',
      isAccessibleForFree: true,
      dateModified: BUILD_DATE,
      spatialCoverage: { '@type': 'Place', name: 'Deutschland', geo: { '@type': 'GeoShape', box: '47.27 5.87 55.06 15.04' } },
      temporalCoverage: '1951/2025',
    })
  }

  if (route === '/wind' || route === '/solar') {
    const isWind = route === '/wind'
    const mastrCreator = {
      '@type': 'GovernmentOrganization',
      name: 'Bundesnetzagentur',
      url: 'https://www.marktstammdatenregister.de',
    }
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: isWind
        ? 'Windkraft-Ausbau in Deutschland seit 1990'
        : 'Solar-Ausbau in Deutschland seit 2000',
      description: isWind
        ? 'Standort, Leistung und Inbetriebnahmejahr aller Windenergieanlagen in Deutschland seit 1990, aufbereitet aus dem Marktstammdatenregister der Bundesnetzagentur und als animierte Karte dargestellt.'
        : 'Installierte Photovoltaik-Leistung je Landkreis und Standorte der Freiflächen-Solarparks in Deutschland seit 2000, aufbereitet aus dem Marktstammdatenregister der Bundesnetzagentur und als animierte Karte dargestellt.',
      url: `${siteUrl}${route}`,
      inLanguage: 'de-DE',
      keywords: isWind
        ? ['Windkraft', 'Windenergie', 'Windkraftanlagen', 'Energiewende', 'Marktstammdatenregister', 'Deutschland', 'Erneuerbare Energien']
        : ['Photovoltaik', 'Solarenergie', 'Solaranlagen', 'Freiflächenanlagen', 'Energiewende', 'Marktstammdatenregister', 'Deutschland', 'Erneuerbare Energien'],
      creator: mastrCreator,
      publisher: { '@type': 'Organization', name: 'Umweltpuls', url: siteUrl },
      license: 'https://www.govdata.de/dl-de/by-2-0',
      isAccessibleForFree: true,
      dateModified: BUILD_DATE,
      spatialCoverage: {
        '@type': 'Place',
        name: 'Deutschland',
        geo: { '@type': 'GeoShape', box: '47.27 5.87 55.06 15.04' },
      },
      temporalCoverage: isWind ? '1990/2026' : '2000/2026',
    })
  }

  const dsMatch = route.match(/^\/dataset\/(.+)$/)
  if (dsMatch) {
    const id = decodeURIComponent(dsMatch[1])
    const c = DATASET_CONTENT[id]
    if (!c) return null
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: c.displayName ?? id,
      description: c.lead ? trimDesc(c.lead, 300) : (c.headline ?? ''),
      url: `${siteUrl}/dataset/${encodeURIComponent(id)}`,
      inLanguage: 'de-DE',
      creator: {
        '@type': 'Organization',
        name: 'Umweltbundesamt',
        url: 'https://www.umweltbundesamt.de',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Umweltpuls',
        url: siteUrl,
      },
      license: 'https://www.govdata.de/dl-de/by-2-0',
      isAccessibleForFree: true,
      dateModified: BUILD_DATE,
      distribution: [
        {
          '@type': 'DataDownload',
          encodingFormat: 'application/json',
          contentUrl: `https://daten.uba.de/release/rest/data/UBA,${id},1.0/all?format=jsondata`,
        },
        {
          '@type': 'DataDownload',
          encodingFormat: 'text/csv',
          contentUrl: `https://daten.uba.de/release/rest/data/UBA,${id},1.0/all?format=csv`,
        },
      ],
    })
  }

  return null
}

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = join(ROOT, 'dist')
const PORT = 4173
const SITE_URL = 'https://www.umweltpuls.de'

const STATIC_ROUTES = ['/', '/catalog', '/analysen', '/wind', '/solar', '/hitze', '/about']

const STATIC_DESCRIPTIONS: Record<string, string> = {
  '/': 'Klimadaten, Emissionstrends und Umweltindikatoren des Umweltbundesamts — interaktiv erkunden, filtern und exportieren. Kostenlos und offen.',
  '/catalog': 'Alle Umweltdatensätze des Umweltbundesamts auf einen Blick — durchsuchen, filtern und interaktiv erkunden.',
  '/analysen': 'Ausgewählte Umwelttrends: Temperaturentwicklung, Treibhausgase, Erneuerbare Energien und mehr — basierend auf Daten des Umweltbundesamts.',
  '/wind': 'Animierte Deutschlandkarte des Windkraft-Ausbaus seit 1990: alle Windenergieanlagen aus dem Marktstammdatenregister, Jahr für Jahr — an Land und auf See, mit Satellitenbildern vom Bau einzelner Windparks.',
  '/solar': 'Animierte Deutschlandkarte des Solar-Ausbaus seit 2000: über 4 Millionen Photovoltaik-Anlagen aus dem Marktstammdatenregister — installierte Leistung je Landkreis und die großen Freiflächen-Solarparks, Jahr für Jahr.',
  '/hitze': 'Animierte Landkreis-Karte der Hitze in Deutschland seit 1951: Heiße Tage (Tmax ≥ 30 °C) und Sommertage je Landkreis, aus den 1-km-Rasterdaten des Deutschen Wetterdiensts — der Klimawandel, Jahr für Jahr sichtbar.',
  '/about': 'Hintergründe, FAQ und Impressum zu Umweltpuls — einem privaten, nicht-kommerziellen Aufbereitungsprojekt für Umweltdaten des Umweltbundesamts.',
}

/** Routen mit eigenem OG-Bild (sonst Default og-image.png). */
const ROUTE_IMAGES: Record<string, string> = {
  '/wind': `${SITE_URL}/og-wind.png`,
  '/solar': `${SITE_URL}/og-solar.png`,
  '/hitze': `${SITE_URL}/og-hitze.png`,
}
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
 * Patch canonical, og:url, og:title, twitter:title, and descriptions to be route-specific.
 * We derive og:title from the already-correct <title> tag.
 * For static routes, descriptions come from STATIC_DESCRIPTIONS.
 * For dataset routes, descriptions come from DATASET_CONTENT.lead (handled separately).
 */
function patchRouteMeta(html: string, route: string): string {
  const fullUrl = `${SITE_URL}${route}`

  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
  const pageTitle = titleMatch?.[1] ?? ''

  let out = html
    .replace(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/gi, `$1${fullUrl}$2`)
    .replace(/(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/gi, `$1${fullUrl}$2`)
    .replace(/(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/gi, `$1${pageTitle}$2`)
    .replace(/(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/gi, `$1${pageTitle}$2`)

  const staticDesc = STATIC_DESCRIPTIONS[route]
  if (staticDesc) {
    out = out
      .replace(/(<meta[^>]*name="description"[^>]*content=")[^"]*(")/gi, `$1${staticDesc}$2`)
      .replace(/(<meta[^>]*property="og:description"[^>]*content=")[^"]*(")/gi, `$1${staticDesc}$2`)
      .replace(/(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/gi, `$1${staticDesc}$2`)
  }

  const routeImage = ROUTE_IMAGES[route]
  if (routeImage) {
    out = out
      .replace(/(<meta[^>]*property="og:image"[^>]*content=")[^"]*(")/gi, `$1${routeImage}$2`)
      .replace(/(<meta[^>]*name="twitter:image"[^>]*content=")[^"]*(")/gi, `$1${routeImage}$2`)
  }

  return out
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
          const desc = trimDesc(lead)
          html = html
            .replace(/(<meta[^>]*name="description"[^>]*content=")[^"]*(")/gi, `$1${desc}$2`)
            .replace(/(<meta[^>]*og:description[^>]*content=")[^"]*(")/gi, `$1${desc}$2`)
            .replace(/(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/gi, `$1${desc}$2`)
        }
      }

      // Inject JSON-LD structured data
      const jsonLd = buildJsonLd(route)
      if (jsonLd) {
        html = html.replace('</head>', `<script type="application/ld+json">${jsonLd}</script></head>`)
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

  // Hinweis: sitemap.xml wird vom generate-sitemap-Plugin in vite.config.ts
  // erzeugt (respektiert excludeFromCatalog) — hier bewusst nichts schreiben.

  console.log(`\nPrerender complete: ${ok} OK, ${fail} failed.`)
  if (ok === 0) process.exit(1)
}

run().catch(e => { console.error(e); process.exit(1) })
