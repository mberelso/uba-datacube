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

const promptArg = process.argv.slice(2).join(' ')
if (!promptArg) {
  console.error('Bitte gib eine Frage an GLM 5.3 Flash an. Beispiel: npx tsx scripts/ask-glm.ts "Wie funktioniert..."')
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

async function main() {
  const model = 'z-ai/glm-5.3-flash'
  
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'user', content: promptArg },
    ],
  })

  console.log(completion.choices[0]?.message?.content)
}

main().catch((err) => {
  console.error('Fehler bei der Abfrage von GLM 5.3 Flash:', err)
  process.exit(1)
})
