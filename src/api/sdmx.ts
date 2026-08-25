const BASE = 'https://daten.uba.de/release/rest'

const memoryCache = new Map<string, { timestamp: number; data: unknown }>()
const jsonInflightCache = new Map<string, Promise<unknown>>()

const defaultHeaders: Record<string, string> = typeof window === 'undefined' ? {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} : {}

export function splitFlowRef(flowRef: string): { agencyID: string; id: string; version: string } {
  const parts = flowRef.split(',')
  if (parts.length >= 3) return { agencyID: parts[0], id: parts[1], version: parts[2] }
  if (parts.length === 2) return { agencyID: parts[0], id: parts[1], version: '1.0' }
  return { agencyID: 'UBA', id: flowRef, version: '1.0' }
}

async function cachedFetchJson<T>(url: string, headers?: Record<string, string>, ttlMs = 60 * 60 * 1000): Promise<T> {
  const now = Date.now()
  const mem = memoryCache.get(url)
  if (mem && now - mem.timestamp < ttlMs) {
    return mem.data as T
  }

  const existingPromise = jsonInflightCache.get(url)
  if (existingPromise) {
    return existingPromise as Promise<T>
  }

  const load = async (): Promise<T> => {
    const cacheKey = `uba_cache_${url}`
    if (typeof sessionStorage !== 'undefined') {
      try {
        const item = sessionStorage.getItem(cacheKey)
        if (item) {
          const parsed = JSON.parse(item) as { timestamp: number; data: unknown }
          if (now - parsed.timestamp < ttlMs) {
            memoryCache.set(url, parsed)
            return parsed.data as T
          }
        }
      } catch {
        // SessionStorage unavailable
      }
    }

    try {
      const r = await fetch(url, { headers: { ...defaultHeaders, ...headers } })
      if (!r.ok) throw new Error(`API-Fehler ${r.status}`)
      const json = (await r.json()) as T
      const entry = { timestamp: now, data: json }
      memoryCache.set(url, entry)
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(entry))
        } catch {
          // Memory cache fallback
        }
      }
      return json
    } catch (err) {
      if (mem) return mem.data as T
      if (typeof sessionStorage !== 'undefined') {
        try {
          const item = sessionStorage.getItem(cacheKey)
          if (item) {
            const parsed = JSON.parse(item) as { data: unknown }
            return parsed.data as T
          }
        } catch {
          // Ignore
        }
      }
      throw err
    }
  }

  const p = load()
  jsonInflightCache.set(url, p as Promise<unknown>)
  p.finally(() => jsonInflightCache.delete(url))
  return p
}

export interface TimePoint { year: string; value: number }

export interface SdmxCode {
  id: string
  name?: string
}

export interface SdmxRef {
  id?: string
  name?: string
  description?: string
  agencyID?: string
  version?: string
  codes?: Record<string, SdmxCode>
  localRepresentation?: { enumeration?: string }
  dataStructureComponents?: {
    dimensionList?: {
      dimensions?: Array<{
        id: string
        names?: { de?: string; en?: string }
        position: number
        localRepresentation?: { enumeration?: string }
      }>
      timeDimension?: { id: string; position: number }
    }
  }
}

export interface SdmxDimensionValue {
  id?: string
  name?: string
  names?: { de?: string; en?: string }
  role?: string
}

export interface SdmxDimension {
  id: string
  name?: string
  names?: { de?: string; en?: string }
  position?: number
  role?: string
  values?: SdmxDimensionValue[]
}

export interface SdmxSeriesData {
  observations?: Record<string, number | null | (number | null)[]> | (number | null)[][]
}

async function fetchSdmxJson(flowRef: string, key = 'all'): Promise<{ series: Record<string, SdmxSeriesData>; timeValues: string[] }> {
  const fullRef = flowRef.includes(',') ? flowRef : `UBA,${flowRef},1.0`
  const keyPath = !key || key === '1.0' ? 'all' : key
  const url = `${BASE}/data/${fullRef}/${keyPath}?format=jsondata`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await cachedFetchJson<any>(url, { Accept: 'application/vnd.sdmx.data+json;version=2.0,application/json' })
  const env = json.data ?? json
  const structs: Array<{ dimensions?: { observation?: SdmxDimension[]; series?: SdmxDimension[] } }> = env.structures ?? (json.structure ? [json.structure] : [])
  const dsets: Array<{ series?: Record<string, SdmxSeriesData> }> = env.dataSets ?? []
  
  // Find time dimension values more robustly
  const obsDims = structs[0]?.dimensions?.observation ?? []
  const timeDim = obsDims.find((d) => d.id === 'TIME_PERIOD' || d.role === 'time') ?? obsDims[0]
  const tvals: SdmxDimensionValue[] = timeDim?.values ?? []
  
  const series = dsets[0]?.series ?? {}
  if (import.meta.env.DEV) {
    console.log(`[SDMX] Found ${Object.keys(series).length} series and ${tvals.length} time points for ${fullRef}`)
  }

  return {
    series,
    timeValues: tvals.map((v) => v.id ?? String(v)),
  }
}

/** Average all series per year, return sorted array with robust fallback */
export async function fetchAveragedSeries(flowRef: string, key = 'all'): Promise<TimePoint[]> {
  try {
    const { series, timeValues } = await fetchSdmxJson(flowRef, key)
    if (Object.keys(series).length > 0) {
      const acc: Record<string, number[]> = {}
      for (const sv of Object.values(series)) {
        const rawObs = sv.observations ?? {}
        const entries = Array.isArray(rawObs)
          ? rawObs.map((item, idx) => [String(item[0] ?? idx), item[1]] as [string, unknown])
          : Object.entries(rawObs)
        for (const [tidx, val] of entries) {
          const yr = timeValues[Number(tidx)] ?? tidx
          const v = Array.isArray(val) ? (val[0] as number | null) : (typeof val === 'number' ? val : null)
          if (v != null) (acc[yr] ??= []).push(v)
        }
      }
      const res = Object.entries(acc)
        .map(([year, vs]) => ({ year, value: vs.reduce((a, b) => a + b, 0) / vs.length }))
        .sort((a, b) => a.year.localeCompare(b.year))
      if (res.length > 0) return res
    }
  } catch (err) {
    console.warn(`[fetchAveragedSeries] SdmxJson failed for ${flowRef}, attempting fetchData fallback...`, err)
  }

  // Fallback: Use robust fetchData pipeline
  const { agencyID, id: flowId, version } = splitFlowRef(flowRef)
  const result = await fetchData({ id: flowId, agencyID, version, name: '', description: '', category: categoryFromId(flowId) }, 'all')
  const acc: Record<string, number[]> = {}
  for (const s of Object.values(result.seriesMap)) {
    for (const [yr, val] of Object.entries(s.observations)) {
      if (val != null) (acc[yr] ??= []).push(val)
    }
  }
  return Object.entries(acc)
    .map(([year, vs]) => ({ year, value: vs.reduce((a, b) => a + b, 0) / vs.length }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

/** Pick a single named series by 0-based series index with robust fallback */
export async function fetchSingleSeries(flowRef: string, key = 'all', seriesIndex = 0): Promise<TimePoint[]> {
  try {
    const { series, timeValues } = await fetchSdmxJson(flowRef, key)
    const sv = Object.values(series)[seriesIndex]
    if (sv) {
      const rawObs = sv.observations ?? {}
      const entries = Array.isArray(rawObs)
        ? rawObs.map((item, idx) => [String(item[0] ?? idx), item[1]] as [string, unknown])
        : Object.entries(rawObs)
      const res = entries
        .map(([tidx, val]) => ({
          year: timeValues[Number(tidx)] ?? tidx,
          value: Array.isArray(val) ? (val[0] as number) : (val as number),
        }))
        .filter((p) => p.value != null)
        .sort((a, b) => a.year.localeCompare(b.year))
      if (res.length > 0) return res
    }
  } catch (err) {
    console.warn(`[fetchSingleSeries] SdmxJson failed for ${flowRef}, attempting fetchData fallback...`, err)
  }

  // Fallback: Use robust fetchData pipeline
  const { agencyID, id: flowId, version } = splitFlowRef(flowRef)
  const result = await fetchData({ id: flowId, agencyID, version, name: '', description: '', category: categoryFromId(flowId) }, 'all')
  const firstSeries = Object.values(result.seriesMap)[seriesIndex] || Object.values(result.seriesMap)[0]
  if (!firstSeries) return []

  return Object.entries(firstSeries.observations)
    .filter(([, val]) => val != null)
    .map(([year, val]) => ({ year, value: val as number }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

/** Fetch CSV text with cache */
const csvTextCache = new Map<string, Promise<string>>()

export async function fetchCsvText(url: string): Promise<string> {
  const cached = csvTextCache.get(url)
  if (cached) return cached
  const load = async (attempt = 0): Promise<string> => {
    try {
      const r = await fetch(url, { headers: { Accept: 'text/csv', ...defaultHeaders } })
      if (!r.ok) throw new Error(`CSV fetch failed ${r.status}`)
      return await r.text()
    } catch (e) {
      if (attempt >= 1) throw e
      await new Promise((res) => setTimeout(res, 800))
      return load(attempt + 1)
    }
  }
  const p = load()
  p.catch(() => csvTextCache.delete(url))
  csvTextCache.set(url, p)
  return p
}

/** Canonical SDMX CSV Parser */
export interface ParsedSdmxCsvRow {
  codes: string[]
  time: string
  value: number | null
}

export interface ParsedSdmxCsv {
  colIds: string[]
  rows: ParsedSdmxCsvRow[]
  byKey: Record<string, { codes: string[]; obs: Record<string, number | null> }>
}

export function parseSdmxCsv(text: string): ParsedSdmxCsv {
  const lines = text.trim().split('\n')
  if (lines.length === 0 || !lines[0].trim()) {
    return { colIds: [], rows: [], byKey: {} }
  }
  const sep = lines[0].includes(';') ? ';' : ','
  const header = lines[0].split(sep).map((h) => h.trim().replace(/\r/g, ''))
  const timeCol = header.indexOf('TIME_PERIOD')
  const valCol = header.indexOf('OBS_VALUE')
  const colIds = timeCol !== -1 ? header.slice(1, timeCol) : header.slice(1, -1)

  const rows: ParsedSdmxCsvRow[] = []
  const byKey: Record<string, { codes: string[]; obs: Record<string, number | null> }> = {}

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const cols = line.split(sep).map((c) => c.trim().replace(/\r/g, ''))
    const codes = colIds.map((_c, i) => cols[i + 1] ?? '')
    const time = timeCol !== -1 ? (cols[timeCol] ?? '') : ''
    const rawVal = valCol !== -1 ? cols[valCol] : ''
    const normalizedVal = rawVal ? rawVal.replace(',', '.') : ''
    const val = normalizedVal !== '' ? parseFloat(normalizedVal) : null
    const finalVal = val !== null && !isNaN(val) ? val : null

    rows.push({ codes, time, value: finalVal })

    const key = codes.join(':')
    if (!byKey[key]) byKey[key] = { codes, obs: {} }
    if (time) byKey[key].obs[time] = finalVal
  }

  return { colIds, rows, byKey }
}

export async function fetchCsvSeries(
  flowId: string,
  version = '1.0',
): Promise<Record<string, { codes: string[]; colIds: string[]; obs: Record<string, number | null> }>> {
  const cleanFlow = flowId.includes(',') ? flowId.split(',')[1] : flowId
  let text: string
  try {
    text = await fetchCsvText(`https://daten.uba.de/release/rest/data/UBA,${cleanFlow},${version}/all?format=csv`)
  } catch {
    text = await fetchCsvText(`https://daten.uba.de/release/rest/data/UBA,${cleanFlow},${version}/.?format=csv`)
  }
  const parsed = parseSdmxCsv(text)
  const result: Record<string, { codes: string[]; colIds: string[]; obs: Record<string, number | null> }> = {}
  for (const [key, val] of Object.entries(parsed.byKey)) {
    result[key] = { codes: val.codes, colIds: parsed.colIds, obs: val.obs }
  }
  return result
}

export async function fetchCsvAveraged(
  flowId: string,
  version = '1.0',
  filters: Record<string, string> = {},
): Promise<TimePoint[]> {
  const csv = await fetchCsvSeries(flowId, version)
  const acc: Record<string, number[]> = {}
  for (const { codes, colIds, obs } of Object.values(csv)) {
    const matches = Object.entries(filters).every(([dimId, code]) => {
      const idx = colIds.indexOf(dimId)
      return idx !== -1 && codes[idx] === code
    })
    if (Object.keys(filters).length > 0 && !matches) continue
    for (const [year, val] of Object.entries(obs)) {
      if (val != null && !isNaN(val)) (acc[year] ??= []).push(val)
    }
  }
  return Object.entries(acc)
    .map(([year, vs]) => ({ year, value: +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(2) }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

export async function fetchDataSingleSeries(
  flowId: string,
  version = '1.0',
  filters: Record<string, string> = {},
): Promise<TimePoint[]> {
  const csv = await fetchCsvSeries(flowId, version)
  for (const { codes, colIds, obs } of Object.values(csv)) {
    const matches = Object.entries(filters).every(([dimId, code]) => {
      const idx = colIds.indexOf(dimId)
      return idx !== -1 && codes[idx] === code
    })
    if (!matches) continue
    return Object.entries(obs)
      .map(([year, val]) => ({ year, value: val as number }))
      .filter((p) => p.value != null && !isNaN(p.value))
      .sort((a, b) => a.year.localeCompare(b.year))
  }
  return []
}

/** Fetch multiple named series, returns { label → TimePoint[] } */
export async function fetchNamedSeries(
  flowRef: string,
  key: string,
  labelMap: Record<string, string>,  // seriesKey → display label
): Promise<Record<string, TimePoint[]>> {
  const { series, timeValues } = await fetchSdmxJson(flowRef, key)
  const result: Record<string, TimePoint[]> = {}
  for (const [seriesKey, label] of Object.entries(labelMap)) {
    const sv = series[seriesKey]
    if (!sv) continue
    const rawObs = sv.observations ?? {}
    const entries = Array.isArray(rawObs)
      ? rawObs.map((item, idx) => [String(item[0] ?? idx), item[1]] as [string, unknown])
      : Object.entries(rawObs)
    result[label] = entries
      .map(([tidx, val]) => ({
        year: timeValues[Number(tidx)] ?? tidx,
        value: Array.isArray(val) ? (val[0] as number) : (val as number),
      }))
      .filter((p) => p.value != null)
      .sort((a, b) => a.year.localeCompare(b.year))
  }
  return result
}

export interface Dataflow {
  id: string
  name: string
  description: string
  agencyID: string
  version: string
  category: string
}

export interface DimensionValue {
  id: string
  name: string
}

export interface Dimension {
  id: string
  name: string
  description?: string
  position: number
  values: DimensionValue[]
}

export interface SeriesPoint {
  year: number
  value: number | null
}

export interface Series {
  key: string
  label: string
  data: SeriesPoint[]
}

export interface DatasetStructure {
  title: string
  description: string
  seriesDimensions: Dimension[]
  timeDimension: Dimension
}

function categoryFromId(id: string): string {
  return id.replace(/^DF_/, '').split('_')[0]
}

export async function fetchDataflows(): Promise<Dataflow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await cachedFetchJson<any>(`${BASE}/dataflow/all/all/latest`, { Accept: 'application/json' })
  const refs: Record<string, SdmxRef> = json.references ?? {}
  return Object.values(refs).map((df) => ({
    id: df.id ?? '',
    name: df.name ?? df.id ?? '',
    description: (df.description ?? '').replace(/<[^>]+>/g, ''),
    agencyID: df.agencyID ?? 'UBA',
    version: df.version ?? '1.0',
    category: categoryFromId(df.id ?? ''),
  }))
}

export async function fetchSingleDataflow(id: string): Promise<Dataflow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await cachedFetchJson<any>(`${BASE}/dataflow/UBA/${id}/latest`, { Accept: 'application/json' })
  const refs: Record<string, SdmxRef> = json.references ?? {}
  const df = Object.values(refs).find((v) => v.id === id) ?? Object.values(refs)[0]
  if (!df) throw new Error('Datensatz nicht gefunden')
  return {
    id: df.id ?? id,
    name: df.name ?? id,
    description: (df.description ?? '').replace(/<[^>]+>/g, ''),
    agencyID: df.agencyID ?? 'UBA',
    version: df.version ?? '1.0',
    category: categoryFromId(df.id ?? id),
  }
}

export async function fetchStructure(flow: Dataflow): Promise<DatasetStructure> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await cachedFetchJson<any>(
    `${BASE}/dataflow/${flow.agencyID}/${flow.id}/latest?references=datastructure`,
    { Accept: 'application/json' },
  )
  const refs: Record<string, SdmxRef> = json.references ?? {}

  // Find the data structure definition
  const dsdEntry = Object.values(refs).find(
    (v) => v.id && !v.id.startsWith('DF_'),
  )

  const dims: Dimension[] = []
  let timeDim: Dimension = { id: 'TIME_PERIOD', name: 'Jahr', position: 0, values: [] }

  if (dsdEntry?.dataStructureComponents?.dimensionList?.dimensions) {
    for (const d of dsdEntry.dataStructureComponents.dimensionList.dimensions) {
      const vals: DimensionValue[] = []
      const enumRef = d.localRepresentation?.enumeration
      if (enumRef) {
        const cl = refs[enumRef]
        if (cl?.codes) {
          for (const code of Object.values(cl.codes)) {
            vals.push({ id: code.id, name: code.name ?? code.id })
          }
        }
      }
      dims.push({ id: d.id, name: d.names?.de ?? d.names?.en ?? d.id, position: d.position - 1, values: vals })
    }
    const td = dsdEntry.dataStructureComponents.dimensionList.timeDimension
    if (td) {
      timeDim = { id: td.id, name: 'Zeitraum', position: td.position - 1, values: [] }
    }
  }

  const flowRef = Object.values(refs).find((v) => v.id === flow.id)
  return {
    title: flowRef?.name ?? flow.name,
    description: (flowRef?.description ?? flow.description).replace(/<[^>]+>/g, ''),
    seriesDimensions: dims.filter((d) => d.id !== timeDim.id),
    timeDimension: timeDim,
  }
}

export async function fetchData(flow: Dataflow, key = 'all'): Promise<{
  structure: DatasetStructure | null
  seriesMap: Record<string, { dimValues: string[]; observations: Record<string, number | null> }>
  timeValues: string[]
  seriesDimensions: Dimension[]
}> {
  const url = `${BASE}/data/${flow.agencyID},${flow.id},${flow.version}/${key}?format=jsondata`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await cachedFetchJson<any>(url, {
    Accept: 'application/vnd.sdmx.data+json;version=2.0,application/json',
    'Accept-Language': 'de',
  })

  // Support both SDMX-JSON v1 and v2 envelopes
  const envelope = json.data ?? json
  const datasets: Array<{ series?: Record<string, SdmxSeriesData> }> = envelope.dataSets ?? []
  const structures: Array<{ dimensions?: { series?: SdmxDimension[]; observation?: SdmxDimension[] } }> = envelope.structures ?? (json.structure ? [json.structure] : [])

  const struct = structures[0]

  const dims: Dimension[] = []
  let timeValues: string[] = []

  if (struct?.dimensions) {
    const seriesDims: SdmxDimension[] = struct.dimensions.series ?? []
    const obsDims: SdmxDimension[] = struct.dimensions.observation ?? []

    for (const d of seriesDims) {
      dims.push({
        id: d.id,
        name: d.names?.de ?? d.names?.en ?? d.name ?? d.id,
        position: d.position ?? dims.length,
        values: (d.values ?? []).map((v) => ({ id: v.id ?? String(v), name: v.names?.de ?? v.names?.en ?? v.name ?? v.id ?? String(v) })),
      })
    }
    if (obsDims.length > 0) {
      const timeDim = obsDims.find((d) => d.id === 'TIME_PERIOD' || d.role === 'time') ?? obsDims[0]
      timeValues = (timeDim.values ?? []).map((v) => v.id ?? String(v))
    }
  }

  const ds = datasets[0] ?? {}
  const rawSeries: Record<string, SdmxSeriesData> = ds.series ?? {}

  // If timeValues came back empty, reconstruct from observation keys (fallback for non-standard SDMX responses)
  if (timeValues.length === 0 && Object.keys(rawSeries).length > 0) {
    const firstSeries = Object.values(rawSeries)[0]
    const obsObj = firstSeries?.observations ?? {}
    const obsKeys = (Array.isArray(obsObj) ? obsObj.map((item, idx) => Number(item[0] ?? idx)) : Object.keys(obsObj).map(Number)).sort((a, b) => a - b)
    // Check if the keys look like years (1990–2100) or indices
    if (obsKeys.every(k => k >= 1900 && k <= 2200)) {
      timeValues = obsKeys.map(String)
    }
  }

  const seriesMap: Record<string, { dimValues: string[]; observations: Record<string, number | null> }> = {}
  for (const [seriesKey, s] of Object.entries(rawSeries)) {
    const indices = seriesKey.split(':').map(Number)
    const dimValues = indices.map((idx, i) => dims[i]?.values[idx]?.name ?? String(idx))
    const obs: Record<string, number | null> = {}
    const rawObs = s.observations ?? {}

    if (Array.isArray(rawObs)) {
      // SDMX-JSON 2.0: observations is an array of [timeIndex, value, ...attributes]
      for (const entry of rawObs) {
        const tIdx = entry[0]
        const val = entry[1]
        const year = timeValues[Number(tIdx)] ?? String(tIdx)
        obs[year] = typeof val === 'number' ? val : null
      }
    } else {
      // SDMX-JSON 1.0: observations is an object { "timeIndex": [value, ...] }
      for (const [tIdx, val] of Object.entries(rawObs)) {
        const numIdx = Number(tIdx)
        const year = timeValues.length > 0 ? (timeValues[numIdx] ?? tIdx) : tIdx
        obs[year] = Array.isArray(val) ? (val[0] as number | null) : (typeof val === 'number' ? val : null)
      }
    }

    seriesMap[seriesKey] = { dimValues, observations: obs }
  }

  // If timeValues still empty, derive sorted list from what we collected in observations
  if (timeValues.length === 0 && Object.keys(seriesMap).length > 0) {
    const allYears = new Set<string>()
    for (const s of Object.values(seriesMap)) {
      for (const y of Object.keys(s.observations)) allYears.add(y)
    }
    timeValues = Array.from(allYears).sort()
  }

  // Always sort timeValues chronologically — the API does not guarantee order
  timeValues.sort((a, b) => a.localeCompare(b))

  // Sparse data fallback: try CSV if the JSON observations look incomplete.
  const obsCounts = Object.values(seriesMap).map(s => Object.keys(s.observations).length)
  const seriesCount = obsCounts.length
  const totalObs = obsCounts.reduce((n, c) => n + c, 0)
  const maxObs = seriesCount ? Math.max(...obsCounts) : 0
  const minObs = seriesCount ? Math.min(...obsCounts) : 0
  const isSparse = totalObs <= seriesCount * 2 || (maxObs >= 10 && minObs <= 2)

  if (isSparse && Object.keys(seriesMap).length > 0) {
    try {
      const csvUrl = `${BASE}/data/${flow.agencyID},${flow.id},${flow.version}/${key}?format=csv`
      const csvR = await fetch(csvUrl, { headers: { Accept: 'text/csv', 'Accept-Language': 'de' } })
      if (csvR.ok) {
        const text = await csvR.text()
        const lines = text.trim().split('\n')
        const sep = lines[0].includes(';') ? ';' : ','
        const header = lines[0].split(sep).map(h => h.trim().replace(/\r/g, ''))
        const timeCol = header.indexOf('TIME_PERIOD')
        const valCol = header.indexOf('OBS_VALUE')
        const seriesCols = header.slice(1, timeCol)

        const dimById: Record<string, Record<string, string>> = {}
        for (const d of dims) {
          dimById[d.id] = {}
          for (const v of d.values) dimById[d.id][v.id] = v.name
        }

        const csvSeries: Record<string, { codes: string[]; obs: Record<string, number | null> }> = {}
        for (const line of lines.slice(1)) {
          if (!line.trim()) continue
          const cols = line.split(sep).map(c => c.trim().replace(/\r/g, ''))
          const codes = seriesCols.map((_c, i) => cols[i + 1])
          const codeKey = codes.join(':')
          const year = cols[timeCol]
          const raw = cols[valCol]
          const val = raw !== '' ? parseFloat(raw) : null
          if (!csvSeries[codeKey]) csvSeries[codeKey] = { codes, obs: {} }
          csvSeries[codeKey].obs[year] = isNaN(val as number) ? null : val
        }

        const newSeriesMap: typeof seriesMap = {}
        const newTimeValues = new Set<string>()

        for (const { codes, obs } of Object.values(csvSeries)) {
          const dimValues = codes.map((code, i) => dimById[seriesCols[i]]?.[code] ?? code)
          const stableKey = codes.join(':')
          newSeriesMap[stableKey] = { dimValues, observations: obs }
          for (const y of Object.keys(obs)) newTimeValues.add(y)
        }

        const csvDims: Dimension[] = seriesCols.map((colId, pos) => {
          const existingDim = dims.find(d => d.id === colId)
          const uniqueCodes = [...new Set(Object.values(csvSeries).map(s => s.codes[pos]))]
          const values = uniqueCodes.map(code => ({
            id: code,
            name: dimById[colId]?.[code] ?? code,
          }))
          return {
            id: colId,
            name: existingDim?.name ?? colId,
            position: pos,
            values,
          }
        })

        if (Object.keys(newSeriesMap).length > 0) {
          return {
            structure: null,
            seriesMap: newSeriesMap,
            timeValues: Array.from(newTimeValues).sort(),
            seriesDimensions: csvDims,
          }
        }
      }
    } catch {
      // CSV fallback failed — return what we have from JSON
    }
  }

  return { structure: null, seriesMap, timeValues, seriesDimensions: dims }
}
