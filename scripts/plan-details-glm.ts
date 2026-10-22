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

const prompt = `Erstelle als Lead Software Architect einen feingranularen, konkreten Schritt-für-Schritt Umsetzungsplan auf Deutsch für das Projekt "UBA Datacube". 

Basierend auf den 4 Kern-Prioritäten des Projektreviews:
1. Accessibility (BITV / WCAG 2.1 AA Konformität für Diagramme, Karten & UI-Elemente)
2. Performance & Code-Splitting (Route-Based Lazy Loading, Chart-Splitting)
3. End-to-End-Testing (Playwright E2E-Tests für SDMX-Flows, Filter & Exporte)
4. Caching, Resilienz & Error Boundaries (Service Worker, Offline-Support & UBA API Fallbacks)

Gliedere den Plan in folgende Abschnitte:
- **Phase 1: Performance & Code-Splitting** (Exakte Schritte & Code-Beispiele für React.lazy, Suspense & Dynamic Imports)
- **Phase 2: Barrierefreiheit (BITV / WCAG 2.1 AA)** (Konkrete Punkte für Kontraste, ARIA-Labels, Tastatursteuerung & Tabellen-Alternativen)
- **Phase 3: E2E-Testing-Framework mit Playwright** (Testfälle, Mocks & Commands)
- **Phase 4: Resilienz & Offline-Caching** (Service Worker / Caching-Strategie)

Bitte erstelle für jeden Punkt konkrete, praxisnahe Anweisungen und Code-Beispiele in sauber formatiertem GitHub Markdown.`

async function main() {
  console.log('Sending granular implementation plan request to GLM 5.3 Flash via OpenRouter...')
  
  const completion = await openai.chat.completions.create({
    model: 'z-ai/glm-5.3-flash',
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  console.log(completion.choices[0]?.message?.content)
}

main().catch((err) => {
  console.error('Fehler beim Abrufen des Entwicklungsplans von GLM 5.3 Flash:', err)
  process.exit(1)
})
