export type SocialCategory =
  | 'klima'
  | 'energie'
  | 'transport'
  | 'wasser'
  | 'luft'
  | 'boden'
  | 'flaeche'
  | 'region'
  | 'vergleich'
  | 'default'

export const CATEGORY_LABELS: Record<SocialCategory, string> = {
  klima: 'KLIMA',
  energie: 'ENERGIE',
  transport: 'TRANSPORT',
  wasser: 'WASSER',
  luft: 'LUFT',
  boden: 'BODEN',
  flaeche: 'FLÄCHE',
  region: 'REGIONAL',
  vergleich: 'VERGLEICH',
  default: 'UMWELT',
}

export const CATEGORY_COLORS: Record<SocialCategory, string> = {
  klima: '#10b981',
  energie: '#f59e0b',
  transport: '#06b6d4',
  wasser: '#38bdf8',
  luft: '#a855f7',
  boden: '#eab308',
  flaeche: '#14b8a6',
  region: '#38bdf8',
  vergleich: '#c084fc',
  default: '#10b981',
}

export interface ChartPoint {
  year: string
  value: number
}

export interface SocialCardData {
  category: SocialCategory
  metric: string       // "−38 %"
  metricLabel: string  // "gegenüber 1990"
  headline: string     // "CO₂-Emissionen fast halbiert"
  story: string        // 2–3 Sätze
  sparkline: number[]  // rohe Datenpunkte
  yearRange: string    // "1990 – 2023"
  datasetId: string
  backgroundUrl?: string
  unit?: string
  seriesName?: string
  chartPoints?: ChartPoint[]
}
