/**
 * Generiert atmosphärische Hintergrundbilder für Social Cards via Gemini Imagen.
 * Speichert 2 Varianten pro Kategorie nach /public/social-bg/
 *
 * Usage:
 *   GEMINI_API_KEY=... npx tsx scripts/generate-backgrounds.ts
 *   GEMINI_API_KEY=... npx tsx scripts/generate-backgrounds.ts --category klima
 *   GEMINI_API_KEY=... npx tsx scripts/generate-backgrounds.ts --force   (überschreibt vorhandene)
 */

import { GoogleGenAI } from '@google/genai'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../public/social-bg')

const args = process.argv.slice(2)
const targetCategory = args.includes('--category') ? args[args.indexOf('--category') + 1] : null
const force = args.includes('--force')

// ─── Prompts pro Kategorie ────────────────────────────────────────────────────

const BACKGROUNDS: Record<string, { prompt: string; label: string }[]> = {
  klima: [
    {
      label: 'Sturmwolken',
      prompt: 'Dark dramatic storm clouds over a vast German landscape, cinematic lighting, deep blue-gray tones, no people, no text, atmospheric editorial photography, high contrast, 9:16 portrait',
    },
    {
      label: 'Gletscher',
      prompt: 'Melting glacier in dense misty fog, dark dramatic sky, editorial photography, monochromatic blue-gray tones, no text, no people, moody and cinematic, 9:16 portrait',
    },
  ],
  energie: [
    {
      label: 'Windräder',
      prompt: 'Wind turbines silhouetted against a dramatic deep orange-red dusk sky, dark foreground, industrial landscape, cinematic editorial photography, no text, no people, 9:16 portrait',
    },
    {
      label: 'Solar',
      prompt: 'Solar panels reflecting dark dramatic overcast sky, low angle perspective, muted dark tones, editorial photography, no text, no people, cinematic, 9:16 portrait',
    },
  ],
  transport: [
    {
      label: 'Autobahn',
      prompt: 'Empty German Autobahn at night, long exposure light trails, dark wet asphalt, moody urban atmosphere, cinematic editorial photography, no text, no people, 9:16 portrait',
    },
    {
      label: 'Bahngleise',
      prompt: 'Train tracks disappearing into dense fog, dark overcast sky, moody German countryside, editorial photography, no text, no people, deep shadows, 9:16 portrait',
    },
  ],
  wasser: [
    {
      label: 'Fluss',
      prompt: 'Dark misty river at dawn in Germany, perfectly still reflective water surface, dense fog, moody atmospheric editorial photography, no text, no people, muted blue-green tones, 9:16 portrait',
    },
    {
      label: 'Nordsee',
      prompt: 'Dramatic dark North Sea waves under stormy sky, deep blue-gray tones, cinematic, editorial photography, no text, no people, powerful and moody, 9:16 portrait',
    },
  ],
  luft: [
    {
      label: 'Wolken',
      prompt: 'Aerial view through dense layered gray clouds from above, abstract atmospheric photography, dark blue-gray tones, no text, no people, cinematic and moody, 9:16 portrait',
    },
    {
      label: 'Industrie',
      prompt: 'Industrial factory chimneys silhouetted against dark dramatic sky at dusk, muted gray tones, editorial documentary photography, no text, no people, 9:16 portrait',
    },
  ],
  boden: [
    {
      label: 'Waldboden',
      prompt: 'Dark forest floor with tangled roots and rich dark earth, dramatic chiaroscuro lighting, macro perspective, deep muted colors, editorial photography, no text, no people, 9:16 portrait',
    },
    {
      label: 'Acker',
      prompt: 'Agricultural field at dusk with dark rich soil, dramatic moody sky, low horizon, editorial photography, muted earth tones, no text, no people, cinematic, 9:16 portrait',
    },
  ],
  flaeche: [
    {
      label: 'Aerial Stadt',
      prompt: 'Aerial drone view of city and surrounding forest at dusk, high contrast, dark tones, cinematic perspective, no text, no people visible, deep blue-green-gray palette, 9:16 portrait',
    },
    {
      label: 'Waldgrenze',
      prompt: 'Edge of a cleared forest with remaining trees silhouetted against dramatic dark sky, editorial photography, muted dark green and gray tones, no text, no people, 9:16 portrait',
    },
  ],
}

// ─── Gemini Image Generation (AI Studio) ─────────────────────────────────────

async function generateImage(ai: GoogleGenAI, prompt: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: { responseModalities: ['IMAGE'] } as any,
  })

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if ((part as any).inlineData?.data) {
      return Buffer.from((part as any).inlineData.data, 'base64')
    }
  }
  throw new Error('Keine Bilddaten in der Antwort')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('Fehler: GEMINI_API_KEY nicht gesetzt.')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const categories = targetCategory
    ? { [targetCategory]: BACKGROUNDS[targetCategory] }
    : BACKGROUNDS

  if (targetCategory && !BACKGROUNDS[targetCategory]) {
    console.error(`Unbekannte Kategorie: ${targetCategory}`)
    console.error(`Verfügbar: ${Object.keys(BACKGROUNDS).join(', ')}`)
    process.exit(1)
  }

  let total = 0
  let skipped = 0

  for (const [category, variants] of Object.entries(categories)) {
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i]
      const filename = `${category}-${i + 1}.jpg`
      const filepath = path.join(OUT_DIR, filename)

      if (!force && fs.existsSync(filepath)) {
        console.log(`  ⏭  ${filename} — bereits vorhanden (--force zum Überschreiben)`)
        skipped++
        continue
      }

      process.stdout.write(`  ⏳ ${filename} (${variant.label}) … `)
      try {
        const buf = await generateImage(ai, variant.prompt)
        fs.writeFileSync(filepath, buf)
        console.log(`✓ ${(buf.length / 1024).toFixed(0)} KB`)
        total++
        // Pause zwischen Requests (Image-Quota ist begrenzt)
        await new Promise(r => setTimeout(r, 8000))
      } catch (err: any) {
        console.log(`✗ FEHLER: ${err.message}`)
      }
    }
  }

  console.log(`\nFertig. ${total} Bilder generiert, ${skipped} übersprungen.`)
  console.log(`Ausgabe: ${OUT_DIR}`)
}

main().catch(e => { console.error(e); process.exit(1) })
