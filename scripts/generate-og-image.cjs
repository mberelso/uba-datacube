// Converts public/og-image.svg → public/og-image.png at build time
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const svg = fs.readFileSync(path.join(__dirname, '../public/og-image.svg'), 'utf8')
const resvg = new Resvg(svg, { font: { loadSystemFonts: true } })
const png = resvg.render().asPng()
fs.writeFileSync(path.join(__dirname, '../public/og-image.png'), png)
console.log(`og-image.png generated (${(png.length / 1024).toFixed(0)} KB)`)
