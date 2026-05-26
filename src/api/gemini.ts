import { GoogleGenAI } from '@google/genai'

function getClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY nicht gesetzt')
  return new GoogleGenAI({ apiKey })
}

export interface StoryResult {
  headline: string
  story: string
}

export async function generateStoryText(params: {
  metric: string
  topic: string
  yearRange: string
  category: string
}): Promise<StoryResult> {
  const ai = getClient()
  const prompt = `Du schreibst für eine Instagram Story über Umweltdaten aus Deutschland.

Datenpunkt: ${params.topic}, ${params.metric} (${params.yearRange})
Kategorie: ${params.category}

Schreibe:
1. Eine "headline": Ein prägnanter Satz, max. 8 Wörter. Kein Doppelpunkt, kein Ausrufezeichen.
2. Eine "story": 2 kurze Sätze, max. 180 Zeichen gesamt. Sachlich, zugänglich, keine Panik, keine Wertung.

Antworte NUR mit gültigem JSON, kein Markdown:
{"headline": "...", "story": "..."}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  })

  const raw = response.text ?? ''
  const clean = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const parsed = JSON.parse(clean)

  if (!parsed.headline || !parsed.story) throw new Error('Ungültige Gemini-Antwort')
  return parsed
}
