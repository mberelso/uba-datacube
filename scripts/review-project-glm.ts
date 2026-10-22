import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '../.env')

if (!process.env.OPENROUTER_API_KEY && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      const key = match[1]
      let value = match[2] || ''
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      process.env[key] = value.trim()
    }
  }
}

const apiKey = process.env.OPENROUTER_API_KEY

if (!apiKey) {
  console.error('Error: OPENROUTER_API_KEY not found in environment or .env')
  process.exit(1)
}

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
  defaultHeaders: {
    'HTTP-Referer': 'https://uba-datacube.de',
    'X-Title': 'UBA Datacube',
  },
})

// Gather project info
const packageJson = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')

function getDirectoryTree(dir: string, prefix = ''): string {
  let result = ''
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', '.gemini', '.agent', '.agents', 'artifacts', 'brain', 'scratch'].includes(entry.name)) continue
    result += `${prefix}- ${entry.name}${entry.isDirectory() ? '/' : ''}\n`
    if (entry.isDirectory() && prefix.length < 6) {
      result += getDirectoryTree(path.join(dir, entry.name), prefix + '  ')
    }
  }
  return result
}

const tree = getDirectoryTree(path.join(__dirname, '..'))

const prompt = `Du bist ein erfahrener Senior Frontend & Software Architect. Bitte erstelle einen strukturierten, professionellen Projektreview auf Deutsch für folgendes Projekt: "UBA Datacube" (Umweltdaten-Plattform für das Umweltbundesamt).

Projektdetails:
- Tech-Stack & Dependencies (package.json):
${packageJson}

- Projektstruktur:
${tree}

Funktionale Übersicht:
- Frontend: React 19, Vite, TailwindCSS v4, Framer Motion, Recharts, Phosphor Icons
- Datenanbindung: SDMX REST API des Umweltbundesamts (UBA), Lazy Loading von DSDs, Daten-Caching
- Features: Interaktiver Datenkatalog, regionale Karten (D3-Geo), Spezialseiten (Solar, Hitze, regionaler Vergleich), Daten-Analysen, Export-Funktionen (CSV/JSON/Image), Prerendering & OG-Image Generierung für SEO.
- KI-Integration: Generierung von redaktionellen Entwürfen (datasetContent.ts) & Hintergründen.

Bitte erstelle einen Projektreview mit folgenden Kapiteln:
1. **Zusammenfassung & Gesamteindruck**
2. **Stärken der Architektur & des Tech-Stacks**
3. **Potenzielle Schwachstellen oder Optimierungspotenziale** (Performance, State Management, Typisierung, SEO/Accessibility)
4. **Empfehlungen für die nächsten Schritte** (Konkrete Empfehlungen in Prioritätenordnung)

Gibe das Ergebnis übersichtlich und strukturiert in GitHub Markdown aus.`

async function main() {
  console.log('Sending project review request to GLM 5.3 Flash via OpenRouter...')
  
  const completion = await openai.chat.completions.create({
    model: 'z-ai/glm-5.3-flash',
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  console.log(completion.choices[0]?.message?.content)
}

main().catch((err) => {
  console.error('Fehler beim Abrufen des Projektreviews von GLM 5.3 Flash:', err)
  process.exit(1)
})
