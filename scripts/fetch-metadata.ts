/**
 * Phase 2: Befüllt ⏳-Platzhalter im Datenhandbuch mit echten API-Metriken.
 *
 * Für jeden Datensatz in docs/datenhandbuch.md werden abgefragt:
 *   - Zeitraum (erstes und letztes Jahr)
 *   - Anzahl Serien
 *   - Anzahl Beobachtungen (gesamt, nicht-null)
 *
 * Ergebnis wird direkt in docs/datenhandbuch.md eingetragen.
 *
 * Ausführung: npx tsx scripts/fetch-metadata.ts
 * Optional:   npx tsx scripts/fetch-metadata.ts --dry-run   (nur Ausgabe, keine Dateiänderung)
 * Optional:   npx tsx scripts/fetch-metadata.ts --id DF_CLIMATE_GERMANY_TEMPERATURE_MEAN
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const HANDBOOK = resolve(ROOT, 'docs', 'datenhandbuch.md')
const BASE = 'https://daten.uba.de/release/rest'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const SINGLE_ID = args.includes('--id') ? args[args.indexOf('--id') + 1] : null
const DELAY_MS = 800  // höfliche Pause zwischen API-Calls

// ── Typen ───────────────────────────────────────────────────────────────────

interface DatasetMeta {
  id: string
  seriesCount: number
  obsCount: number
  firstYear: string
  lastYear: string
  error?: string
}

// ── API-Abfragen ─────────────────────────────────────────────────────────────

interface FlowInfo { id: string; version: string; agencyID: string }

async function fetchAllDataflows(): Promise<FlowInfo[]> {
  const url = `${BASE}/dataflow/all/all/latest`
  const r = await fetch(url, { headers: { Accept: 'application/json', 'Accept-Language': 'de' } })
  if (!r.ok) throw new Error(`Dataflows: HTTP ${r.status}`)
  const json = await r.json() as any
  const refs: Record<string, any> = json.references ?? {}
  return Object.values(refs)
    .filter((df: any) => df.id?.startsWith('DF_'))
    .map((df: any) => ({
      id:       df.id as string,
      version:  (df.version ?? '1.0') as string,
      agencyID: (df.agencyID ?? 'UBA') as string,
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

async function fetchMetadataForDataset(flow: FlowInfo): Promise<DatasetMeta> {
  const { id, version, agencyID } = flow
  const ref = `${agencyID},${id},${version}`

  // Erst CSV versuchen — schnell, vollständig, kein Duplicate-Key-Problem
  const csvUrl = `${BASE}/data/${ref}/all?format=csv`
  try {
    const r = await fetch(csvUrl, {
      headers: { Accept: 'text/csv', 'Accept-Language': 'de' },
    })
    if (r.ok) {
      const text = await r.text()
      const lines = text.trim().split('\n').filter(l => l.trim())
      if (lines.length > 1) {
        const sep = lines[0].includes(';') ? ';' : ','
        const header = lines[0].split(sep).map(h => h.trim().replace(/\r/g, ''))
        const timeCol = header.indexOf('TIME_PERIOD')
        const valCol  = header.indexOf('OBS_VALUE')

        if (timeCol >= 0 && valCol >= 0) {
          const years = new Set<string>()
          let obsCount = 0

          // Group by series key to count distinct series
          const seriesKeys = new Set<string>()
          const seriesCols = header.slice(1, timeCol)  // between DATAFLOW and TIME_PERIOD

          for (const line of lines.slice(1)) {
            const cols = line.split(sep).map(c => c.trim().replace(/\r/g, ''))
            const year = cols[timeCol]
            const val  = cols[valCol]
            if (year) years.add(year)
            if (val !== '' && val !== undefined) obsCount++

            const seriesKey = seriesCols.map((_c, i) => cols[i + 1]).join(':')
            seriesKeys.add(seriesKey)
          }

          const sortedYears = Array.from(years).sort()
          return {
            id,
            seriesCount: seriesKeys.size,
            obsCount,
            firstYear: sortedYears[0] ?? '?',
            lastYear:  sortedYears[sortedYears.length - 1] ?? '?',
          }
        }
      }
    }
  } catch (e) {
    // CSV fehlgeschlagen — weiter mit JSON-Fallback
  }

  // JSON-Fallback (kann Duplicate-Key-Probleme haben)
  const jsonUrl = `${BASE}/data/${ref}/all?format=jsondata`
  const r = await fetch(jsonUrl, {
    headers: {
      Accept: 'application/vnd.sdmx.data+json;version=2.0,application/json',
      'Accept-Language': 'de',
    },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)

  const json = await r.json() as any
  const envelope = json.data ?? json
  const datasets: any[] = envelope.dataSets ?? []
  const structures: any[] = envelope.structures ?? (json.structure ? [json.structure] : [])

  const struct = structures[0]
  const obsDims: any[] = struct?.dimensions?.observation ?? []
  const timeDim = obsDims.find((d: any) => d.id === 'TIME_PERIOD' || d.role === 'time') ?? obsDims[0]
  const timeValues: string[] = (timeDim?.values ?? []).map((v: any) => v.id ?? String(v))

  const rawSeries: Record<string, any> = datasets[0]?.series ?? {}
  const seriesCount = Object.keys(rawSeries).length

  const years = new Set<string>()
  let obsCount = 0

  for (const s of Object.values(rawSeries) as any[]) {
    const obs = s.observations ?? {}
    if (Array.isArray(obs)) {
      for (const entry of obs) {
        const year = timeValues[Number(entry[0])] ?? String(entry[0])
        if (year) years.add(year)
        if (entry[1] != null) obsCount++
      }
    } else {
      for (const [tIdx, val] of Object.entries(obs)) {
        const year = timeValues[Number(tIdx)] ?? tIdx
        years.add(year)
        const v = Array.isArray(val) ? val[0] : val
        if (v != null) obsCount++
      }
    }
  }

  const sortedYears = Array.from(years).sort()
  return {
    id,
    seriesCount,
    obsCount,
    firstYear: sortedYears[0] ?? '?',
    lastYear:  sortedYears[sortedYears.length - 1] ?? '?',
  }
}

// ── Markdown-Patching ────────────────────────────────────────────────────────

function patchHandbook(content: string, meta: DatasetMeta): string {
  if (meta.error) return content

  const zeitraum = `${meta.firstYear}–${meta.lastYear}`
  const serien   = meta.seriesCount.toLocaleString('de-DE')
  const obs      = meta.obsCount.toLocaleString('de-DE')

  // Replace ⏳-Platzhalter innerhalb des jeweiligen Datensatz-Blocks.
  // Muster: Zeilen direkt nach dem ### Heading mit dem passenden ID-Aufruf.
  // Wir patchen global alle Vorkommen — sie sind eindeutig durch den Kontext.

  // Zeitraum: "⏳ API-Daten ausstehend (erwartet: ...)" oder "⏳ API-Daten ausstehend"
  // Wir patchen nur innerhalb des richtigen Dataset-Blocks, indem wir nach der ID suchen.

  const datasetRegex = new RegExp(
    // Match von ### heading mit ID bis zum nächsten ### heading oder Seitenende
    `(###[^\\n]*\\(\`${escapeRegex(meta.id)}\`\\)[\\s\\S]*?)(?=\\n###|\\n---\\n\\n##|$)`,
    'g'
  )

  return content.replace(datasetRegex, (block) => {
    // Zeitraum
    block = block.replace(
      /\*\*Zeitraum:\*\* ⏳ API-Daten ausstehend[^\n]*/,
      `**Zeitraum:** ${zeitraum}`
    )
    // Serien (nur Zeile die exakt "**Serien:** ⏳" enthält, nicht Beobachtungen)
    block = block.replace(
      /\*\*Serien:\*\* ⏳\s*$/m,
      `**Serien:** ${serien}`
    )
    // Beobachtungen
    block = block.replace(
      /\*\*Beobachtungen:\*\* ⏳\s*$/m,
      `**Beobachtungen:** ${obs}`
    )
    return block
  })
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Hauptprogramm ────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log(`\n📖 Lade Datenhandbuch: ${HANDBOOK}`)
  let handbook = readFileSync(HANDBOOK, 'utf-8')

  // Alle Dataset-IDs aus dem Handbuch extrahieren (Reihenfolge beibehalten)
  const idMatches = [...handbook.matchAll(/### [^\n]+\(`(DF_[A-Z0-9_]+)`\)/g)]
  const handbookIds = idMatches.map(m => m[1])
  console.log(`   ${handbookIds.length} Datensätze im Handbuch gefunden`)

  // Dataflows laden um echte Versionen zu kennen
  console.log('🌐 Lade Dataflow-Index (Versionen)…')
  const allFlows = await fetchAllDataflows()
  const flowById = new Map(allFlows.map(f => [f.id, f]))
  console.log(`   ${allFlows.length} Dataflows von API erhalten\n`)

  // Bei --id: nur einen bestimmten Datensatz verarbeiten
  const idsToProcess = SINGLE_ID
    ? handbookIds.filter(id => id === SINGLE_ID)
    : handbookIds

  if (SINGLE_ID && idsToProcess.length === 0) {
    console.error(`\n❌ ID nicht im Handbuch gefunden: ${SINGLE_ID}`)
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log('🔍 DRY RUN — keine Dateiänderungen\n')
  }

  console.log(`🌐 Starte API-Abfragen für ${idsToProcess.length} Datensätze...\n`)

  const results: DatasetMeta[] = []
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < idsToProcess.length; i++) {
    const id = idsToProcess[i]
    const progress = `[${String(i + 1).padStart(2)}/${idsToProcess.length}]`

    const flow = flowById.get(id) ?? { id, version: '1.0', agencyID: 'UBA' }

    try {
      const meta = await fetchMetadataForDataset(flow)
      results.push(meta)
      successCount++
      console.log(`✅ ${progress} ${id}`)
      console.log(`         Zeitraum: ${meta.firstYear}–${meta.lastYear}  |  Serien: ${meta.seriesCount}  |  Obs: ${meta.obsCount}`)

      if (!DRY_RUN) {
        handbook = patchHandbook(handbook, meta)
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      results.push({ id, seriesCount: 0, obsCount: 0, firstYear: '?', lastYear: '?', error })
      errorCount++
      console.log(`❌ ${progress} ${id}`)
      console.log(`         Fehler: ${error}`)
    }

    // Pause zwischen Requests (außer nach dem letzten)
    if (i < idsToProcess.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  // Zusammenfassung
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅ ${successCount} erfolgreich  ❌ ${errorCount} Fehler`)

  if (errorCount > 0) {
    console.log('\n❌ Fehlerhafte Datensätze:')
    for (const r of results.filter(r => r.error)) {
      console.log(`   ${r.id}: ${r.error}`)
    }
  }

  // Handbuch schreiben
  if (!DRY_RUN) {
    writeFileSync(HANDBOOK, handbook, 'utf-8')
    console.log(`\n📝 Handbuch aktualisiert: ${HANDBOOK}`)

    // Offene Platzhalter zählen
    const remaining = (handbook.match(/⏳/g) ?? []).length
    if (remaining > 0) {
      console.log(`   ⚠️  ${remaining} ⏳-Platzhalter noch offen (vermutlich Fehler-Datensätze)`)
    } else {
      console.log('   🎉 Alle Platzhalter befüllt!')
    }
  }
}

main().catch(err => {
  console.error('\n💥 Unerwarteter Fehler:', err)
  process.exit(1)
})
