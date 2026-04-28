import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fetchData, fetchDataflows, type Dataflow } from '../api/sdmx'
import { CATEGORIES } from '../utils/categories'

interface HighlightConfig {
  flowId: string
  key?: string
  title: string
  subtitle: string
  icon: string
  color: string
  chartType: 'area' | 'line' | 'bar'
  unit?: string
  invertColors?: boolean
}

const HIGHLIGHTS: HighlightConfig[] = [
  {
    flowId: 'DF_CLIMATE_GERMANY_TEMPERATURE_MEAN',
    key: 'DE.A.DEGC.JM.',
    title: 'Temperatur Deutschland',
    subtitle: 'Jahresmittelwert Lufttemperatur 2m',
    icon: '🌡️', color: '#dc2626', chartType: 'area', unit: '°C',
  },
  {
    flowId: 'DF_CLIMATE_EMISSIONS_GHG_TRENDS',
    key: 'DE.A.MT_CO2EQ.GESAMT.MT_CO2EQ',
    title: 'Treibhausgasemissionen',
    subtitle: 'Gesamtemissionen nach UNFCCC',
    icon: '🏭', color: '#7c3aed', chartType: 'area', unit: 'Mt CO₂eq',
  },
  {
    flowId: 'DF_ENERGY_AGEE_SHARE',
    key: 'DE.A.PZ.SHARE_EE_GFEC_RED.EE',
    title: 'Erneuerbare Energien',
    subtitle: 'Anteil am Bruttoendenergieverbrauch',
    icon: '⚡', color: '#16a34a', chartType: 'bar', unit: '%',
  },
  {
    flowId: 'DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA',
    key: 'DE.A.HA.GESAMT.HA',
    title: 'Waldbrandfläche',
    subtitle: 'Jährliche Brandfläche in Deutschland',
    icon: '🔥', color: '#d97706', chartType: 'bar', unit: 'ha', invertColors: true,
  },
]

interface ChartPoint { year: string; value: number | null }

function useHighlightData(config: HighlightConfig, flows: Dataflow[]) {
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const flow = flows.find((f) => f.id === config.flowId)
    if (!flow) { setLoading(false); return }
    setLoading(true)
    fetchData(flow)
      .then(({ seriesMap, timeValues }) => {
        let observations: Record<string, number | null> = {}
        
        // If a specific key is provided, use it
        if (config.key && seriesMap[config.key]) {
          observations = seriesMap[config.key].observations
        } else {
          // Find first series that actually has non-null data
          const seriesKeys = Object.keys(seriesMap)
          for (const key of seriesKeys) {
            const obs = seriesMap[key].observations
            if (Object.values(obs).some(v => v !== null)) {
              observations = obs
              break
            }
          }
          // Fallback to first series if all empty
          if (Object.keys(observations).length === 0 && seriesKeys.length > 0) {
            observations = seriesMap[seriesKeys[0]].observations
          }
        }

        setData(timeValues.map((y) => ({ year: y, value: observations[y] ?? null })).filter((d) => d.value != null))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [config.flowId, flows])

  return { data, loading }
}

function HighlightCard({ config, flows }: { config: HighlightConfig; flows: Dataflow[] }) {
  const { data, loading } = useHighlightData(config, flows)

  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const trend =
    latest?.value != null && previous?.value != null
      ? latest.value - previous.value
      : null

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0',
      overflow: 'hidden', borderTop: `4px solid ${config.color}` }}>
      <div style={{ padding: '16px 20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 24 }}>{config.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '4px 0 2px' }}>
              {config.title}
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{config.subtitle}</p>
          </div>
          {latest?.value != null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: config.color }}>
                {Number(latest.value).toLocaleString('de-DE', { maximumFractionDigits: 1 })}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {config.unit} ({latest.year})
              </div>
              {trend != null && (
                <div style={{
                  fontSize: 12, marginTop: 2,
                  color: (config.invertColors ? trend > 0 : trend < 0) ? '#16a34a' : '#dc2626',
                }}>
                  {trend > 0 ? '▲' : '▼'}{' '}
                  {Math.abs(trend).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 110, padding: '0 6px 4px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#94a3b8', fontSize: 12 }}>
            Lade…
          </div>
        ) : (
          <div style={{ height: '100%' }}>
            {data.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#94a3b8', fontSize: 11 }}>
                Keine Daten für diesen Zeitraum verfügbar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {config.chartType === 'bar' ? (
                  <BarChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6 }}
                      formatter={(v: any) => [
                        Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }),
                        config.unit ?? '',
                      ]}
                    />
                    <Bar dataKey="value" fill={config.color} radius={[2, 2, 0, 0]} />
                  </BarChart>
                ) : config.chartType === 'area' ? (
                  <AreaChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${config.flowId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 6 }}
                      formatter={(v: any) => [
                        Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }),
                        config.unit ?? '',
                      ]}
                    />
                    <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2}
                      fill={`url(#grad-${config.flowId})`} dot={false} connectNulls />
                  </AreaChart>
                ) : (
                  <LineChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    <Line type="monotone" dataKey="value" stroke={config.color}
                      strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #f1f5f9' }}>
        <Link
          to={`/dataset/${encodeURIComponent(config.flowId)}`}
          style={{ fontSize: 12, color: config.color, textDecoration: 'none', fontWeight: 500 }}
        >
          Details & alle Serien →
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [flows, setFlows] = useState<Dataflow[]>([])
  const [loadingFlows, setLoadingFlows] = useState(true)

  useEffect(() => {
    fetchDataflows().then(setFlows).finally(() => setLoadingFlows(false))
  }, [])

  const byCategory: Record<string, number> = {}
  for (const f of flows) {
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f4c81 100%)',
        borderRadius: 16, padding: '32px 36px', color: '#fff', marginBottom: 32,
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌍</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          UBA Datacube
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px',
          maxWidth: 600, lineHeight: 1.6 }}>
          Interaktive Visualisierung der Umweltdaten des Umweltbundesamts.
          81 Datensätze zu Klima, Energie, Verkehr, Wasser und mehr –
          direkt aus der SDMX REST API.
        </p>
        <Link to="/catalog" style={{
          display: 'inline-block', background: '#fff', color: '#1e3a5f',
          padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
        }}>
          Alle {loadingFlows ? '…' : flows.length} Datensätze →
        </Link>
      </div>

      {/* Highlight charts */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
        Highlights
      </h2>
      {loadingFlows ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Lade Datensätze…</div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16, marginBottom: 36,
        }}>
          {HIGHLIGHTS.map((h) => (
            <HighlightCard key={h.flowId} config={h} flows={flows} />
          ))}
        </div>
      )}

      {/* Category tiles */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
        Themenbereiche
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const count = byCategory[cat.id] ?? 0
          if (!count) return null
          return (
            <Link key={cat.id} to="/catalog" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: cat.bg, border: `1.5px solid ${cat.color}30`,
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 24 }}>{cat.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: cat.color, marginTop: 6 }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {count} Datensätze
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 36, padding: '16px 0', borderTop: '1px solid #e2e8f0',
        fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
        Datenquelle:{' '}
        <a href="https://datacube.uba.de" target="_blank" rel="noopener noreferrer"
          style={{ color: '#1e3a5f' }}>
          Umweltbundesamt Datacube
        </a>
        {' · '}SDMX REST API: daten.uba.de
      </div>
    </div>
  )
}
