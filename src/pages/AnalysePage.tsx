import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'
import { SocialCardModal } from '../components/social/SocialCardModal'
import type { SocialCardData } from '../components/social/types'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ComposedChart, Legend,
} from 'recharts'
import { fetchAveragedSeries, fetchSingleSeries, type TimePoint } from '../api/sdmx'

/** Fetch CSV data for a dataset and return raw series keyed by dim-code string.
 *  Always uses CSV (skips the sparse JSON path entirely for these charts). */
async function fetchCsvSeries(flowId: string, version: string): Promise<
  Record<string, { codes: string[]; colIds: string[]; obs: Record<string, number | null> }>
> {
  const url = `https://daten.uba.de/release/rest/data/UBA,${flowId},${version}/all?format=csv`
  const r = await fetch(url, { headers: { Accept: 'text/csv' } })
  if (!r.ok) throw new Error(`CSV fetch failed ${r.status}`)
  const text = await r.text()
  const lines = text.trim().split('\n')
  const sep = lines[0].includes(';') ? ';' : ','
  const header = lines[0].split(sep).map(h => h.trim().replace(/\r/g, ''))
  const timeCol = header.indexOf('TIME_PERIOD')
  const valCol = header.indexOf('OBS_VALUE')
  const colIds = header.slice(1, timeCol) // skip DATAFLOW col
  const result: Record<string, { codes: string[]; colIds: string[]; obs: Record<string, number | null> }> = {}
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const cols = line.split(sep).map(c => c.trim().replace(/\r/g, ''))
    const codes = colIds.map((_c, i) => cols[i + 1])
    const key = codes.join(':')
    const raw = cols[valCol]
    const val = raw !== '' ? parseFloat(raw) : null
    if (!result[key]) result[key] = { codes, colIds, obs: {} }
    result[key].obs[cols[timeCol]] = isNaN(val as number) ? null : val
  }
  return result
}

/** Extract named time series from CSV by matching dim codes.
 *  filters: { displayLabel: { DIM_ID: 'CODE', ... } } */
async function fetchDataSeries(
  flowId: string,
  version: string,
  seriesSpec: Record<string, Record<string, string>>,
): Promise<Record<string, TimePoint[]>> {
  const csv = await fetchCsvSeries(flowId, version)
  const result: Record<string, TimePoint[]> = {}
  for (const [label, filters] of Object.entries(seriesSpec)) {
    for (const { codes, colIds, obs } of Object.values(csv)) {
      const matches = Object.entries(filters).every(([dimId, code]) => {
        const idx = colIds.indexOf(dimId)
        return idx !== -1 && codes[idx] === code
      })
      if (!matches) continue
      result[label] = Object.entries(obs)
        .map(([year, val]) => ({ year, value: val as number }))
        .filter(p => p.value != null)
        .sort((a, b) => a.year.localeCompare(b.year))
      break
    }
  }
  return result
}

/** Average all matching CSV series per year (for multi-station datasets). */
async function fetchCsvAveraged(
  flowId: string,
  version: string,
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

/** Extract a single series from CSV matching all given dim code filters. */
async function fetchDataSingleSeries(
  flowId: string,
  version: string,
  filters: Record<string, string>,
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
      .filter(p => p.value != null)
      .sort((a, b) => a.year.localeCompare(b.year))
  }
  return []
}

// ── tiny helpers ──────────────────────────────────────────────────────────────

function useData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    setLoading(true)
    setError(false)
    loader().then(setData).catch(() => setError(true)).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { data, loading, error }
}

const fmt = (n: number, dec = 1) => n.toLocaleString('de-DE', { maximumFractionDigits: dec })

// ── layout primitives ─────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        borderBottom: `3px solid ${color}`, paddingBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>{title}</h2>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

/** Baut einen vorausgefüllten Datensatz-Link mit optionalen Lazy-Filtern. */
function datasetLink(flowId: string, lazyFilters?: Record<string, string>): string {
  const base = `/dataset/${encodeURIComponent(flowId)}`
  if (!lazyFilters) return base
  return `${base}?lazy=${encodeURIComponent(JSON.stringify(lazyFilters))}`
}

function ChartCard({ title, subtitle, kpi, kpiUnit, kpiYear, trend, color, loading, error, height = 220, flowId, lazyFilters, source, socialCard, onShare, controls, children }: {
  title: string; subtitle: string
  kpi?: number; kpiUnit?: string; kpiYear?: string; trend?: number
  color: string; loading: boolean; error?: boolean; height?: number
  flowId?: string; lazyFilters?: Record<string, string>; source?: string
  socialCard?: SocialCardData
  onShare?: (d: SocialCardData) => void
  controls?: ReactNode
  children: ReactNode
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0',
      overflow: 'hidden', borderTop: `4px solid ${color}` }}>
      <div className="flex justify-between items-start px-4 pt-4 pb-2">
        <div className="flex-1 mr-3 min-w-0">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }} className="leading-tight">{title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>
        </div>
        {kpi != null && (
          <div className="text-right shrink-0">
            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{fmt(kpi, 1)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{kpiUnit}{kpiYear ? ` (${kpiYear})` : ''}</div>
            {trend != null && (
              <div style={{ fontSize: 11, marginTop: 2, color: trend < 0 ? '#16a34a' : '#dc2626' }}>
                {trend > 0 ? '▲' : '▼'} {fmt(Math.abs(trend), 2)}
              </div>
            )}
          </div>
        )}
      </div>
      {controls && !loading && !error && (
        <div className="px-4 pb-1 flex justify-end">{controls}</div>
      )}
      <div style={{ height, padding: '0 6px 10px' }}>
        {loading
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>Lade Daten…</div>
          : error
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#f87171', fontSize: 12 }}>Daten konnten nicht geladen werden.</div>
          : (children ? children : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 12 }}>Keine Daten verfügbar.</div>)}
      </div>
      <div className="px-4 pb-3 flex justify-between items-end gap-2">
        {source
          ? <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>{source}</span>
          : <span />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {socialCard && onShare && !loading && !error && (
            <button
              onClick={() => onShare(socialCard)}
              style={{
                fontSize: 11, fontWeight: 600, color: '#fff',
                background: '#1B2B3A', border: 'none', borderRadius: 6,
                padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'Geist, sans-serif',
              }}
            >
              ↑ Teilen
            </button>
          )}
          {flowId && (
            <Link
              to={datasetLink(flowId, lazyFilters)}
              style={{ fontSize: 11, color: '#1e3a5f', textDecoration: 'none', fontWeight: 500, opacity: 0.8, whiteSpace: 'nowrap' }}
            >
              → Rohdaten erkunden
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

const TT = ({ active, payload, label, unit = '' }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? p.stroke, display: 'flex', gap: 8 }}>
          <span style={{ color: '#64748b' }}>{p.name}:</span>
          <b>{typeof p.value === 'number' ? fmt(p.value, 2) : p.value} {unit}</b>
        </div>
      ))}
    </div>
  )
}

// ── gradient defs helper ──────────────────────────────────────────────────────

function Grad({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  )
}

// ── Zeitraum-Auswahl ───────────────────────────────────────────────────────────

type RangeOption = { label: string; from: number | null }

const CLIMATE_RANGES: RangeOption[] = [
  { label: 'Alle', from: null },
  { label: 'ab 1950', from: 1950 },
  { label: 'ab 1990', from: 1990 },
  { label: 'ab 2010', from: 2010 },
]

function RangeToggle({ value, onChange, options }: {
  value: number | null
  onChange: (from: number | null) => void
  options: RangeOption[]
}) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {options.map(o => {
        const active = value === o.from
        return (
          <button
            key={o.label}
            onClick={() => onChange(o.from)}
            style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
              cursor: 'pointer', whiteSpace: 'nowrap',
              border: active ? '1px solid #1e293b' : '1px solid #e2e8f0',
              background: active ? '#1e293b' : '#fff',
              color: active ? '#fff' : '#64748b',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Filtert eine Zeitreihe ab einem Startjahr (null = alle). */
function filterFrom<T extends { year: string }>(pts: T[] | null | undefined, from: number | null): T[] | null | undefined {
  if (!pts || from == null) return pts
  return pts.filter(p => +p.year >= from)
}

// ═══════════════════════════════════════════════════════════════════════════════
// KLIMA
// ═══════════════════════════════════════════════════════════════════════════════

const TEMP_BASELINE = 8.2

function TemperatureChart({ onShare }: { onShare: (d: SocialCardData) => void }) {
  const [from, setFrom] = useState<number | null>(null)
  const { data, loading, error } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_TEMPERATURE_MEAN,1.0', 'DE.A.DEGC.JM.'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const anomaly = latest ? latest.value - TEMP_BASELINE : undefined
  const prevAnomaly = pts && pts.length >= 2 ? pts[pts.length - 2].value - TEMP_BASELINE : undefined
  const chartData = filterFrom(pts, from)?.map(p => ({ year: p.year, anomaly: +(p.value - TEMP_BASELINE).toFixed(2) }))
  const xInterval = chartData ? Math.max(1, Math.floor(chartData.length / 7)) : 19

  const socialCard: SocialCardData | undefined = pts && latest && anomaly != null ? {
    category: 'klima',
    metric: `${anomaly >= 0 ? '+' : ''}${fmt(anomaly, 1)} °C`,
    metricLabel: 'Anomalie zum Referenzmittel 1961–90',
    headline: 'Temperaturanomalie Deutschland',
    story: 'Seit 1881 steigt die Durchschnittstemperatur in Deutschland. Jüngste Jahre liegen deutlich über dem Referenzmittel von 8,2 °C.',
    sparkline: pts.map(p => +(p.value - TEMP_BASELINE).toFixed(2)),
    yearRange: `${pts[0].year} – ${latest.year}`,
    datasetId: 'DF_CLIMATE_GERMANY_TEMPERATURE_MEAN',
  } : undefined

  return (
    <ChartCard
      title="Temperaturanomalie Deutschland"
      subtitle="Abweichung vom Referenzmittel 1961–1990 (8,2 °C) · Ø aller Bundesländer"
      kpi={anomaly} kpiUnit="°C Anomalie" kpiYear={latest?.year}
      trend={anomaly != null && prevAnomaly != null ? anomaly - prevAnomaly : undefined}
      color="#dc2626" loading={loading} error={error}
      flowId="DF_CLIMATE_GERMANY_TEMPERATURE_MEAN"
      source="Quelle: Umweltbundesamt / Deutscher Wetterdienst"
      socialCard={socialCard} onShare={onShare}
      controls={<RangeToggle value={from} onChange={setFrom} options={CLIMATE_RANGES} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
          <Grad id="tGrad" color="#dc2626" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={xInterval}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            domain={[-2.5, 4]}
            tickFormatter={v => `${v > 0 ? '+' : ''}${v}`}
            width={36}
          />
          <Tooltip content={<TT unit="°C" />} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: 'Referenz 1961–90', position: 'insideTopLeft', fontSize: 10, fill: '#94a3b8' }} />
          <Area type="monotone" dataKey="anomaly" stroke="#dc2626" strokeWidth={1.5}
            fill="url(#tGrad)" dot={false} connectNulls name="Anomalie" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function HotDaysChart() {
  const [from, setFrom] = useState<number | null>(null)
  const { data, loading, error } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_HOT_DAYS,1.0', 'DE.A.DAYS.JW.'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const baseline = pts?.filter(p => +p.year >= 1951 && +p.year <= 1980)
    .reduce((s, p, _, arr) => s + p.value / arr.length, 0)
  const color = (v: number) =>
    v >= 20 ? '#7f1d1d' : v >= 15 ? '#dc2626' : v >= 10 ? '#ef4444' : v >= 6 ? '#f97316' : v >= 3 ? '#fb923c' : '#fbbf24'

  const view = filterFrom(pts, from)
  const xInterval = view ? Math.max(1, Math.floor(view.length / 7)) : 4
  return (
    <ChartCard title="Heißtage pro Jahr" subtitle="Tage mit Tmax > 30 °C · Ø aller Bundesländer · farbkodiert nach Intensität"
      kpi={latest?.value} kpiUnit="Tage" kpiYear={latest?.year}
      color="#d97706" loading={loading} error={error}
      flowId="DF_CLIMATE_GERMANY_HOT_DAYS" source="Quelle: Umweltbundesamt / Deutscher Wetterdienst"
      controls={<RangeToggle value={from} onChange={setFrom} options={CLIMATE_RANGES} />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={view ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} interval={xInterval} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" d" width={36} />
          <Tooltip content={<TT unit="Tage" />} />
          {baseline != null && <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: `Ø 1951–80: ${fmt(baseline, 1)} d`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />}
          <Bar dataKey="value" radius={[2, 2, 0, 0]} name="Heißtage">
            {view?.map(e => <Cell key={e.year} fill={color(e.value)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function PrecipitationChart() {
  const [from, setFrom] = useState<number | null>(null)
  const { data, loading, error } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_PRECIPATION,1.0', 'DE.A.MM.JW.'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const baseline = pts?.filter(p => +p.year >= 1961 && +p.year <= 1990)
    .reduce((s, p, _, arr) => s + p.value / arr.length, 0)

  const view = filterFrom(pts, from)
  const xInterval = view ? Math.max(1, Math.floor(view.length / 7)) : 19
  return (
    <ChartCard title="Jahresniederschlag Deutschland" subtitle="Ø aller Bundesländer (mm) · 1881–2025"
      kpi={latest?.value} kpiUnit="mm" kpiYear={latest?.year}
      color="#0369a1" loading={loading} error={error}
      flowId="DF_CLIMATE_GERMANY_PRECIPATION" source="Quelle: Umweltbundesamt / Deutscher Wetterdienst"
      controls={<RangeToggle value={from} onChange={setFrom} options={CLIMATE_RANGES} />}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={view ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <Grad id="pGrad" color="#0369a1" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} interval={xInterval} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" mm" domain={[400, 1100]} width={44} />
          <Tooltip content={<TT unit="mm" />} />
          {baseline != null && <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: `Ø 1961–90: ${fmt(baseline, 0)} mm`, position: 'insideBottomRight', fontSize: 10, fill: '#94a3b8' }} />}
          <Area type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={1.5}
            fill="url(#pGrad)" dot={false} connectNulls name="Niederschlag" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGIEWENDE
// ═══════════════════════════════════════════════════════════════════════════════

function RenewableShareChart({ onShare }: { onShare: (d: SocialCardData) => void }) {
  const { data, loading, error } = useData(() =>
    fetchSingleSeries('UBA,DF_ENERGY_AGEE_SHARE,1.0', 'DE.A.PZ.SHARE_EE_GFEC_RED.EE'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]

  const socialCard: SocialCardData | undefined = pts && latest ? {
    category: 'energie',
    metric: `${fmt(latest.value, 1)} %`,
    metricLabel: 'am Bruttoendenergieverbrauch',
    headline: 'Erneuerbare auf Rekordhoch',
    story: 'Der Anteil Erneuerbarer Energien am Brutto-Endenergieverbrauch wächst kontinuierlich. Das EU-Ziel 2030 von 42,5 % rückt näher.',
    sparkline: pts.map(p => p.value),
    yearRange: `${pts[0].year} – ${latest.year}`,
    datasetId: 'DF_ENERGY_AGEE_SHARE',
  } : undefined

  return (
    <ChartCard title="Anteil Erneuerbarer Energien" subtitle="Am Brutto-Endenergieverbrauch (RED-Methodik)"
      kpi={latest?.value} kpiUnit="%" kpiYear={latest?.year}
      color="#16a34a" loading={loading} error={error}
      flowId="DF_ENERGY_AGEE_SHARE" source="Quelle: Umweltbundesamt / AGEE-Stat"
      socialCard={socialCard} onShare={onShare}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <Grad id="eeGrad" color="#16a34a" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" %" domain={[0, 50]} width={36} />
          <Tooltip content={<TT unit="%" />} />
          <ReferenceLine y={42.5} stroke="#15803d" strokeDasharray="5 3"
            label={{ value: 'EU-Ziel 2030: 42,5 %', position: 'insideTopLeft', fontSize: 10, fill: '#15803d' }} />
          <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2}
            fill="url(#eeGrad)" dot={{ r: 3, fill: '#16a34a' }} connectNulls name="EE-Anteil" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ElectricCarChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL', '1.0', {
      'BEV':    { D_VEHICLE_TYPE: 'PKW', D_FUEL_TYPE: 'FU-HE-EL' },
      'PHEV':   { D_VEHICLE_TYPE: 'PKW', D_FUEL_TYPE: 'FU-HE-HYS-PH' },
      'Hybrid': { D_VEHICLE_TYPE: 'PKW', D_FUEL_TYPE: 'FU-HE-HYS' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +(pt.value / 1e6).toFixed(3) : null
      }
      return row
    })
  })
  const latestBEV = data?.[data.length - 1]?.['BEV']

  return (
    <ChartCard title="Pkw-Bestand nach Antriebsart" subtitle="Millionen Fahrzeuge (Stichtag 1. Januar)"
      kpi={latestBEV} kpiUnit="Mio. BEV" kpiYear={data?.[data.length - 1]?.year}
      color="#0284c7" loading={loading} error={error}
      flowId="DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL" source="Quelle: Umweltbundesamt / Kraftfahrt-Bundesamt">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" Mio." width={40} />
          <Tooltip content={<TT unit="Mio." />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="BEV" name="BEV – rein elektrisch" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="PHEV" name="PHEV – Plug-in-Hybrid" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="Hybrid" name="Hybrid (ohne Stecker)" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function FuelConsumptionChart() {
  const { data, loading, error } = useData(() =>
    fetchDataSingleSeries('DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION', '1.0',
      { D_UNIT: 'LHK', D_TYPE: 'JM', D_VEHICLE_TYPE: 'PKW', D_FUEL_TYPE: 'FU' }))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const first = pts?.[0]

  return (
    <ChartCard title="Kraftstoffverbrauch Pkw" subtitle="Durchschnittlicher Verbrauch im Straßenverkehr (L/100 km)"
      kpi={latest?.value} kpiUnit="L/100 km" kpiYear={latest?.year}
      trend={first && latest ? latest.value - first.value : undefined}
      color="#b45309" loading={loading} error={error}
      flowId="DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION" source="Quelle: Umweltbundesamt">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pts ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <Grad id="fcGrad" color="#b45309" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" L" domain={[6, 10]} width={36} />
          <Tooltip content={<TT unit="L/100km" />} />
          <Area type="monotone" dataKey="value" stroke="#b45309" strokeWidth={2}
            fill="url(#fcGrad)" dot={{ r: 3, fill: '#b45309' }} connectNulls name="Verbrauch" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUFT
// ═══════════════════════════════════════════════════════════════════════════════

const POLLUTANT_COLORS: Record<string, string> = {
  'SO₂': '#dc2626', 'NOₓ': '#d97706', 'PM2,5': '#7c3aed',
  'NH₃': '#16a34a', 'NMVOC': '#0284c7',
}

function AirPollutantsChart({ onShare }: { onShare: (d: SocialCardData) => void }) {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_AIR_EMISSIONS_INDEX', '2026.0', {
      'NH₃':   { D_SUBSTANCES: 'NH3' },
      'NMVOC': { D_SUBSTANCES: 'NMVOC' },
      'NOₓ':   { D_SUBSTANCES: 'NOx_NO2' },
      'PM2,5': { D_SUBSTANCES: 'PM25' },
      'SO₂':   { D_SUBSTANCES: 'SO2' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +pt.value.toFixed(1) : null
      }
      return row
    })
  })

  const latest = data?.[data.length - 1]
  const first = data?.[0]
  const socialCard: SocialCardData | undefined = data && latest && first ? {
    category: 'luft',
    metric: `−${fmt(100 - (latest['NOₓ'] ?? 100), 0)} %`,
    metricLabel: 'NOₓ-Reduktion seit 2005',
    headline: 'Luftqualität deutlich verbessert',
    story: 'Stickoxid-, Feinstaub- und Schwefeldioxid-Emissionen sind seit 2005 deutlich gesunken. Deutschland macht bei der Luftreinhaltung sichtbare Fortschritte.',
    sparkline: data.map(p => p['NOₓ'] ?? 100),
    yearRange: `${first.year} – ${latest.year}`,
    datasetId: 'DF_AIR_EMISSIONS_INDEX',
  } : undefined

  return (
    <ChartCard title="Luftschadstoff-Emissionsindex" subtitle="Index 2005 = 100 · alle Schadstoffe klar rückläufig"
      color="#7c3aed" loading={loading} error={error}
      flowId="DF_AIR_EMISSIONS_INDEX" source="Quelle: Umweltbundesamt"
      socialCard={socialCard} onShare={onShare}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[20, 130]} width={36} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: '2005 = 100', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
          {Object.keys(POLLUTANT_COLORS).map(k => (
            <Line key={k} type="monotone" dataKey={k} stroke={POLLUTANT_COLORS[k]}
              strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function FuelPricesChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_TRANSPORT_ENERGY_FUEL_PRICES', '1.0', {
      'Benzin': { D_FUEL_TYPE: 'FU-LQ-GN' },
      'Diesel': { D_FUEL_TYPE: 'FU-LQ-DI' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +pt.value.toFixed(3) : null
      }
      return row
    })
  })
  const latestBenzin = data?.[data.length - 1]?.['Benzin']

  return (
    <ChartCard title="Kraftstoffpreise im Straßenverkehr" subtitle="Jahresdurchschnitt Benzin und Diesel (€/L)"
      kpi={latestBenzin} kpiUnit="€/L (Benzin)" kpiYear={data?.[data.length - 1]?.year}
      color="#f59e0b" loading={loading} error={error}
      flowId="DF_TRANSPORT_ENERGY_FUEL_PRICES" source="Quelle: Umweltbundesamt / BAFA">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" €" domain={[0.8, 2.2]} width={40} />
          <Tooltip content={<TT unit="€/L" />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="Benzin" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="Diesel" stroke="#92400e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LANDWIRTSCHAFT & WALD
// ═══════════════════════════════════════════════════════════════════════════════

function NitrogenChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS', '1.0', {
      'Stickstoff-Input': { D_NITROGEN_BALANCE: 'N_Z' },
      'Stickstoff-Saldo': { D_NITROGEN_BALANCE: 'N_SALDO' },
      'Stickstoff-Abfuhr': { D_NITROGEN_BALANCE: 'N_A' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +pt.value.toFixed(1) : null
      }
      return row
    })
  })
  const latestSaldo = data?.[data.length - 1]?.['Stickstoff-Saldo']

  return (
    <ChartCard title="Stickstoffüberschuss Landwirtschaft" subtitle="Gesamtbilanz (kg N/ha) · Ziel: ≤ 70 kg/ha bis 2030"
      kpi={latestSaldo} kpiUnit="kg N/ha (Saldo)" kpiYear={data?.[data.length - 1]?.year}
      color="#65a30d" loading={loading} error={error}
      flowId="DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS" source="Quelle: Umweltbundesamt / BMEL">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kg" width={40} />
          <Tooltip content={<TT unit="kg N/ha" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="5 3"
            label={{ value: 'Ziel 2030: 70 kg/ha', position: 'insideTopRight', fontSize: 10, fill: '#16a34a' }} />
          <Area type="monotone" dataKey="Stickstoff-Input" stroke="#94a3b8" fill="#f1f5f9"
            strokeWidth={1} dot={false} connectNulls />
          <Line type="monotone" dataKey="Stickstoff-Saldo" stroke="#dc2626" strokeWidth={2.5}
            dot={{ r: 2 }} connectNulls />
          <Line type="monotone" dataKey="Stickstoff-Abfuhr" stroke="#65a30d" strokeWidth={1.5}
            strokeDasharray="4 2" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ForestFireChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA', '1.0', {
      'Natürlich':    { D_FIRE_CAUSE: 'N', D_INDICATOR: 'FA', D_UNIT: 'HA' },
      'Fahrlässig':   { D_FIRE_CAUSE: 'L', D_INDICATOR: 'FA', D_UNIT: 'HA' },
      'Unbekannt':    { D_FIRE_CAUSE: 'U', D_INDICATOR: 'FA', D_UNIT: 'HA' },
      'Brandstiftung':{ D_FIRE_CAUSE: 'A', D_INDICATOR: 'FA', D_UNIT: 'HA' },
      'Sonstige':     { D_FIRE_CAUSE: 'O', D_INDICATOR: 'FA', D_UNIT: 'HA' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year, gesamt: 0 }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        const val = pt ? +pt.value.toFixed(0) : 0
        row[label] = val
        row['gesamt'] = (row['gesamt'] as number) + val
      }
      return row
    })
  })
  const latest = data?.[data.length - 1]

  return (
    <ChartCard title="Waldbrandfläche nach Ursache" subtitle="Hektar pro Jahr · gestapelt nach Brandursache"
      kpi={latest?.['gesamt']} kpiUnit="ha gesamt" kpiYear={latest?.year}
      color="#d97706" loading={loading} error={error}
      flowId="DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA" source="Quelle: Umweltbundesamt / BMEL">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} interval={2} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" ha" width={44} />
          <Tooltip content={<TT unit="ha" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Fahrlässig" stackId="a" fill="#f97316" />
          <Bar dataKey="Brandstiftung" stackId="a" fill="#dc2626" />
          <Bar dataKey="Unbekannt" stackId="a" fill="#94a3b8" />
          <Bar dataKey="Natürlich" stackId="a" fill="#65a30d" />
          <Bar dataKey="Sonstige" stackId="a" fill="#0891b2" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function GreenMobilityChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE', '1.0', {
      'ÖPNV (Straße)': { D_TRANSPORT_MEAN: 'OPNV', D_TRANSPORT_GOOD: 'PV' },
      'Schiene':       { D_TRANSPORT_MEAN: 'EB',   D_TRANSPORT_GOOD: 'PV' },
      'Radverkehr':    { D_TRANSPORT_MEAN: 'FRV',  D_TRANSPORT_GOOD: 'PV' },
      'Fußverkehr':    { D_TRANSPORT_MEAN: 'FV',   D_TRANSPORT_GOOD: 'PV' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +pt.value.toFixed(2) : null
      }
      return row
    })
  })
  const latest = data?.[data.length - 1]
  const total = latest
    ? ['ÖPNV (Straße)', 'Schiene', 'Radverkehr', 'Fußverkehr'].reduce((s, k) => s + (latest[k] ?? 0), 0)
    : undefined

  return (
    <ChartCard title="Umweltfreundliche Mobilität" subtitle="Anteil an der Personenverkehrsleistung (%) · gestapelt nach Verkehrsträger"
      kpi={total} kpiUnit="% gesamt" kpiYear={latest?.year}
      color="#16a34a" loading={loading} error={error}
      flowId="DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE" source="Quelle: Umweltbundesamt / Destatis">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" %" width={36} />
          <Tooltip content={<TT unit="%" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Area type="monotone" dataKey="ÖPNV (Straße)" stroke="#0284c7" fill="#bfdbfe" strokeWidth={1.5} stackId="a" connectNulls />
          <Area type="monotone" dataKey="Schiene" stroke="#7c3aed" fill="#ede9fe" strokeWidth={1.5} stackId="a" connectNulls />
          <Area type="monotone" dataKey="Radverkehr" stroke="#16a34a" fill="#dcfce7" strokeWidth={1.5} stackId="a" connectNulls />
          <Area type="monotone" dataKey="Fußverkehr" stroke="#d97706" fill="#fef3c7" strokeWidth={1.5} stackId="a" connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WASSER
// ═══════════════════════════════════════════════════════════════════════════════

function WaterTempChart() {
  const { data, loading, error } = useData(() => fetchCsvAveraged('DF_DAS_WASSER_WW_I_10', '1.0'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]

  return (
    <ChartCard title="Wassertemperatur der Fließgewässer" subtitle="DAS WW-I-10 · Ø aller Messstellen (°C)"
      kpi={latest?.value} kpiUnit="°C" kpiYear={latest?.year}
      color="#0369a1" loading={loading} error={error}
      flowId="DF_DAS_WASSER_WW_I_10" source="Quelle: Umweltbundesamt / DAS">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <Grad id="wGrad" color="#0369a1" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="°C" width={36} />
          <Tooltip content={<TT unit="°C" />} />
          <Area type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={2}
            fill="url(#wGrad)" dot={false} connectNulls name="Wassertemperatur" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function RiverDischargeChart() {
  const { data, loading, error } = useData(() => fetchCsvAveraged('DF_DAS_WASSER_WW_I_3', '1.0'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]

  return (
    <ChartCard title="Mittlerer Abfluss der Flüsse" subtitle="DAS WW-I-3 · Ø aller Pegel (Abweichung vom Mittel)"
      kpi={latest?.value} kpiUnit="" kpiYear={latest?.year}
      color="#0891b2" loading={loading} error={error}
      flowId="DF_DAS_WASSER_WW_I_3" source="Quelle: Umweltbundesamt / DAS">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pts ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={36} />
          <Tooltip content={<TT />} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 2" />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} name="Abweichung">
            {pts?.map(e => <Cell key={e.year} fill={e.value < 0 ? '#ef4444' : '#0891b2'} />)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABFALL & KREISLAUFWIRTSCHAFT
// ═══════════════════════════════════════════════════════════════════════════════

function WasteRecyclingRateChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_WASTE_RECOVERY_RATE', '1.0', {
      'Gesamtabfall (nicht-gef.)':   { D_WASTE_TYPE: 'ABF_BRUTTO',  D_INDICATOR: 'ABF_REC', D_WASTE_HAZARD_CLASS: 'ABF_NGF' },
      'Siedlungsabfall (gesamt)':     { D_WASTE_TYPE: 'ABF_SON_SIE', D_INDICATOR: 'ABF_REC', D_WASTE_HAZARD_CLASS: 'T' },
      'Haushaltsähnl. Abfall (ges.)': { D_WASTE_TYPE: 'ABF_HAU_SIE', D_INDICATOR: 'ABF_REC', D_WASTE_HAZARD_CLASS: 'T' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +pt.value.toFixed(1) : null
      }
      return row
    })
  })
  const latest = data?.[data.length - 1]

  return (
    <ChartCard title="Abfallrecyclingquoten" subtitle="Recyclingquote (%) nach Abfallkategorie · 2021–2023"
      kpi={latest?.['Gesamtabfall (nicht-gef.)']} kpiUnit="% Gesamtabfall" kpiYear={latest?.year}
      color="#0891b2" loading={loading} error={error}
      flowId="DF_WASTE_RECOVERY_RATE" source="Quelle: Umweltbundesamt / Destatis">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" %" domain={[40, 90]} width={36} />
          <Tooltip content={<TT unit="%" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={65} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: 'EU-Ziel 2035: 65 %', position: 'insideTopLeft', fontSize: 10, fill: '#94a3b8' }} />
          <Bar dataKey="Gesamtabfall (nicht-gef.)" fill="#0891b2" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Siedlungsabfall (gesamt)" fill="#7c3aed" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Haushaltsähnl. Abfall (ges.)" fill="#16a34a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function WasteDisposalChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_WASTE_VOLUME', '1.0', {
      'Stoffliche Verwertung':      { D_WASTE_TYPE: 'ABF_BRUTTO', D_WASTE_HAZARD_CLASS: 'T', D_WASTE_UTILIZATION: 'STV' },
      'Thermische Behandlung':      { D_WASTE_TYPE: 'ABF_BRUTTO', D_WASTE_HAZARD_CLASS: 'T', D_WASTE_UTILIZATION: 'THERM_BES' },
      'Deponierung':                { D_WASTE_TYPE: 'ABF_BRUTTO', D_WASTE_HAZARD_CLASS: 'T', D_WASTE_UTILIZATION: 'ABL' },
      'Behandlung zur Beseitigung': { D_WASTE_TYPE: 'ABF_BRUTTO', D_WASTE_HAZARD_CLASS: 'T', D_WASTE_UTILIZATION: 'BEB' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +(pt.value / 1000).toFixed(1) : null
      }
      return row
    })
  })
  const latest = data?.[data.length - 1]
  const total = latest
    ? ['Stoffliche Verwertung', 'Thermische Behandlung', 'Deponierung', 'Behandlung zur Beseitigung']
        .reduce((s, k) => s + (latest[k] ?? 0), 0)
    : undefined

  return (
    <ChartCard title="Brutto-Abfallaufkommen nach Verwertungsweg" subtitle="Mio. Tonnen gesamt · gestapelt nach Entsorgungspfad"
      kpi={total} kpiUnit="Mio. t gesamt" kpiYear={latest?.year}
      color="#475569" loading={loading} error={error}
      flowId="DF_WASTE_VOLUME" source="Quelle: Umweltbundesamt / Destatis">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" Mio. t" width={52} />
          <Tooltip content={<TT unit="Mio. t" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Stoffliche Verwertung" stackId="a" fill="#16a34a" />
          <Bar dataKey="Thermische Behandlung" stackId="a" fill="#f97316" />
          <Bar dataKey="Behandlung zur Beseitigung" stackId="a" fill="#94a3b8" />
          <Bar dataKey="Deponierung" stackId="a" fill="#dc2626" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// KONSUM & WIRTSCHAFT
// ═══════════════════════════════════════════════════════════════════════════════

const FOOTPRINT_COLORS: Record<string, string> = {
  'CO₂-Emissionen': '#dc2626',
  'Rohstoffverbrauch': '#d97706',
  'Energieverbrauch': '#7c3aed',
}

function ConsumerFootprintChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT', '1.0', {
      'CO₂-Emissionen':   { D_INDICATOR: 'CO2_DI' },
      'Rohstoffverbrauch': { D_INDICATOR: 'RMC' },
      'Energieverbrauch':  { D_INDICATOR: 'EN_DI' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +pt.value.toFixed(1) : null
      }
      return row
    })
  })

  return (
    <ChartCard title="Globaler Umwelt-Fußabdruck privater Haushalte" subtitle="Index 2010 = 100 · direkte und indirekte Effekte"
      color="#dc2626" loading={loading} error={error}
      flowId="DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT" source="Quelle: Umweltbundesamt / Destatis">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[70, 115]} width={36} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: '2010 = 100', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
          {Object.keys(FOOTPRINT_COLORS).map(k => (
            <Line key={k} type="monotone" dataKey={k} stroke={FOOTPRINT_COLORS[k]}
              strokeWidth={2} dot={{ r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function EnvTaxRevenueChart() {
  const { data, loading, error } = useData(async () => {
    const named = await fetchDataSeries('DF_ENV_ECON_REVENUE_ENV_TAXES', '1.0', {
      'Energiesteuer':      { D_REV_ENV_TAXES: 'ENT' },
      'Kraftfahrzeugsteuer': { D_REV_ENV_TAXES: 'MVT' },
      'Stromsteuer':        { D_REV_ENV_TAXES: 'ELT' },
      'Emissionshandel':    { D_REV_ENV_TAXES: 'EAT' },
    })
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach(p => years.add(p.year))
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find(p => p.year === year)
        row[label] = pt ? +(pt.value / 1000).toFixed(1) : null
      }
      return row
    })
  })
  const latestTotal = data?.[data.length - 1]
  const total = latestTotal
    ? (['Energiesteuer', 'Kraftfahrzeugsteuer', 'Emissionshandel', 'Luftverkehrsteuer'] as const)
        .reduce((s, k) => s + (latestTotal[k] ?? 0), 0)
    : undefined

  return (
    <ChartCard title="Umweltsteuereinnahmen" subtitle="Mrd. € · gestapelt nach Steuerart"
      kpi={total} kpiUnit="Mrd. € gesamt" kpiYear={latestTotal?.year}
      color="#475569" loading={loading} error={error}
      flowId="DF_ENV_ECON_REVENUE_ENV_TAXES" source="Quelle: Umweltbundesamt / Destatis">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} interval={3} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" Mrd." width={44} />
          <Tooltip content={<TT unit="Mrd. €" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Energiesteuer" stackId="a" fill="#0284c7" />
          <Bar dataKey="Kraftfahrzeugsteuer" stackId="a" fill="#7c3aed" />
          <Bar dataKey="Emissionshandel" stackId="a" fill="#16a34a" />
          <Bar dataKey="Luftverkehrsteuer" stackId="a" fill="#d97706" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// KLIMAPROJEKTIONEN
// ═══════════════════════════════════════════════════════════════════════════════

const SEKTOR_COLORS: Record<string, string> = {
  'Energie':          '#ef4444',
  'Verkehr':          '#f97316',
  'Gebäude':          '#eab308',
  'Industrie':        '#8b5cf6',
  'Landwirtschaft':   '#16a34a',
  'Abfall':           '#0891b2',
}

// Sektoremissionen THG bis 2045 — Feature-Chart (volle Breite)
function GhgSectorProjectionChart() {
  const { data, loading, error } = useData(async () => {
    const csv = await fetchCsvSeries('DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26', '1.0')
    // D_KSG_SECTOR is the sector dim; D_UNIT=MT_CO2_EQ, D_SCENARIO_TYPE=MMS
    // Indicator THPR_DTNTBL_SNSTGS_10703870 = Sektoremissionen THG (Hauptserie)
    const THG_IND = 'THPR_DTNTBL_SNSTGS_10703870'
    const sectorKeys: Record<string, string> = {
      'Energie':          'ENERGIEWIRTSCHAFT',
      'Verkehr':          'VERKEHR',
      'Gebäude':          'GEBAEUDE',
      'Industrie':        'INDUSTRIE',
      'Landwirtschaft':   'LANDWIRTSCHAFT',
      'Abfall':           'ABFALLWIRTSCHAFT_SONSTIGES',
    }
    const years = new Set<string>()
    const seriesData: Record<string, Record<string, number | null>> = {}
    for (const [label, sectorCode] of Object.entries(sectorKeys)) {
      seriesData[label] = {}
      for (const { codes, colIds, obs } of Object.values(csv)) {
        const indIdx    = colIds.indexOf('D_INDICATOR_PROJECTION_REPORT')
        const unitIdx   = colIds.indexOf('D_UNIT')
        const sectorIdx = colIds.indexOf('D_KSG_SECTOR')
        const scenIdx   = colIds.indexOf('D_SCENARIO_TYPE')
        if (indIdx === -1 || unitIdx === -1 || sectorIdx === -1) continue
        if (codes[indIdx] !== THG_IND) continue
        if (codes[unitIdx] !== 'MT_CO2_EQ') continue
        if (codes[sectorIdx] !== sectorCode) continue
        if (scenIdx !== -1 && codes[scenIdx] !== 'MMS') continue
        for (const [yr, val] of Object.entries(obs)) {
          if (val != null) { seriesData[label][yr] = val; years.add(yr) }
        }
        break
      }
    }
    return Array.from(years).sort().map(year => {
      const row: Record<string, any> = { year }
      for (const label of Object.keys(sectorKeys)) {
        row[label] = seriesData[label][year] != null ? +seriesData[label][year]!.toFixed(1) : null
      }
      return row
    })
  })

  const latest = data?.[data.length - 1]
  const totalLatest = latest
    ? Object.keys(SEKTOR_COLORS).reduce((s, k) => s + (latest[k] ?? 0), 0)
    : undefined

  return (
    <ChartCard
      title="THG-Emissionen nach Sektor bis 2045"
      subtitle="Projektion 2026 · MMS-Szenario · Mio. t CO₂-Äq."
      kpi={totalLatest} kpiUnit="Mio. t CO₂" kpiYear={latest?.year}
      color="#dc2626" loading={loading} error={error} height={260}
      flowId="DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26"
      lazyFilters={{ D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_SNSTGS_10703870', D_UNIT: 'MT_CO2_EQ', D_KSG_SECTOR: 'TOTAL', D_SCENARIO_TYPE: 'MMS' }}
      source="Quelle: Umweltbundesamt / Klimaschutzbericht 2026"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <Grad id="gcEnergy"  color="#ef4444" />
          <Grad id="gcVerkehr" color="#f97316" />
          <Grad id="gcGeb"     color="#eab308" />
          <Grad id="gcInd"     color="#8b5cf6" />
          <Grad id="gcAgri"    color="#16a34a" />
          <Grad id="gcAbfall"  color="#0891b2" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
          <Tooltip content={<TT unit="Mio. t" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Area type="monotone" dataKey="Energie"        stackId="s" stroke="#ef4444" fill="url(#gcEnergy)"  strokeWidth={1.5} connectNulls />
          <Area type="monotone" dataKey="Industrie"      stackId="s" stroke="#8b5cf6" fill="url(#gcInd)"     strokeWidth={1.5} connectNulls />
          <Area type="monotone" dataKey="Gebäude"        stackId="s" stroke="#eab308" fill="url(#gcGeb)"     strokeWidth={1.5} connectNulls />
          <Area type="monotone" dataKey="Verkehr"        stackId="s" stroke="#f97316" fill="url(#gcVerkehr)" strokeWidth={1.5} connectNulls />
          <Area type="monotone" dataKey="Landwirtschaft" stackId="s" stroke="#16a34a" fill="url(#gcAgri)"    strokeWidth={1.5} connectNulls />
          <Area type="monotone" dataKey="Abfall"         stackId="s" stroke="#0891b2" fill="url(#gcAbfall)"  strokeWidth={1.5} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function EeAnteilProjectionChart() {
  const { data, loading, error } = useData(async () => {
    const csv = await fetchCsvSeries('DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26', '1.0')
    const EE_ANTEIL_ID = 'THPR_DTNTBL_ENRGWRTSCHFT_56241560' // Anteil EE am Bruttostromverbrauch (PZ)
    const EPKW_ID      = 'THPR_DTNTBL_VRKHR_71151484'        // E-PKW Bestand (Mio.)
    const years = new Set<string>()
    const ee: Record<string, number> = {}
    const epkw: Record<string, number> = {}
    for (const { codes, colIds, obs } of Object.values(csv)) {
      const indIdx  = colIds.indexOf('D_INDICATOR_PROJECTION_REPORT')
      const scenIdx = colIds.indexOf('D_SCENARIO_TYPE')
      if (indIdx === -1) continue
      if (scenIdx !== -1 && codes[scenIdx] !== 'MMS') continue
      const ind = codes[indIdx]
      for (const [yr, val] of Object.entries(obs)) {
        if (val == null) continue
        years.add(yr)
        if (ind === EE_ANTEIL_ID) ee[yr]   = val
        if (ind === EPKW_ID)      epkw[yr] = val
      }
    }
    return Array.from(years).sort().map(yr => ({
      year: yr,
      'EE-Anteil Strom (%)':  ee[yr]   != null ? +ee[yr].toFixed(1)   : null,
      'E-PKW Bestand (Mio.)': epkw[yr] != null ? +epkw[yr].toFixed(2) : null,
    }))
  })

  const latest = data?.filter(d => d['EE-Anteil Strom (%)'] != null).at(-1)

  return (
    <ChartCard
      title="Strom & Mobilität: Hochlauf der Elektrifizierung"
      subtitle="Projektion 2026 · MMS-Szenario · EE-Anteil & E-PKW Bestand"
      kpi={latest?.['EE-Anteil Strom (%)'] ?? undefined} kpiUnit="% EE-Strom" kpiYear={latest?.year}
      color="#16a34a" loading={loading} error={error} height={220}
      flowId="DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26"
      lazyFilters={{ D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_ENRGWRTSCHFT_56241560', D_UNIT: 'PZ', D_KSG_SECTOR: 'ENERGIEWIRTSCHAFT', D_SCENARIO_TYPE: 'MMS' }}
      source="Quelle: Umweltbundesamt / Projektion 2026"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data ?? []} margin={{ top: 16, right: 36, left: 0, bottom: 0 }}>
          <Grad id="gcEe" color="#16a34a" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
          <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#64748b' }} unit=" %" domain={[0, 100]} width={36} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} unit=" Mio." width={42} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Area yAxisId="left"  type="monotone" dataKey="EE-Anteil Strom (%)"  stroke="#16a34a" fill="url(#gcEe)" strokeWidth={2} connectNulls />
          <Line yAxisId="right" type="monotone" dataKey="E-PKW Bestand (Mio.)" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
          <ReferenceLine yAxisId="left" y={80} stroke="#16a34a" strokeDasharray="4 2"
            label={{ value: '80 %', position: 'insideTopRight', fontSize: 10, fill: '#16a34a' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function WaermepumpenProjectionChart() {
  const { data, loading, error } = useData(async () => {
    const csv = await fetchCsvSeries('DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26', '1.0')
    const WP_BESTAND_ID  = 'THPR_DTNTBL_GBD_44869581' // Anzahl Bestandsgebäude mit Wärmepumpe
    const GAS_BESTAND_ID = 'THPR_DTNTBL_GBD_19628695' // Anzahl Bestandsgebäude mit fossilen Gasheizungen
    const years = new Set<string>()
    const wp: Record<string, number> = {}
    const gas: Record<string, number> = {}
    for (const { codes, colIds, obs } of Object.values(csv)) {
      const indIdx  = colIds.indexOf('D_INDICATOR_PROJECTION_REPORT')
      const scenIdx = colIds.indexOf('D_SCENARIO_TYPE')
      if (indIdx === -1) continue
      if (scenIdx !== -1 && codes[scenIdx] !== 'MMS') continue
      const ind = codes[indIdx]
      for (const [yr, val] of Object.entries(obs)) {
        if (val == null) continue
        years.add(yr)
        if (ind === WP_BESTAND_ID)  wp[yr]  = val
        if (ind === GAS_BESTAND_ID) gas[yr] = val
      }
    }
    return Array.from(years).sort().map(yr => ({
      year: yr,
      'Wärmepumpen (Mio.)':  wp[yr]  != null ? +(wp[yr]  / 1_000_000).toFixed(2) : null,
      'Gasheizungen (Mio.)': gas[yr] != null ? +(gas[yr] / 1_000_000).toFixed(2) : null,
    }))
  })

  const latest = data?.filter(d => d['Wärmepumpen (Mio.)'] != null).at(-1)

  return (
    <ChartCard
      title="Wärmewende im Gebäudebestand bis 2045"
      subtitle="Projektion 2026 · MMS-Szenario · Mio. Gebäude"
      kpi={latest?.['Wärmepumpen (Mio.)'] ?? undefined} kpiUnit="Mio. WP" kpiYear={latest?.year}
      color="#f59e0b" loading={loading} error={error} height={220}
      flowId="DF_CROSS_PROJECTION_REPORT_CORE_INDICATORS_26"
      lazyFilters={{ D_COUNTRY: 'DE', FREQUENCY: 'A', D_REPORTING_YEAR: '2026', D_INDICATOR_PROJECTION_REPORT: 'THPR_DTNTBL_GBD_44869581', D_UNIT: 'AZ', D_KSG_SECTOR: 'GEBAEUDE', D_SCENARIO_TYPE: 'MMS' }}
      source="Quelle: Umweltbundesamt / Projektion 2026"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" Mio." width={44} />
          <Tooltip content={<TT unit="Mio. Gebäude" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="Wärmepumpen (Mio.)"  stroke="#f59e0b" strokeWidth={2.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="Gasheizungen (Mio.)" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function EnergiepreisProjectionChart() {
  const { data, loading, error } = useData(async () => {
    const csv = await fetchCsvSeries('DF_CROSS_PROJECTION_REPORT_FINAL_CONSUMER_PRICES', '1.0')
    // Strom Haushalte (EUR/MWh), Erdgas Haushalte inkl MwSt (EUR/MWh HI), Diesel inkl MwSt (EUR/l → ×1000 → EUR/MWh)
    const STROM_ID  = 'STROMPREIS_HAUSHALTE_2_ENDVERBRAUCHERPREIS_INKL_MWST'
    const GAS_ID    = 'ERDGAS_HAUSHALTE_ENDVERBRAUCHERPREIS_MIT_MWST'
    const DIESEL_ID = 'ERDOELPRODUKTE_DIESEL_ENDVERBRAUCHERPREIS_MIT_MWST'
    const years = new Set<string>()
    const strom: Record<string, number> = {}
    const gas:   Record<string, number> = {}
    const diesel: Record<string, number> = {}
    for (const { codes, colIds, obs } of Object.values(csv)) {
      const indIdx = colIds.indexOf('D_INDICATOR_PROJECTION_REPORT')
      if (indIdx === -1) continue
      const ind = codes[indIdx]
      for (const [yr, val] of Object.entries(obs)) {
        if (val == null) continue
        years.add(yr)
        if (ind === STROM_ID)  strom[yr]  = val
        if (ind === GAS_ID)    gas[yr]    = val
        if (ind === DIESEL_ID) diesel[yr] = val
      }
    }
    return Array.from(years).sort().map(yr => ({
      year: yr,
      'Strom HH (€/MWh)':  strom[yr]  != null ? +strom[yr].toFixed(1)  : null,
      'Erdgas HH (€/MWh)': gas[yr]    != null ? +gas[yr].toFixed(1)    : null,
      'Diesel (€/L × 100)':diesel[yr] != null ? +(diesel[yr] * 100).toFixed(1) : null,
    }))
  })

  const latestStrom = data?.filter(d => d['Strom HH (€/MWh)'] != null).at(-1)

  return (
    <ChartCard
      title="Energiepreise bis 2045 (Bundesregierung)"
      subtitle="Projektion 2025 · Endverbraucherpreise inkl. MwSt."
      kpi={latestStrom?.['Strom HH (€/MWh)'] ?? undefined} kpiUnit="€/MWh Strom" kpiYear={latestStrom?.year}
      color="#7c3aed" loading={loading} error={error} height={220}
      flowId="DF_CROSS_PROJECTION_REPORT_FINAL_CONSUMER_PRICES"
      lazyFilters={{ D_COUNTRY: 'DE', D_UNIT: 'EUR_2023_MWH', D_INDICATOR_PROJECTION_REPORT: 'STROMPREIS_HAUSHALTE_2_ENDVERBRAUCHERPREIS_INKL_MWST', D_REPORTING_YEAR: '2025' }}
      source="Quelle: Umweltbundesamt / Prognos · Projektion 2025"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} interval={3} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={40} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="Strom HH (€/MWh)"  stroke="#7c3aed" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Erdgas HH (€/MWh)" stroke="#f97316" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="Diesel (€/L × 100)" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnalysePage() {
  const [modalCard, setModalCard] = useState<SocialCardData | null>(null)

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 md:px-5 md:py-7">
      {modalCard && <SocialCardModal data={modalCard} onClose={() => setModalCard(null)} />}
      <SEO
        title="Analysen"
        description="Ausgewählte Umwelttrends auf Umweltpuls — Temperaturentwicklung, Treibhausgase, Erneuerbare Energien und mehr, basierend auf Daten des Umweltbundesamts."
        path="/analysen"
      />
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Analysen</h1>
      <p style={{ color: '#64748b', marginBottom: 36, fontSize: 14 }}>
        Ausgewählte Umwelttrends auf Basis der Daten des Umweltbundesamts – direkt aus der SDMX REST API.
      </p>

      {/* ── Feature: Klimaprojektionen ─────────────────────────────────────────── */}
      <div style={{
        marginBottom: 52,
        borderRadius: 14,
        border: '2px solid #fecdd3',
        background: 'linear-gradient(135deg, #fff7f7 0%, #f0fdf4 100%)',
        padding: '20px 20px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '3px solid #dc2626', paddingBottom: 10 }}>
          <span style={{ fontSize: 24 }}>🔭</span>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Klimaprojektionen 2026</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              Offizielle Projektionsdaten der Bundesregierung — wie sieht Deutschlands Klimapfad bis 2045 aus?
            </p>
          </div>
          <span style={{
            marginLeft: 'auto', fontSize: 10, fontWeight: 700,
            background: '#dc2626', color: '#fff',
            borderRadius: 6, padding: '3px 8px', letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>NEU</span>
        </div>
        {/* Feature chart: volle Breite */}
        <div style={{ marginBottom: 12 }}>
          <GhgSectorProjectionChart />
        </div>
        {/* 3 weitere Charts in Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3" style={{ marginBottom: 4 }}>
          <EeAnteilProjectionChart />
          <WaermepumpenProjectionChart />
          <EnergiepreisProjectionChart />
        </div>
      </div>

      <Section title="Klima" icon="🌡️" color="#dc2626">
        <TemperatureChart onShare={setModalCard} />
        <HotDaysChart />
        <PrecipitationChart />
      </Section>

      <Section title="Energiewende & Verkehr" icon="⚡" color="#16a34a">
        <RenewableShareChart onShare={setModalCard} />
        <ElectricCarChart />
        <FuelConsumptionChart />
        <GreenMobilityChart />
      </Section>

      <Section title="Luft" icon="💨" color="#7c3aed">
        <AirPollutantsChart onShare={setModalCard} />
        <FuelPricesChart />
      </Section>

      <Section title="Landwirtschaft & Wald" icon="🌿" color="#65a30d">
        <NitrogenChart />
        <ForestFireChart />
      </Section>

      <Section title="Wasser" icon="💧" color="#0369a1">
        <WaterTempChart />
        <RiverDischargeChart />
      </Section>

      <Section title="Abfall & Kreislaufwirtschaft" icon="♻️" color="#0891b2">
        <WasteRecyclingRateChart />
        <WasteDisposalChart />
      </Section>

      <Section title="Konsum & Wirtschaft" icon="📊" color="#475569">
        <ConsumerFootprintChart />
        <EnvTaxRevenueChart />
      </Section>

      <div style={{ padding: '16px 0', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
        Datenquelle:{' '}
        <a href="https://datacube.uba.de" target="_blank" rel="noopener noreferrer" style={{ color: '#1e3a5f' }}>
          Umweltbundesamt Datacube
        </a>
        {' · '}SDMX REST API: daten.uba.de
      </div>
    </div>
  )
}
