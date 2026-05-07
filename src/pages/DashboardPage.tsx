import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fetchData, fetchDataflows, type Dataflow } from '../api/sdmx'
import { CATEGORIES } from '../utils/categories'
import heroBg from '../assets/hero_background.png'

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
        position: 'relative',
        borderRadius: 16,
        padding: '48px 56px',
        color: '#fff',
        marginBottom: 32,
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Background Image with Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(30, 58, 95, 0.5) 50%, rgba(15, 76, 129, 0.1) 100%)',
        }} />
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            Dein Kompass für die Umwelt in Deutschland
          </h1>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#93c5fd', margin: '0 0 20px' }}>
            Offizielle Daten. Klar verständlich. Auf den Punkt gebracht.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: '0 0 28px',
            maxWidth: 680, lineHeight: 1.6 }}>
            Wie steht es um die Luftqualität in unseren Städten? Wie entwickeln sich die Treibhausgas-Emissionen, und welche Auswirkungen hat extreme Trockenheit auf unsere Wälder? 
            <br /><br />
            Der UBA-Datacube ist der zentrale Ort für fundierte Antworten. Wir bündeln offizielle Umwelt-Indikatoren und machen sie für jeden greifbar – von der interessierten Öffentlichkeit bis hin zu politischen Entscheidungsträgern.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/catalog" style={{
              display: 'inline-block', background: '#fff', color: '#1e3a5f',
              padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}>
              Datenkatalog öffnen ({loadingFlows ? '…' : flows.length} Themen) →
            </Link>
            <Link to="/analysen" style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff',
              padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)',
            }}>
              Analysen entdecken →
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
           <div style={{ fontSize: 28, marginBottom: 12 }}>📖</div>
           <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#1e293b' }}>Die Geschichte hinter den Zahlen</h3>
           <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>Wir lassen dich mit nackten Daten nicht allein. Jeder Datensatz startet mit den wichtigsten Erkenntnissen auf einen Blick ("Story First").</p>
        </div>
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
           <div style={{ fontSize: 28, marginBottom: 12 }}>💡</div>
           <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#1e293b' }}>Integrierter Daten-Dolmetscher</h3>
           <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>Komplexe Einheiten und Grenzwerte übersetzen wir direkt in den interaktiven Diagrammen durch intuitive Tooltips in verständliche Fakten.</p>
        </div>
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
           <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
           <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#1e293b' }}>Maßgeschneiderte Analysen</h3>
           <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>Vergleiche Jahre, filtere nach Ursachen, erkenne Trends selbstständig und lade die aktuellen Diagrammansichten und Daten direkt herunter.</p>
        </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {CATEGORIES.map((cat) => {
          const count = byCategory[cat.id] ?? 0
          return (
            <Link key={cat.id} to="/catalog" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  height: 150,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => { 
                  const bg = e.currentTarget.querySelector('.cat-bg') as HTMLElement;
                  if(bg) bg.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => { 
                  const bg = e.currentTarget.querySelector('.cat-bg') as HTMLElement;
                  if(bg) bg.style.transform = 'scale(1)';
                }}
              >
                {/* Background Image */}
                <div 
                  className="cat-bg"
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: cat.image ? `url("${cat.image}")` : 'none',
                    backgroundColor: cat.bg,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    transition: 'transform 0.4s ease-out',
                  }}
                />
                {/* Dark Gradient Overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.3) 60%, rgba(15, 23, 42, 0.1) 100%)`,
                }} />
                
                {/* Content */}
                <div style={{
                  position: 'absolute', inset: 0, padding: '16px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                }}>
                  <div style={{ fontSize: 24, position: 'absolute', top: 12, right: 16, opacity: 0.9 }}>
                    {cat.icon}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                    {count} Datensätze
                  </div>
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
