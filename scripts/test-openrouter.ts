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

async function main() {
  console.log('Testing OpenRouter connection...')
  const model = 'z-ai/glm-5.3-flash'
  console.log(`Sending prompt to model: ${model}`)

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'user', content: 'Antworte kurz in 1 Satz: Ist OpenRouter erfolgreich verbunden?' },
    ],
  })

  const responseText = completion.choices[0]?.message?.content
  console.log('\n--- Antwort von OpenRouter ---')
  console.log(responseText)
  console.log('------------------------------')
  console.log('Test erfolgreich!')
}

main().catch((err) => {
  console.error('OpenRouter Test Fehlschlag:', err)
  process.exit(1)
})
