const BASE = 'https://daten.uba.de/release/rest'

export interface TimePoint { year: string; value: number }

async function fetchSdmxJson(flowRef: string, key = 'all'): Promise<{ series: Record<string, any>; timeValues: string[] }> {
  const url = `${BASE}/data/${flowRef}/${key}?format=jsondata`
  console.log(`[SDMX] Fetching: ${url}`)
  const r = await fetch(url, { headers: { Accept: 'application/vnd.sdmx.data+json;version=2.0,application/json' } })
  const json = await r.json()
  const env = json.data ?? json
  const structs: any[] = env.structures ?? (json.structure ? [json.structure] : [])
  const dsets: any[] = env.dataSets ?? []
  
  // Find time dimension values more robustly
  const obsDims = structs[0]?.dimensions?.observation ?? []
  const timeDim = obsDims.find((d: any) => d.id === 'TIME_PERIOD' || d.role === 'time') ?? obsDims[0]
  const tvals: any[] = timeDim?.values ?? []
  
  const series = dsets[0]?.series ?? {}
  console.log(`[SDMX] Found ${Object.keys(series).length} series and ${tvals.length} time points`)
  
  return {
    series,
    timeValues: tvals.map((v: any) => v.id ?? String(v)),
  }
}

/** Average all series per year, return sorted array */
export async function fetchAveragedSeries(flowRef: string, key = 'all'): Promise<TimePoint[]> {
  const { series, timeValues } = await fetchSdmxJson(flowRef, key)
  const acc: Record<string, number[]> = {}
  for (const sv of Object.values(series) as any[]) {
    for (const [tidx, val] of Object.entries(sv.observations ?? {})) {
      const yr = timeValues[Number(tidx)] ?? tidx
      // Handle both array [value, status] and direct value
      const v = Array.isArray(val) ? (val[0] as number | null) : (typeof val === 'number' ? val : null)
      if (v != null) (acc[yr] ??= []).push(v)
    }
  }
  return Object.entries(acc)
    .map(([year, vs]) => ({ year, value: vs.reduce((a, b) => a + b, 0) / vs.length }))
    .sort((a, b) => a.year.localeCompare(b.year))
}

/** Pick a single named series by 0-based series index */
export async function fetchSingleSeries(flowRef: string, key = 'all', seriesIndex = 0): Promise<TimePoint[]> {
  const { series, timeValues } = await fetchSdmxJson(flowRef, key)
  const sv = Object.values(series)[seriesIndex] as any
  if (!sv) return []
  return Object.entries(sv.observations ?? {})
    .map(([tidx, val]) => ({
      year: timeValues[Number(tidx)] ?? tidx,
      value: Array.isArray(val) ? (val[0] as number) : (val as number),
    }))
    .filter((p) => p.value != null)
    .sort((a, b) => a.year.localeCompare(b.year))
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
    const sv = series[seriesKey] as any
    if (!sv) continue
    result[label] = Object.entries(sv.observations ?? {})
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
  const r = await fetch(`${BASE}/dataflow/all/all/latest`, {
    headers: { Accept: 'application/json' },
  })
  const json = await r.json()
  const refs: Record<string, any> = json.references ?? {}
  return Object.values(refs).map((df: any) => ({
    id: df.id,
    name: df.name ?? df.id,
    description: (df.description ?? '').replace(/<[^>]+>/g, ''),
    agencyID: df.agencyID ?? 'UBA',
    version: df.version ?? '1.0',
    category: categoryFromId(df.id),
  }))
}

export async function fetchStructure(flow: Dataflow): Promise<DatasetStructure> {
  const r = await fetch(
    `${BASE}/dataflow/${flow.agencyID}/${flow.id}/latest?references=datastructure`,
    { headers: { Accept: 'application/json' } },
  )
  const json = await r.json()
  const refs: Record<string, any> = json.references ?? {}

  // Find the data structure definition
  const dsdEntry = Object.values(refs).find(
    (v: any) => v.id && !v.id.startsWith('DF_'),
  ) as any

  const dims: Dimension[] = []
  let timeDim: Dimension = { id: 'TIME_PERIOD', name: 'Jahr', position: 0, values: [] }

  if (dsdEntry?.dataStructureComponents?.dimensionList?.dimensions) {
    for (const d of dsdEntry.dataStructureComponents.dimensionList.dimensions) {
      const vals: DimensionValue[] = []
      const enumRef = d.localRepresentation?.enumeration
      if (enumRef) {
        const cl = refs[enumRef] as any
        if (cl?.codes) {
          for (const code of Object.values(cl.codes) as any[]) {
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

  const flowRef = Object.values(refs).find((v: any) => v.id === flow.id) as any
  return {
    title: flowRef?.name ?? flow.name,
    description: (flowRef?.description ?? flow.description).replace(/<[^>]+>/g, ''),
    seriesDimensions: dims.filter((d) => d.id !== timeDim.id),
    timeDimension: timeDim,
  }
}

export async function fetchData(flow: Dataflow): Promise<{
  structure: DatasetStructure | null
  seriesMap: Record<string, { dimValues: string[]; observations: Record<string, number | null> }>
  timeValues: string[]
  seriesDimensions: Dimension[]
}> {
  const url = `${BASE}/data/${flow.agencyID},${flow.id},${flow.version}/all?format=jsondata`
  const r = await fetch(url, {
    headers: { Accept: 'application/vnd.sdmx.data+json;version=2.0,application/json' },
  })
  const json = await r.json()

  // Support both SDMX-JSON v1 and v2 envelopes
  const envelope = json.data ?? json
  const datasets: any[] = envelope.dataSets ?? []
  const structures: any[] = envelope.structures ?? (json.structure ? [json.structure] : [])

  const struct = structures[0]

  const dims: Dimension[] = []
  let timeValues: string[] = []

  if (struct?.dimensions) {
    const seriesDims: any[] = struct.dimensions.series ?? []
    const obsDims: any[] = struct.dimensions.observation ?? []

    for (const d of seriesDims) {
      dims.push({
        id: d.id,
        name: d.names?.de ?? d.names?.en ?? d.name ?? d.id,
        position: d.position ?? dims.length,
        values: (d.values ?? []).map((v: any) => ({ id: v.id ?? String(v), name: v.names?.de ?? v.names?.en ?? v.name ?? v.id ?? String(v) })),
      })
    }
    if (obsDims.length > 0) {
      const timeDim = obsDims.find((d: any) => d.id === 'TIME_PERIOD' || d.role === 'time') ?? obsDims[0]
      timeValues = (timeDim.values ?? []).map((v: any) => v.id ?? String(v))
    }
  }

  const ds = datasets[0] ?? {}
  const rawSeries: Record<string, any> = ds.series ?? {}

  // If timeValues came back empty, reconstruct from observation keys (fallback for non-standard SDMX responses)
  if (timeValues.length === 0 && Object.keys(rawSeries).length > 0) {
    const firstSeries = Object.values(rawSeries)[0] as any
    const obsKeys = Object.keys(firstSeries?.observations ?? {}).map(Number).sort((a, b) => a - b)
    // Check if the keys look like years (1990–2100) or indices
    if (obsKeys.every(k => k >= 1900 && k <= 2200)) {
      timeValues = obsKeys.map(String)
    }
  }

  const seriesMap: Record<string, { dimValues: string[]; observations: Record<string, number | null> }> = {}
  for (const [key, s] of Object.entries(rawSeries)) {
    const indices = key.split(':').map(Number)
    const dimValues = indices.map((idx, i) => dims[i]?.values[idx]?.name ?? String(idx))
    const obs: Record<string, number | null> = {}
    const rawObs = (s as any).observations ?? {}

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

    seriesMap[key] = { dimValues, observations: obs }
  }

  // If timeValues still empty, derive sorted list from what we collected in observations
  if (timeValues.length === 0 && Object.keys(seriesMap).length > 0) {
    const allYears = new Set<string>()
    for (const s of Object.values(seriesMap)) {
      for (const y of Object.keys(s.observations)) allYears.add(y)
    }
    timeValues = Array.from(allYears).sort()
  }

  console.log(`[fetchData] ${flow.id}: ${timeValues.length} time points, ${Object.keys(seriesMap).length} series`)

  return { structure: null, seriesMap, timeValues, seriesDimensions: dims }
}
