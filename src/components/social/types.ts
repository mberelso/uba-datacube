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
  klima: '#4A6741',
  energie: '#C4872A',
  transport: '#3A6B8A',
  wasser: '#2A7A8C',
  luft: '#6B5EA8',
  boden: '#8A6B3A',
  flaeche: '#4A7A6B',
  region: '#0284c7',
  vergleich: '#7c3aed',
  default: '#4A6741',
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
