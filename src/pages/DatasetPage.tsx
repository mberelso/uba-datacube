import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { fetchDataflows, fetchData, type Dataflow, type Dimension } from '../api/sdmx'
import { getCategoryMeta } from '../utils/categories'
import ForestFiresAnalysis from '../components/ForestFiresAnalysis'

const CHART_COLORS = [
  '#1e3a5f', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#be185d', '#65a30d', '#0284c7', '#92400e',
]

type ChartType = 'line' | 'bar'

const InfoTooltip = ({ text }: { text: string }) => (
  <span title={text} style={{ 
    cursor: 'help', color: '#94a3b8', marginLeft: '6px', fontSize: '11px', 
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
    width: '16px', height: '16px', borderRadius: '50%', background: '#f1f5f9', fontWeight: 600 
  }}>
    ?
  </span>
)

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>()

  const [flow, setFlow] = useState<Dataflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showAdvanced, setShowAdvanced] = useState(true)

  const [seriesMap, setSeriesMap] = useState<Record<string, { dimValues: string[]; observations: Record<string, number | null> }>>({})
  const [timeValues, setTimeValues] = useState<string[]>([])
  const [dims, setDims] = useState<Dimension[]>([])
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    fetchDataflows()
      .then((flows) => {
        const f = flows.find((fl) => fl.id === decodeURIComponent(id))
        if (!f) throw new Error('Datensatz nicht gefunden')
        setFlow(f)
        return fetchData(f)
      })
      .then(({ seriesMap, timeValues, seriesDimensions }) => {
        setSeriesMap(seriesMap)
        setTimeValues(timeValues)
        setDims(seriesDimensions)
        
        // Auto-select top 5 series with the highest average values if none selected
        if (selectedSeries.size === 0) {
          const seriesWithAverages = Object.entries(seriesMap).map(([key, s]) => {
            const validValues = Object.values(s.observations).filter((v) => v !== null) as number[]
            if (validValues.length === 0) return { key, avg: -Infinity }
            
            // Calculate average of absolute values to also catch large negative trends
            const sum = validValues.reduce((acc, val) => acc + Math.abs(val), 0)
            return { key, avg: sum / validValues.length }
          })
          
          seriesWithAverages.sort((a, b) => b.avg - a.avg)
          const topKeys = seriesWithAverages.slice(0, 5).map(s => s.key)
          setSelectedSeries(new Set(topKeys))
        }
      })
      .catch((e) => setError(e.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [id])

  const chartData = useMemo(() => {
    if (!timeValues.length) return []
    return timeValues.map((year) => {
      const point: Record<string, any> = { year }
      for (const key of selectedSeries) {
        const s = seriesMap[key]
        if (s) {
          const label = s.dimValues.join(' · ') || key
          point[label] = s.observations[year] ?? null
        }
      }
      return point
    })
  }, [timeValues, selectedSeries, seriesMap])

  const filteredSeries = useMemo(() => {
    return Object.entries(seriesMap).filter(([_, s]) => {
      // Each filter must match the corresponding dimension index
      return Object.entries(filters).every(([dimName, targetVal]) => {
        if (!targetVal) return true
        const dimIdx = dims.findIndex(d => d.name === dimName)
        if (dimIdx === -1) return true
        return s.dimValues[dimIdx] === targetVal
      })
    }).map(([key, s]) => ({
      key,
      label: s.dimValues.join(' · ') || key,
      dimValues: s.dimValues,
    }))
  }, [seriesMap, filters, dims])

  const seriesLabels = filteredSeries // Use filtered list for sidebar

  const meta = flow ? getCategoryMeta(flow.category) : getCategoryMeta('')

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
      <div style={{ fontSize: 40 }}>⏳</div>
      <p style={{ marginTop: 12 }}>Lade Datensatz…</p>
    </div>
  )

  if (error) return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <div style={{ color: '#dc2626', background: '#fef2f2', borderRadius: 8, padding: 16 }}>{error}</div>
      <Link to="/catalog" style={{ color: '#1e3a5f', marginTop: 16, display: 'inline-block' }}>← Zurück zum Katalog</Link>
    </div>
  )

  if (!flow) return null

  const activeSeriesList = seriesLabels.filter((s) => selectedSeries.has(s.key))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link to="/catalog" style={{ color: '#1e3a5f', textDecoration: 'none' }}>Katalog</Link>
        <span>›</span>
        <span style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
        <span>›</span>
        <span style={{ color: '#475569' }}>{flow.name}</span>
      </div>

      {/* Header */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0',
        padding: '20px 24px', marginBottom: 20, borderTop: `4px solid ${meta.color}`,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>{flow.name}</h1>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', marginBottom: 10 }}>
          {flow.agencyID}:{flow.id} · Version {flow.version}
        </div>
        {flow.description && (
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{flow.description}</p>
        )}
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 6, borderLeft: `3px solid ${meta.color}`, fontSize: 13, color: '#475569' }}>
          💡 <strong>Tipp zur Analyse:</strong> Nutze die Filter auf der linken Seite, um die Daten einzugrenzen. Führe die Maus über das <InfoTooltip text="Beispiel-Hilfe: Tooltips zeigen dir Erklärungen an" /> Symbol neben den Filtern, um Erklärungen zu erhalten.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Sidebar */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: 16, height: 'fit-content' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
            Serien ({seriesLabels.length})
          </div>
          {dims.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dims.map((d, i) => {
                // Get unique values for this dimension across ALL series
                const uniqueVals = Array.from(new Set(Object.values(seriesMap).map(s => s.dimValues[i]))).sort()
                if (uniqueVals.length <= 1) return null // Hide dimension if only one value
                return (
                  <div key={d.name}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>
                      {d.name}
                      <InfoTooltip text={d.description || `Wähle Werte für '${d.name}', um die Liste der Serien einzugrenzen.`} />
                    </div>
                    <select
                      value={filters[d.name] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, [d.name]: e.target.value }))}
                      style={{ width: '100%', fontSize: 11, padding: '4px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', color: '#475569' }}
                    >
                      <option value="">Alle</option>
                      {uniqueVals.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button
              onClick={() => setSelectedSeries(prev => {
                const next = new Set(prev)
                seriesLabels.forEach(s => next.add(s.key))
                return next
              })}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#475569' }}
            >
              Alle (Gefiltert)
            </button>
            <button
              onClick={() => setSelectedSeries(prev => {
                const next = new Set(prev)
                seriesLabels.forEach(s => next.delete(s.key))
                return next
              })}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#475569' }}
            >
              Keine
            </button>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
            {seriesLabels.length > 100 ? (
              <div style={{ fontSize: 11, color: '#94a3b8', padding: '10px 0' }}>
                Zu viele Ergebnisse ({seriesLabels.length}). Bitte Filter nutzen.
                <br />(Zeige nur erste 100)
              </div>
            ) : null}
            {seriesLabels.slice(0, 100).map(({ key, label }, i) => {
              const checked = selectedSeries.has(key)
              const color = CHART_COLORS[i % CHART_COLORS.length]
              return (
                <label key={key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 6,
                  background: checked ? `${color}10` : 'transparent',
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedSeries((prev) => {
                        const next = new Set(prev)
                        if (next.has(key)) next.delete(key)
                        else next.add(key)
                        return next
                      })
                    }}
                    style={{ marginTop: 2, accentColor: color }}
                  />
                  <span style={{ fontSize: 12, color: checked ? color : '#64748b', fontWeight: checked ? 500 : 400, lineHeight: 1.4 }}>
                    {label || key}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Chart area */}
        <div>
          <div style={{
            background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0',
            padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Diagrammtyp:</span>
            {(['line', 'bar'] as ChartType[]).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: '1.5px solid',
                  borderColor: chartType === t ? '#1e3a5f' : '#e2e8f0',
                  background: chartType === t ? '#1e3a5f' : '#fff',
                  color: chartType === t ? '#fff' : '#64748b',
                  fontSize: 13, cursor: 'pointer', fontWeight: chartType === t ? 600 : 400,
                }}
              >
                {t === 'line' ? '📈 Linie' : '📊 Balken'}
              </button>
            ))}
            {flow.id === 'DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA' && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: '1.5px solid #16a34a',
                  background: showAdvanced ? '#16a34a' : '#fff',
                  color: showAdvanced ? '#fff' : '#16a34a',
                  fontSize: 13, cursor: 'pointer', fontWeight: showAdvanced ? 600 : 400,
                  marginLeft: 8
                }}
              >
                🔍 Erweiterte Analyse
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
              {timeValues.length} Zeitpunkte · {selectedSeries.size} Serien aktiv
            </span>
          </div>

          {showAdvanced && flow.id === 'DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA' ? (
            <ForestFiresAnalysis timeValues={timeValues} seriesMap={seriesMap} activeSeriesKeys={selectedSeries} />
          ) : (
            <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '16px 8px' }}>
              {selectedSeries.size === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                  <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>Keine Datenreihen ausgewählt</h3>
                  <p style={{ margin: 0, fontSize: 14, maxWidth: 400, lineHeight: 1.5 }}>
                    Bitte setze links Filter oder hake mindestens eine spezifische Serie an, um das Diagramm zu visualisieren.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  {chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        width={65}
                        tickFormatter={(val) => {
                          if (val === 0) return '0'
                          if (Math.abs(val) < 0.01) return val.toExponential(2)
                          return val.toLocaleString('de-DE', { maximumFractionDigits: 2 })
                        }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(v: any) => [
                          Number(v).toLocaleString('de-DE', { maximumFractionDigits: 6 }),
                          '',
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                      {activeSeriesList.map(({ label }, i) => (
                        <Line key={label} type="monotone" dataKey={label}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          dot={false} strokeWidth={2.5} connectNulls />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        width={65}
                        tickFormatter={(val) => {
                          if (val === 0) return '0'
                          if (Math.abs(val) < 0.01) return val.toExponential(2)
                          return val.toLocaleString('de-DE', { maximumFractionDigits: 2 })
                        }}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(v: any) => [
                          Number(v).toLocaleString('de-DE', { maximumFractionDigits: 6 }),
                          '',
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                      {activeSeriesList.map(({ label }, i) => (
                        <Bar key={label} dataKey={label}
                          fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          )}

          {selectedSeries.size > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{
                cursor: 'pointer', fontSize: 13, color: '#475569', fontWeight: 600,
                background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 14px',
              }}>
                📋 Datentabelle
              </summary>
              <div style={{ overflowX: 'auto', background: '#fff', border: '1.5px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Jahr</th>
                      {activeSeriesList.map(({ label }) => (
                        <th key={label} style={{ padding: '8px 12px', textAlign: 'right', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row) => (
                      <tr key={row.year} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 12px', fontWeight: 600, color: '#1e293b' }}>{row.year}</td>
                        {activeSeriesList.map(({ label }) => (
                          <td key={label} style={{ padding: '6px 12px', textAlign: 'right', color: '#475569' }}>
                            {row[label] != null
                              ? Number(row[label]).toLocaleString('de-DE', { maximumFractionDigits: 3 })
                              : '–'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
