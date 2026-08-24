import { writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { DATASET_CONTENT } from '../src/data/datasetContent.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = join(ROOT, 'public')
const SITE_URL = 'https://www.umweltpuls.de'
const TODAY = new Date().toISOString().slice(0, 10)

interface RouteSpec {
  path: string
  priority: number
  changefreq: 'daily' | 'weekly' | 'monthly'
}

const STATIC_ROUTES: RouteSpec[] = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/regionen', priority: 0.9, changefreq: 'weekly' },
  { path: '/catalog', priority: 0.9, changefreq: 'daily' },
  { path: '/analysen', priority: 0.9, changefreq: 'weekly' },
  { path: '/vergleich', priority: 0.9, changefreq: 'weekly' },
  { path: '/hitze', priority: 0.9, changefreq: 'weekly' },
  { path: '/wind', priority: 0.8, changefreq: 'monthly' },
  { path: '/solar', priority: 0.8, changefreq: 'monthly' },
  { path: '/about', priority: 0.5, changefreq: 'monthly' },
]

function generateSitemap() {
  console.log('🗺️ Generating sitemap.xml for Umweltpuls...')

  const datasetRoutes: RouteSpec[] = Object.keys(DATASET_CONTENT)
    .filter((id) => !DATASET_CONTENT[id]?.excludeFromCatalog)
    .map((id) => ({
      path: `/dataset/${encodeURIComponent(id)}`,
      priority: 0.8,
      changefreq: 'weekly',
    }))

  const allRoutes = [...STATIC_ROUTES, ...datasetRoutes]

  const urlsXml = allRoutes
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`

  const sitemapPath = join(PUBLIC, 'sitemap.xml')
  writeFileSync(sitemapPath, xml, 'utf-8')
  console.log(`✅ [Sitemap] Written ${allRoutes.length} URLs to public/sitemap.xml`)
}

generateSitemap()
