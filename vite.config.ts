import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, writeFileSync } from 'fs'
import { DATASET_CONTENT } from './src/data/datasetContent'

const SITE_URL = 'https://www.umweltpuls.de'

function generateSitemap(): string {
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/catalog', priority: '0.9', changefreq: 'weekly' },
    { path: '/analysen', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.5', changefreq: 'monthly' },
  ]

  const datasetPages = Object.keys(DATASET_CONTENT).map(id => ({
    path: `/dataset/${encodeURIComponent(id)}`,
    priority: '0.6',
    changefreq: 'monthly',
  }))

  const urls = [...staticPages, ...datasetPages]
    .map(({ path, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-404',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
    {
      name: 'generate-sitemap',
      closeBundle() {
        const sitemap = generateSitemap()
        writeFileSync('dist/sitemap.xml', sitemap, 'utf-8')
      },
    },
  ],
  base: '/',
})
