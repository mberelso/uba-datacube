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

// Read datasetContent.ts to supply raw dataflow metadata to GLM 5.3 Flash
const datasetContent = fs.readFileSync(path.join(__dirname, '../src/data/datasetContent.ts'), 'utf-8')
const comparePage = fs.readFileSync(path.join(__dirname, '../src/pages/ComparePage.tsx'), 'utf-8')

const prompt = `Du bist ein erfahrener Umwelt-Daten-Analyst und Senior Frontend Architect.

Ein Benutzer hat Screenshots von unserer Datenvergleichs-Seite (/vergleich) gemacht und folgende Probleme identifiziert:

1. **Preset "Wassertemperatur vs. Heiße Tage (DWD)"**:
   - Problem: Die rote Linie ("Erstmals 30 °C in DWD-Stationen") ist eine flache Linie bei Y=1 über alle Jahre (1981–2026). Die blaue Linie ("Fließgewässer Wassertemperatur") hat nur 2 Datenpunkte in 2020 und 2021.
   - Ursache: Die Datenquellen sind extrem dünn besetzt und "Erstmals 30°C" liefert nur ein boolesches Event statt einer echten Zeitreihe.

2. **Preset "Pkw-Kraftstoffverbrauch vs. Luftschadstoffe"**:
   - Problem: Der Pkw-Kraftstoffverbrauch hat nur einen einzigen Datenpunkt im Jahr 2023 (bei 21.000 l/100 km). Der Schadstoffindex läuft von 1990 bis 2024.
   - Ursache: Unvollständige oder falsch gefilterte Datenreihe für Kraftstoffverbrauch.

3. **Preset "Temperatur vs. Erneuerbare Energien"**:
   - Problem: Temperatur läuft von 1881 bis 2025 (145 Jahre), Erneuerbare Energien beginnen erst 2002. Es entsteht eine riesige Lücke auf der linken Achsenhälfte. Zudem ist die kausale Korrelation schwach.

Hier ist der aktuelle Code von ComparePage.tsx:
\`\`\`tsx
${comparePage}
\`\`\`

Hier sind ausschnitte verfuegbarer UBA-Datensätze aus datasetContent.ts:
\`\`\`ts
${datasetContent.slice(0, 4000)}
\`\`\`

### Deine Aufgabe:
Bewerte den aktuellen Aussagegehalt dieser drei Vergleiche und schlage 3-4 **neue, hochgradig aussagekräftige Datenvergleiche** vor, die:
1. **Lückenlose, saubere Zeitreihen** im UBA/DWD-Bestand besitzen (z. B. 1990–2024).
2. **Echte kausale oder klimapolitische Zusammenhänge** zeigen (z. B. Erneuerbare Energien vs. Treibhausgas-Emissionen, Heiße Tage vs. Mittlere Temperatur, Stickoxide vs. Straßenverkehr).
3. Konkrete Vorschläge für die Datenreihen-Schlüssel (Flow IDs und Key-Strings in SDMX) machen.

Gib die Bewertung und die neuen Vorschläge übersichtlich in sauberem GitHub Markdown auf Deutsch aus.`

async function main() {
  console.log('Sending comparison presets review to GLM 5.3 Flash via OpenRouter...')
  
  const completion = await openai.chat.completions.create({
    model: 'z-ai/glm-5.3-flash',
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  console.log(completion.choices[0]?.message?.content)
}

main().catch((err) => {
  console.error('Fehler bei der GLM 5.3 Flash Auswertungs-Analyse:', err)
  process.exit(1)
})
