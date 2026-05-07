/**
 * Generates editorial draft content for dataset descriptions using the Claude API.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-descriptions.ts
 *
 * Options:
 *   --flow <id>     Only process a specific flow ID
 *   --all           Re-generate even already "reviewed" entries (use with care)
 *   --dry-run       Print generated content without writing to file
 *
 * The script:
 *   1. Fetches all dataflows from the UBA SDMX API
 *   2. Skips flows that already have a "reviewed" entry in datasetContent.ts
 *   3. For each remaining flow, calls Claude with a structured prompt
 *   4. Appends the result to src/data/datasetContent.ts with status "draft"
 *
 * After running: review the "draft" entries, correct them, and set status to "reviewed".
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_FILE = path.join(__dirname, '../src/data/datasetContent.ts')
const SDMX_BASE = 'https://daten.uba.de/release/rest'

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const targetFlow = args.includes('--flow') ? args[args.indexOf('--flow') + 1] : null
const forceAll = args.includes('--all')
const dryRun = args.includes('--dry-run')

// ─── Fetch flows from SDMX API ───────────────────────────────────────────────

interface RawFlow {
  id: string
  name: string
  description: string
  agencyID: string
  version: string
  category: string
}

function httpGet(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json', ...headers } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return }
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

async function fetchFlows(): Promise<RawFlow[]> {
  const url = `${SDMX_BASE}/dataflow/UBA/all/latest`
  const json: any = await httpGet(url)

  // references is a plain object keyed by some id string, values are dataflow objects
  const refs: Record<string, any> = json.references ?? {}
  const flows: RawFlow[] = []

  for (const df of Object.values(refs)) {
    const id: string = df?.id ?? ''
    if (!id.startsWith('DF_')) continue

    const name: string = df.name ?? id
    const rawDesc: string = df.description ?? ''
    const description = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const agencyID: string = df.agencyID ?? 'UBA'
    const version: string = df.version ?? '1.0'
    const category = id.replace(/^DF_/, '').split('_')[0] ?? 'UNKNOWN'

    flows.push({ id, name, description, agencyID, version, category })
  }

  return flows
}

// ─── Read existing content file ───────────────────────────────────────────────

function getExistingIds(): Set<string> {
  const src = fs.readFileSync(CONTENT_FILE, 'utf-8')
  const matches = src.matchAll(/^\s{2}(DF_[A-Z0-9_]+):\s*\{/gm)
  const ids = new Set<string>()
  for (const m of matches) ids.add(m[1])
  return ids
}

function getReviewedIds(): Set<string> {
  const src = fs.readFileSync(CONTENT_FILE, 'utf-8')
  const reviewed = new Set<string>()
  // Simple heuristic: find blocks that contain status: 'reviewed'
  const blocks = src.split(/\n  DF_/)
  for (const block of blocks) {
    const idMatch = block.match(/^([A-Z0-9_]+):/)
    if (!idMatch) continue
    if (block.includes("status: 'reviewed'")) reviewed.add(idMatch[1])
  }
  return reviewed
}

// ─── Claude prompt ────────────────────────────────────────────────────────────

function buildPrompt(flow: RawFlow): string {
  return `You are a science editor writing for an environmental data platform aimed at educated, curious readers — politicians, journalists, students, and engaged citizens. Not scientists.

Given this dataset from Germany's Federal Environment Agency (UBA):

ID: ${flow.id}
Name: ${flow.name}
Technical description: ${flow.description || '(none provided)'}
Category: ${flow.category}

Write editorial content in GERMAN with these exact fields. Be concrete, avoid filler words like "wichtig", "relevant", "bedeutsam". Use active verbs. No bullet points in the output — flowing prose only.

Return ONLY a valid JSON object (no markdown, no explanation):

{
  "headline": "One bold claim or finding — a statement, not a title. Max 12 words. Should work as a standalone sentence.",
  "lead": "2-3 sentences: What does this dataset measure, and why should a non-expert care? No jargon.",
  "trend": "What does the current development show? Be specific about direction, magnitude, and timeframe if possible. 2-3 sentences.",
  "context": "Political, scientific, or societal context. What decisions depend on this data? What targets or laws apply? 2-3 sentences.",
  "methodology": "What exactly is measured? What are the key limitations or caveats a reader should know? 2 sentences max."
}`
}

// ─── Generate via Claude ──────────────────────────────────────────────────────

async function generateContent(client: Anthropic, flow: RawFlow): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildPrompt(flow) }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  // Strip markdown code fences if present
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
  const parsed = JSON.parse(text)

  // Validate all required fields exist
  const required = ['headline', 'lead', 'trend', 'context', 'methodology']
  for (const field of required) {
    if (!parsed[field]) throw new Error(`Missing field: ${field}`)
  }

  return parsed
}

// ─── Format as TypeScript entry ──────────────────────────────────────────────

function formatEntry(flowId: string, content: any): string {
  const esc = (s: string) => s.replace(/'/g, "\\'")
  return `
  // AUTO-GENERATED DRAFT — please review and set status to 'reviewed'
  ${flowId}: {
    headline: '${esc(content.headline)}',
    lead: '${esc(content.lead)}',
    trend: '${esc(content.trend)}',
    context: '${esc(content.context)}',
    methodology: '${esc(content.methodology)}',
    status: 'draft',
  },
`
}

// ─── Append to content file ───────────────────────────────────────────────────

function appendToFile(entry: string) {
  let src = fs.readFileSync(CONTENT_FILE, 'utf-8')
  // Insert before the closing `}` of DATASET_CONTENT (marked by the blank line + } + \n\n/** pattern)
  const marker = '\n}\n\n/**'
  const insertPoint = src.indexOf(marker)
  if (insertPoint === -1) throw new Error('Could not find DATASET_CONTENT closing brace in file')
  src = src.slice(0, insertPoint) + '\n' + entry + src.slice(insertPoint)
  fs.writeFileSync(CONTENT_FILE, src, 'utf-8')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable not set.')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  console.log('Fetching flows from UBA SDMX API...')
  const flows = await fetchFlows()
  console.log(`Found ${flows.length} flows.`)

  const existingIds = getExistingIds()
  const reviewedIds = getReviewedIds()

  const toProcess = flows.filter((f) => {
    if (targetFlow && f.id !== targetFlow) return false
    if (!forceAll && reviewedIds.has(f.id)) return false  // skip reviewed
    if (!forceAll && existingIds.has(f.id)) return false  // skip existing drafts
    return true
  })

  if (toProcess.length === 0) {
    console.log('Nothing to generate. Use --all to re-generate existing entries.')
    return
  }

  console.log(`Generating content for ${toProcess.length} flow(s)...\n`)

  for (const flow of toProcess) {
    process.stdout.write(`  ${flow.id} ... `)
    try {
      const content = await generateContent(client, flow)
      const entry = formatEntry(flow.id, content)

      if (dryRun) {
        console.log('\n' + entry)
      } else {
        appendToFile(entry)
        console.log('done')
      }

      // Rate limit: 1 request per second to be safe
      await new Promise((r) => setTimeout(r, 1000))
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`)
    }
  }

  console.log('\nDone. Review draft entries in src/data/datasetContent.ts')
}

main().catch((e) => { console.error(e); process.exit(1) })
