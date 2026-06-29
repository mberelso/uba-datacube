import { geoMercator, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

// Bundesland-Geometrie (public/bundeslaender.geo.json)
export type StateProps = { id: string; name: string; type: string }
export type StatesGeo = FeatureCollection<Geometry, StateProps>

// ─── Datentypen (aus scripts/dwd/build_heat_thresholds.py) ──────────────────────
export interface ThreshStat {
  earliestMd?: string
  earliestDate?: string
  firstYear?: number
  yearsReached?: number
  daysTotal?: number
}
export interface StateRec {
  code: string
  name: string
  record: { temp: number; date: string; station: string; lat?: number; lon?: number }
  stats: Record<string, ThreshStat>
}
export interface ThreshData {
  generated: string
  dataThrough?: string
  provisionalYear?: number
  source: string
  thresholds: number[]
  national: { temp: number; date: string; station: string; state: string }
  states: StateRec[]
}

export const NORDIC = { navy: '#1B2B3A', red: '#dc2626', amber: '#f59e0b', stone: '#8C8880', fog: '#94a3b8' }
const MONTHS = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export function fmtMd(md?: string): string {
  if (!md) return '–'
  const [m, d] = md.split('-').map(Number)
  return `${d}. ${MONTHS[m - 1]}`
}
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
const MONTHS_FULL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
// "2026-06-28" → "28. Juni 2026"
export function fmtDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}. ${MONTHS_FULL[m - 1]} ${y}`
}

// Hitze-Farbskala nach Rekordtemperatur. Domäne bewusst ~37–42 °C, damit die
// Spreizung zwischen Küste (~37) und Rekordländern (~41,7) sichtbar wird.
export function tempColor(t: number): string {
  const f = Math.max(0, Math.min(1, (t - 37) / 5))
  const ramp: [number, [number, number, number]][] = [
    [0.0, [255, 237, 160]],
    [0.35, [254, 178, 76]],
    [0.7, [240, 59, 32]],
    [1.0, [140, 12, 12]],
  ]
  for (let i = 1; i < ramp.length; i++) {
    if (f <= ramp[i][0]) {
      const [f0, c0] = ramp[i - 1], [f1, c1] = ramp[i]
      const k = (f - f0) / (f1 - f0)
      return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`
    }
  }
  return 'rgb(140,12,12)'
}

export interface ProjectedState {
  code: string
  name: string
  d: string            // SVG-Pfad
  cx: number           // Zentroid x (für Labels/Highlight)
  cy: number
}

// Projiziert die Bundesland-Geometrie auf eine w×h-Fläche und liefert die Pfade
// sowie die Projektionsfunktion (für Punkt-Marker wie Messstellen-Koordinaten).
export function projectStates(geo: StatesGeo, w: number, h: number, pad = 4): {
  states: ProjectedState[]
  project: (lon: number, lat: number) => [number, number] | null
} {
  const projection = geoMercator().fitExtent([[pad, pad], [w - pad, h - pad]], geo)
  const path = geoPath(projection)
  const states = geo.features.map((f: Feature<Geometry, StateProps>) => {
    const [cx, cy] = path.centroid(f)
    return {
      code: (f.properties.id || '').slice(3),  // "DE-BW" → "BW"
      name: f.properties.name,
      d: path(f) || '',
      cx, cy,
    }
  })
  const project = (lon: number, lat: number) => projection([lon, lat]) as [number, number] | null
  return { states, project }
}
