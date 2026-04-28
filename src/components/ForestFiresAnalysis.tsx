import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'

export interface ForestFiresAnalysisProps {
  timeValues: string[]
  seriesMap: Record<string, { dimValues: string[]; observations: Record<string, number | null> }>
  activeSeriesKeys: Set<string>
}

const COLORS = ['#dc2626', '#d97706', '#16a34a', '#0891b2', '#7c3aed', '#be185d']

export default function ForestFiresAnalysis({ timeValues, seriesMap, activeSeriesKeys }: ForestFiresAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'frequency' | 'intensity'>('frequency')

  const { chartData, causes, intensityData } = useMemo(() => {
    // Determine keys to use (either selected or all if none selected, but DatasetPage usually auto-selects)
    const keys = activeSeriesKeys.size > 0 ? Array.from(activeSeriesKeys) : Object.keys(seriesMap)

    const causeSet = new Set<string>()

    const dataByYear: Record<string, Record<string, any>> = {}
    timeValues.forEach(year => {
      dataByYear[year] = { year, insgesamtAnzahl: 0, insgesamtHektar: 0 }
    })

    keys.forEach(key => {
      const s = seriesMap[key]
      if (!s) return
      // dimValues [Country, Freq, Unit, Cause, Indicator]
      // Fallback indices if dimensions change, but usually Cause is [3] and Unit is [2]
      // We look for 'Insgesamt' in the string to be safe, or just use dimValues[3]
      const cause = s.dimValues.find(v => v.includes('Ursache') || v.includes('Vorsatz') || v.includes('Fahrlässigkeit') || v.includes('Insgesamt')) || s.dimValues[3]
      const isTotal = cause === 'Insgesamt'
      const isHektar = s.dimValues.some(v => v.toLowerCase().includes('hektar') || v.toLowerCase().includes('fläche'))
      const isAnzahl = !isHektar && s.dimValues.some(v => v.toLowerCase().includes('anzahl'))

      if (isAnzahl && !isTotal) causeSet.add(cause)

      for (const [year, val] of Object.entries(s.observations)) {
        if (val === null) continue
        if (dataByYear[year]) {
          if (isAnzahl && !isTotal) {
            dataByYear[year][cause] = val
          }
          if (isAnzahl && isTotal) {
            dataByYear[year].insgesamtAnzahl = val
          }
          if (isHektar && isTotal) {
            dataByYear[year].insgesamtHektar = val
          }
        }
      }
    })

    const finalChartData = timeValues.map(year => dataByYear[year])

    // For Intensity: calculate Hectares / Count
    const intensity = finalChartData.map(d => {
      const count = d.insgesamtAnzahl
      const area = d.insgesamtHektar
      return {
        year: d.year,
        hektarProBrand: count > 0 ? area / count : 0,
        area,
        count
      }
    })

    return { 
      chartData: finalChartData, 
      causes: Array.from(causeSet),
      intensityData: intensity
    }
  }, [timeValues, seriesMap, activeSeriesKeys])

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('frequency')}
          style={{
            padding: '8px 16px', borderRadius: 6, border: 'none',
            background: activeTab === 'frequency' ? '#1e3a5f' : 'transparent',
            color: activeTab === 'frequency' ? '#fff' : '#64748b',
            fontWeight: activeTab === 'frequency' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          🔥 Ursachen & Fläche
        </button>
        <button
          onClick={() => setActiveTab('intensity')}
          style={{
            padding: '8px 16px', borderRadius: 6, border: 'none',
            background: activeTab === 'intensity' ? '#1e3a5f' : 'transparent',
            color: activeTab === 'intensity' ? '#fff' : '#64748b',
            fontWeight: activeTab === 'intensity' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          📈 Brandintensität (Hektar pro Brand)
        </button>
      </div>

      <div style={{ minHeight: 400 }}>
        {activeTab === 'frequency' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: 14 }}>Anzahl der Brände nach Ursache</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} syncId="fireSync">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} width={65} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                  {causes.map((c, i) => (
                    <Bar key={c} dataKey={c} stackId="a" fill={COLORS[i % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: 14 }}>Gesamte Brandfläche (Hektar)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} syncId="fireSync">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} width={65} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                  <Area type="monotone" dataKey="insgesamtHektar" name="Insgesamt (Hektar)" stroke="#b91c1c" fill="#fca5a5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, borderLeft: '4px solid #16a34a', color: '#166534', fontSize: 13, lineHeight: 1.5 }}>
              💡 <strong>Guided Analytics:</strong> Diese abgeleitete Metrik zeigt die durchschnittliche Fläche eines einzelnen Brandes. 
              Selbst in Jahren mit wenigen Bränden kann ein hoher "Hektar pro Brand"-Wert auf extreme Trockenheit oder späte Brandentdeckung hinweisen. 
              Dieser Indikator ist entscheidend für die Bewertung der Waldbrand-Schwere.
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={intensityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} width={65} tickFormatter={val => val.toFixed(1)} />
                <Tooltip 
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(val: any, name: any) => {
                    if (name === 'hektarProBrand') return [Number(val).toFixed(2) + ' ha/Brand', 'Brandintensität']
                    return [val, name]
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
                <Line type="monotone" dataKey="hektarProBrand" name="Durchschn. Hektar pro Brand" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
