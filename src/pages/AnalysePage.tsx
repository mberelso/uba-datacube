import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, ComposedChart,
} from 'recharts'
import { fetchAveragedSeries, fetchSingleSeries, fetchNamedSeries, type TimePoint } from '../api/sdmx'

// ── helpers ──────────────────────────────────────────────────────────────────

function useData(loader: () => Promise<any>, deps: any[] = []) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    loader().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, loading }
}

const fmt = (n: number, dec = 1) => n.toLocaleString('de-DE', { maximumFractionDigits: dec })

// baseline temperature 1961-1990 for Germany ≈ 8.2°C (DWD reference)
const TEMP_BASELINE = 8.2

function hotDayColor(val: number) {
  if (val >= 20) return '#7f1d1d'
  if (val >= 15) return '#dc2626'
  if (val >= 10) return '#ef4444'
  if (val >= 6)  return '#f97316'
  if (val >= 3)  return '#fb923c'
  return '#fbbf24'
}

const CustomHotTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <b>{label}</b><br />
      {fmt(payload[0].value, 1)} Heißtage (Ø alle Bundesländer)
    </div>
  )
}

// ── section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, borderBottom: `3px solid ${color}`, paddingBottom: 10 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ChartCard({ title, subtitle, kpi, kpiLabel, color, loading, children }: {
  title: string; subtitle: string; kpi?: string; kpiLabel?: string
  color: string; loading: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden', borderTop: `4px solid ${color}` }}>
      <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>
        </div>
        {kpi && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{kpi}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{kpiLabel}</div>
          </div>
        )}
      </div>
      <div style={{ height: 220, padding: '4px 8px 12px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
            Lade Daten…
          </div>
        ) : children}
      </div>
    </div>
  )
}

// ── Klima ─────────────────────────────────────────────────────────────────────

function TemperatureChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_TEMPERATURE_MEAN,1.0', 'DE.A.DEGC.JM.')
  )
  const latest = data?.[data.length - 1]
  const anomaly = latest ? latest.value - TEMP_BASELINE : null

  const chartData = (data as TimePoint[] | null)?.map((p) => ({
    year: p.year,
    temp: +p.value.toFixed(2),
    anomaly: +(p.value - TEMP_BASELINE).toFixed(2),
  }))

  return (
    <ChartCard
      title="Lufttemperatur Deutschland"
      subtitle={`Jahresmittel (Ø aller Bundesländer) — Abweichung von Referenzperiode 1961–1990 (${TEMP_BASELINE} °C)`}
      kpi={anomaly != null ? `+${fmt(anomaly, 2)} °C` : undefined}
      kpiLabel={`Anomalie ${latest?.year ?? ''}`}
      color="#dc2626"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={19} />
          <YAxis tick={{ fontSize: 10 }} domain={[-2, 4]} unit="°C" />
          <Tooltip
            formatter={(v: any) => [`${v > 0 ? '+' : ''}${fmt(v, 2)} °C`, 'Anomalie']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 2" label={{ value: 'Referenz 1961–90', position: 'insideTopLeft', fontSize: 10, fill: '#64748b' }} />
          <Area type="monotone" dataKey="anomaly" stroke="#dc2626" strokeWidth={1.5}
            fill="url(#tempGrad)" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function HotDaysChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_CLIMATE_GERMANY_HOT_DAYS,1.0', 'DE.A.DAYS.JW.')
  )
  const latest = data?.[data.length - 1]
  const baseline = (data as TimePoint[] | null)
    ?.filter((p) => Number(p.year) >= 1951 && Number(p.year) <= 1980)
    .reduce((acc, p, _, arr) => acc + p.value / arr.length, 0)

  return (
    <ChartCard
      title="Heißtage pro Jahr"
      subtitle="Tage mit Tmax > 30 °C (Ø aller Bundesländer)"
      kpi={latest ? fmt(latest.value, 1) : undefined}
      kpiLabel={`Tage (${latest?.year ?? ''})`}
      color="#d97706"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data as TimePoint[]} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
          <YAxis tick={{ fontSize: 10 }} unit=" d" />
          <Tooltip content={<CustomHotTooltip />} />
          {baseline != null && (
            <ReferenceLine y={baseline} stroke="#94a3b8" strokeDasharray="4 2"
              label={{ value: `Ø 1951–80: ${fmt(baseline, 1)} d`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
          )}
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {(data as TimePoint[] | null)?.map((entry) => (
              <Cell key={entry.year} fill={hotDayColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Energiewende ──────────────────────────────────────────────────────────────

function RenewableShareChart() {
  const { data, loading } = useData(() =>
    fetchSingleSeries('UBA,DF_ENERGY_AGEE_SHARE,1.0', 'DE.A.PZ.SHARE_EE_GFEC_RED.EE')
  )
  const latest = data?.[data.length - 1]

  return (
    <ChartCard
      title="Anteil Erneuerbarer Energien"
      subtitle="Am Brutto-Endenergieverbrauch (RED-Methodik)"
      kpi={latest ? `${fmt(latest.value, 1)} %` : undefined}
      kpiLabel={latest?.year ?? ''}
      color="#16a34a"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data as TimePoint[]} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="eeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit=" %" domain={[0, 45]} />
          <Tooltip formatter={(v: any) => [`${fmt(v, 1)} %`, 'Anteil EE']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <ReferenceLine y={42.5} stroke="#15803d" strokeDasharray="5 3"
            label={{ value: 'EU-Ziel 2030: 42,5 %', position: 'insideTopLeft', fontSize: 10, fill: '#15803d' }} />
          <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2}
            fill="url(#eeGrad)" dot={{ r: 3, fill: '#16a34a' }} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ElectricCarChart() {
  const { data, loading } = useData(async () => {
    const named = await fetchNamedSeries(
      'UBA,DF_TRANSPORT_VEHICLE_STOCK_TREND_FUEL,1.0',
      'DE.A.AZ.PKW.',
      {
        '0:0:0:0:1': 'Vollelektrisch (BEV)',
        '0:0:0:0:8': 'Plug-in-Hybrid (PHEV)',
        '0:0:0:0:6': 'Hybrid (HEV)',
      }
    )
    // merge into one array per year
    const years = new Set<string>()
    for (const pts of Object.values(named)) pts.forEach((p) => years.add(p.year))
    return Array.from(years).sort().map((year) => {
      const row: Record<string, any> = { year }
      for (const [label, pts] of Object.entries(named)) {
        const pt = pts.find((p) => p.year === year)
        row[label] = pt ? +(pt.value / 1e6).toFixed(3) : null
      }
      return row
    })
  })

  const latestBEV = data?.[data.length - 1]?.['Vollelektrisch (BEV)']

  return (
    <ChartCard
      title="Pkw-Bestand nach Antrieb"
      subtitle="Millionen Fahrzeuge (Stichtag 1. Januar)"
      kpi={latestBEV ? `${fmt(latestBEV, 2)} Mio.` : undefined}
      kpiLabel={`BEV (${data?.[data.length - 1]?.year ?? ''})`}
      color="#0284c7"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit=" Mio." />
          <Tooltip formatter={(v: any) => [`${fmt(v, 3)} Mio.`, '']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey="Vollelektrisch (BEV)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="Plug-in-Hybrid (PHEV)" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="Hybrid (HEV)" stroke="#0891b2" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Wasser ────────────────────────────────────────────────────────────────────

function WaterTempChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_DAS_WASSER_WW_I_10,1.0')
  )
  const latest = data?.[data.length - 1]

  return (
    <ChartCard
      title="Wassertemperatur der Fließgewässer"
      subtitle="Ø aller Messstellen (°C) — DAS Wasserindikator WW-I-10"
      kpi={latest ? `${fmt(latest.value, 1)} °C` : undefined}
      kpiLabel={latest?.year ?? ''}
      color="#0369a1"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data as TimePoint[]} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0369a1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0369a1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="°C" />
          <Tooltip formatter={(v: any) => [`${fmt(v, 1)} °C`, 'Wassertemperatur']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Area type="monotone" dataKey="value" stroke="#0369a1" strokeWidth={2}
            fill="url(#waterGrad)" dot={false} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function MeanDischargeChart() {
  const { data, loading } = useData(() =>
    fetchAveragedSeries('UBA,DF_DAS_WASSER_WW_I_3,1.0')
  )
  const latest = data?.[data.length - 1]

  return (
    <ChartCard
      title="Mittlerer Abfluss der Flüsse"
      subtitle="Ø aller Pegel (MQ-Abweichung) — DAS Wasserindikator WW-I-3"
      kpi={latest ? `${fmt(latest.value, 1)}` : undefined}
      kpiLabel={latest?.year ?? ''}
      color="#0891b2"
      loading={loading}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data as TimePoint[]} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: any) => [fmt(v, 2), 'Abfluss']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 2" />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {(data as TimePoint[] | null)?.map((entry) => (
              <Cell key={entry.year} fill={entry.value < 0 ? '#ef4444' : '#0891b2'} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Analysen</h1>
      <p style={{ color: '#64748b', marginBottom: 36, fontSize: 14 }}>
        Ausgewählte Umwelttrends aus dem UBA Datacube – direkt aus der SDMX REST API.
      </p>

      <Section title="Klima" icon="🌡️" color="#dc2626">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
          <TemperatureChart />
          <HotDaysChart />
        </div>
      </Section>

      <Section title="Energiewende" icon="⚡" color="#16a34a">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
          <RenewableShareChart />
          <ElectricCarChart />
        </div>
      </Section>

      <Section title="Wasser" icon="💧" color="#0369a1">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
          <WaterTempChart />
          <MeanDischargeChart />
        </div>
      </Section>

      <div style={{ padding: '16px 0', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Datenquelle: <a href="https://datacube.uba.de" target="_blank" rel="noopener noreferrer" style={{ color: '#1e3a5f' }}>Umweltbundesamt Datacube</a>
      </div>
    </div>
  )
}
