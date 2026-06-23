// Converts public/og-*.svg → public/og-*.png at build time
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const SLUGS = ['og-image', 'og-wind', 'og-solar', 'og-hitze']

for (const slug of SLUGS) {
  const svgPath = path.join(__dirname, `../public/${slug}.svg`)
  if (!fs.existsSync(svgPath)) {
    console.warn(`skip: ${slug}.svg not found`)
    continue
  }
  const svg = fs.readFileSync(svgPath, 'utf8')
  const resvg = new Resvg(svg, { font: { loadSystemFonts: true } })
  const png = resvg.render().asPng()
  fs.writeFileSync(path.join(__dirname, `../public/${slug}.png`), png)
  console.log(`${slug}.png generated (${(png.length / 1024).toFixed(0)} KB)`)
}
