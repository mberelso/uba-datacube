import { useEffect, useState, type ReactNode } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ComposedChart, Legend,
} from 'recharts'
import { fetchAveragedSeries, fetchSingleSeries, fetchNamedSeries, type TimePoint } from '../api/sdmx'

// ── tiny helpers ──────────────────────────────────────────────────────────────

function useData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    loader().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { data, loading }
}

const fmt = (n: number, dec = 1) => n.toLocaleString('de-DE', { maximumFractionDigits: dec })

// ── layout primitives ─────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        borderBottom: `3px solid ${color}`, paddingBottom: 10 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, kpi, kpiUnit, kpiYear, trend, color, loading, height = 200, children }: {
  title: string; subtitle: string
  kpi?: number; kpiUnit?: string; kpiYear?: string; trend?: number
  color: string; loading: boolean; height?: number; children: ReactNode
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0',
      overflow: 'hidden', borderTop: `4px solid ${color}` }}>
      <div style={{ padding: '16px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>
        </div>
        {kpi != null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{fmt(kpi, 1)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{kpiUnit}{kpiYear ? ` (${kpiYear})` : ''}</div>
            {trend != null && (
              <div style={{ fontSize: 11, marginTop: 2, color: trend < 0 ? '#16a34a' : '#dc2626' }}>
                {trend > 0 ? '▲' : '▼'} {fmt(Math.abs(trend), 2)}
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ height, padding: '0 6px 10px' }}>
        {loading
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>Lade Daten…</div>
          : children}
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

// ═══════════════════════════════════════════════════════════════════════════════
// KLIMA
// ═══════════════════════════════════════════════════════════════════════════════

const TEMP_BASELINE = 8.2

function TemperatureChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_TEMPERATURE_MEAN,1.0', 'DE.A.DEGC.JM.'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const anomaly = latest ? latest.value - TEMP_BASELINE : undefined
  const prevAnomaly = pts && pts.length >= 2 ? pts[pts.length - 2].value - TEMP_BASELINE : undefined
  const chartData = pts?.map(p => ({ year: p.year, anomaly: +(p.value - TEMP_BASELINE).toFixed(2) }))

  return (
    <ChartCard title="Temperaturanomalie Deutschland" subtitle="Abweichung vom Referenzmittel 1961–1990 (8,2 °C) · Ø aller Bundesländer"
      kpi={anomaly} kpiUnit="°C Anomalie" kpiYear={latest?.year}
      trend={anomaly != null && prevAnomaly != null ? anomaly - prevAnomaly : undefined}
      color="#dc2626" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <Grad id="tGrad" color="#dc2626" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={19} />
          <YAxis tick={{ fontSize: 9 }} unit="°C" domain={[-2.5, 4]} />
          <Tooltip content={<TT unit="°C" />} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: 'Referenz 1961–90', position: 'insideTopLeft', fontSize: 9, fill: '#94a3b8' }} />
          <Area type="monotone" dataKey="anomaly" stroke="#dc2626" strokeWidth={1.5}
            fill="url(#tGrad)" dot={false} connectNulls name="Anomalie" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function HotDaysChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_HOT_DAYS,1.0', 'DE.A.DAYS.JW.'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const baseline = pts?.filter(p => +p.year >= 1951 && +p.year <= 1980)
    .reduce((s, p, _, arr) => s + p.value / arr.length, 0)
  const color = (v: number) =>
    v >= 20 ? '#7f1d1d' : v >= 15 ? '#dc2626' : v >= 10 ? '#ef4444' : v >= 6 ? '#f97316' : v >= 3 ? '#fb923c' : '#fbbf24'

  return (
    <ChartCard title="Heißtage pro Jahr" subtitle="Tage mit Tmax > 30 °C · Ø aller Bundesländer · farbkodiert nach Intensität"
      kpi={latest?.value} kpiUnit="Tage" kpiYear={latest?.year}
      color="#d97706" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pts ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={4} />
          <YAxis tick={{ fontSize: 9 }} unit=" d" />
          <Tooltip content={<TT unit="Tage" />} />
          {baseline != null && <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: `Ø 1951–80: ${fmt(baseline, 1)} d`, position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />}
          <Bar dataKey="value" radius={[2, 2, 0, 0]} name="Heißtage">
            {pts?.map(e => <Cell key={e.year} fill={color(e.value)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function PrecipitationChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_PRECIPATION,1.0', 'DE.A.MM.JW.'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const baseline = pts?.filter(p => +p.year >= 1961 && +p.year <= 1990)
    .reduce((s, p, _, arr) => s + p.value / arr.length, 0)

  return (
    <ChartCard title="Jahresniederschlag Deutschland" subtitle="Ø aller Bundesländer (mm) · 1881–2025"
      kpi={latest?.value} kpiUnit="mm" kpiYear={latest?.year}
      color="#0369a1" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pts ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <Grad id="pGrad" color="#0369a1" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={19} />
          <YAxis tick={{ fontSize: 9 }} unit=" mm" domain={[400, 1100]} />
          <Tooltip content={<TT unit="mm" />} />
          {baseline != null && <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: `Ø 1961–90: ${fmt(baseline, 0)} mm`, position: 'insideBottomRight', fontSize: 9, fill: '#94a3b8' }} />}
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

function RenewableShareChart() {
  const { data, loading } = useData(() =>
    fetchSingleSeries('UBA,DF_ENERGY_AGEE_SHARE,1.0', 'DE.A.PZ.SHARE_EE_GFEC_RED.EE'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]

  return (
    <ChartCard title="Anteil Erneuerbarer Energien" subtitle="Am Brutto-Endenergieverbrauch (RED-Methodik)"
      kpi={latest?.value} kpiUnit="%" kpiYear={latest?.year}
      color="#16a34a" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <Grad id="eeGrad" color="#16a34a" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" %" domain={[0, 50]} />
          <Tooltip content={<TT unit="%" />} />
          <ReferenceLine y={42.5} stroke="#15803d" strokeDasharray="5 3"
            label={{ value: 'EU-Ziel 2030: 42,5 %', position: 'insideTopLeft', fontSize: 9, fill: '#15803d' }} />
          <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2}
            fill="url(#eeGrad)" dot={{ r: 3, fill: '#16a34a' }} connectNulls name="EE-Anteil" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ElectricCarChart() {
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL,1.0', 'DE.A.AZ.PKW.',
      { '0:0:0:0:1': 'BEV', '0:0:0:0:8': 'PHEV', '0:0:0:0:6': 'Hybrid' })
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
      color="#0284c7" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 4, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" Mio." />
          <Tooltip content={<TT unit="Mio." />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="BEV" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="PHEV" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="Hybrid" stroke="#0891b2" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function FuelConsumptionChart() {
  const { data, loading } = useData(() =>
    // index 1 = L/100km annual mean
    fetchSingleSeries('UBA,DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION,1.0', 'all', 1))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]
  const first = pts?.[0]

  return (
    <ChartCard title="Kraftstoffverbrauch Pkw" subtitle="Durchschnittlicher Verbrauch im Straßenverkehr (L/100 km)"
      kpi={latest?.value} kpiUnit="L/100 km" kpiYear={latest?.year}
      trend={first && latest ? latest.value - first.value : undefined}
      color="#b45309" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pts ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <Grad id="fcGrad" color="#b45309" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" L" domain={[6, 10]} />
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

function AirPollutantsChart() {
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_AIR_EMISSIONS_INDEX,2026.0', 'all', {
      '0:0:0:0': 'NH₃', '0:1:0:0': 'NMVOC', '0:2:0:0': 'NOₓ', '0:3:0:0': 'PM2,5', '0:4:0:0': 'SO₂',
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
    <ChartCard title="Luftschadstoff-Emissionsindex" subtitle="Index 2005 = 100 · alle Schadstoffe klar rückläufig"
      color="#7c3aed" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} domain={[20, 130]} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: '2005 = 100', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
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
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_TRANSPORT_ENERGY_FUEL_PRICES,1.0', 'all',
      { '0:0:0:0:0': 'Benzin', '0:0:0:0:1': 'Diesel' })
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
      color="#f59e0b" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" €" domain={[0.8, 2.2]} />
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
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_AGRICULTURE_FORESTRY_NITROGEN_SURPLUS,1.0', 'all', {
      '0:0:0:0:0': 'Stickstoff-Input',
      '0:0:0:0:1': 'Stickstoff-Saldo',
      '0:0:0:0:2': 'Stickstoff-Abfuhr',
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
      color="#65a30d" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data ?? []} margin={{ top: 4, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" kg" />
          <Tooltip content={<TT unit="kg N/ha" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={70} stroke="#16a34a" strokeDasharray="5 3"
            label={{ value: 'Ziel 2030: 70 kg/ha', position: 'insideTopRight', fontSize: 9, fill: '#16a34a' }} />
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
  const { data, loading } = useData(async () => {
    // Sum fire area (HA=unit idx 1, FA=indicator idx 1) across all causes
    const named = await fetchNamedSeries('UBA,DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA,1.0', 'all', {
      '0:0:1:0:1': 'Natürlich', '0:0:1:1:1': 'Fahrlässig',
      '0:0:1:2:1': 'Unbekannt', '0:0:1:3:1': 'Brandstiftung', '0:0:1:4:1': 'Sonstige',
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
      color="#d97706" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 4, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={2} />
          <YAxis tick={{ fontSize: 9 }} unit=" ha" />
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
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_TRANSPORT_PASSENGER_PERFORMANCE_SHARE,1.0', 'all', {
      '0:0:0:0:0': 'ÖPNV (Straße)',
      '0:0:0:4:0': 'Schiene',
      '0:0:0:3:0': 'Radverkehr',
      '0:0:0:2:0': 'Fußverkehr',
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
      color="#16a34a" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" %" />
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
  const { data, loading } = useData(() => fetchAveragedSeries('UBA,DF_DAS_WASSER_WW_I_10,1.0'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]

  return (
    <ChartCard title="Wassertemperatur der Fließgewässer" subtitle="DAS WW-I-10 · Ø aller Messstellen (°C)"
      kpi={latest?.value} kpiUnit="°C" kpiYear={latest?.year}
      color="#0369a1" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <Grad id="wGrad" color="#0369a1" />
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit="°C" />
          <Tooltip content={<TT unit="°C" />} />
          <Area type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={2}
            fill="url(#wGrad)" dot={false} connectNulls name="Wassertemperatur" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function RiverDischargeChart() {
  const { data, loading } = useData(() => fetchAveragedSeries('UBA,DF_DAS_WASSER_WW_I_3,1.0'))
  const pts = data as TimePoint[] | null
  const latest = pts?.[pts.length - 1]

  return (
    <ChartCard title="Mittlerer Abfluss der Flüsse" subtitle="DAS WW-I-3 · Ø aller Pegel (Abweichung vom Mittel)"
      kpi={latest?.value} kpiUnit="" kpiYear={latest?.year}
      color="#0891b2" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pts ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
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
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_WASTE_RECOVERY_RATE,1.0', 'all', {
      '0:0:0:1:1:0': 'Gesamtabfall (nicht-gef.)',
      '0:0:0:2:1:1': 'Siedlungsabfall (gesamt)',
      '0:0:0:4:1:1': 'Haushaltsähnl. Abfall (ges.)',
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
      color="#0891b2" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 4, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" %" domain={[40, 90]} />
          <Tooltip content={<TT unit="%" />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={65} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: 'EU-Ziel 2035: 65 %', position: 'insideTopLeft', fontSize: 9, fill: '#94a3b8' }} />
          <Bar dataKey="Gesamtabfall (nicht-gef.)" fill="#0891b2" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Siedlungsabfall (gesamt)" fill="#7c3aed" radius={[2, 2, 0, 0]} />
          <Bar dataKey="Haushaltsähnl. Abfall (ges.)" fill="#16a34a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function WasteDisposalChart() {
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_WASTE_VOLUME,1.0', 'all', {
      '0:0:0:2:1:2': 'Stoffliche Verwertung',
      '0:0:0:2:1:1': 'Thermische Behandlung',
      '0:0:0:2:1:3': 'Deponierung',
      '0:0:0:2:1:0': 'Behandlung zur Beseitigung',
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
      color="#475569" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 4, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} unit=" Mio. t" />
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
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_CONSUMPTION_GLOBAL_ENV_FOOTPRINT,1.0', 'all', {
      '0:0:0:0': 'CO₂-Emissionen',
      '0:0:0:1': 'Rohstoffverbrauch',
      '0:0:0:2': 'Energieverbrauch',
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
      color="#dc2626" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data ?? []} margin={{ top: 4, right: 10, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} domain={[70, 115]} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: '2010 = 100', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
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
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries('UBA,DF_ENV_ECON_REVENUE_ENV_TAXES,1.0', 'all', {
      '0:0:0:4': 'Energiesteuer',
      '0:0:0:0': 'Kraftfahrzeugsteuer',
      '0:0:0:2': 'Emissionshandel',
      '0:0:0:3': 'Luftverkehrsteuer',
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
      color="#475569" loading={loading} height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data ?? []} margin={{ top: 4, right: 10, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={3} />
          <YAxis tick={{ fontSize: 9 }} unit=" Mrd." />
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
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AnalysePage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Analysen</h1>
      <p style={{ color: '#64748b', marginBottom: 36, fontSize: 14 }}>
        Ausgewählte Umwelttrends aus dem UBA Datacube – direkt aus der SDMX REST API.
      </p>

      <Section title="Klima" icon="🌡️" color="#dc2626">
        <TemperatureChart />
        <HotDaysChart />
        <PrecipitationChart />
      </Section>

      <Section title="Energiewende & Verkehr" icon="⚡" color="#16a34a">
        <RenewableShareChart />
        <ElectricCarChart />
        <FuelConsumptionChart />
        <GreenMobilityChart />
      </Section>

      <Section title="Luft" icon="💨" color="#7c3aed">
        <AirPollutantsChart />
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
