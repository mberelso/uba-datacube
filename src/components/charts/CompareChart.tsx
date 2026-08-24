import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface CompareSeries {
  label: string
  unit: string
  data: Array<{ year: string; value: number }>
}

interface CompareChartProps {
  seriesA: CompareSeries
  seriesB: CompareSeries
  mode: 'absolute' | 'index'
}

function calculateCorrelation(data: Array<{ valA: number; valB: number }>): number | null {
  if (data.length < 2) return null
  const n = data.length
  const sumA = data.reduce((acc, d) => acc + d.valA, 0)
  const sumB = data.reduce((acc, d) => acc + d.valB, 0)
  const meanA = sumA / n
  const meanB = sumB / n

  let num = 0
  let denA = 0
  let denB = 0

  for (const d of data) {
    const diffA = d.valA - meanA
    const diffB = d.valB - meanB
    num += diffA * diffB
    denA += diffA * diffA
    denB += diffB * diffB
  }

  if (denA === 0 || denB === 0) return null
  return num / Math.sqrt(denA * denB)
}

export function CompareChart({ seriesA, seriesB, mode }: CompareChartProps) {
  const { chartData, validPairs, correlation } = useMemo(() => {
    const mapA = new Map(seriesA.data.map((d) => [d.year, d.value]))
    const mapB = new Map(seriesB.data.map((d) => [d.year, d.value]))

    const allYears = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort()

    // Base values for index mode (first year where both values exist or first valid year)
    const firstA = seriesA.data[0]?.value ?? 1
    const firstB = seriesB.data[0]?.value ?? 1

    const pairs: Array<{ valA: number; valB: number }> = []

    const cData = allYears.map((year) => {
      const rawA = mapA.get(year) ?? null
      const rawB = mapB.get(year) ?? null

      if (rawA !== null && rawB !== null) {
        pairs.push({ valA: rawA, valB: rawB })
      }

      const valA = mode === 'index' && rawA !== null && firstA !== 0 ? (rawA / firstA) * 100 : rawA
      const valB = mode === 'index' && rawB !== null && firstB !== 0 ? (rawB / firstB) * 100 : rawB

      return {
        year,
        valA: valA !== null ? Number(valA.toFixed(2)) : null,
        valB: valB !== null ? Number(valB.toFixed(2)) : null,
        rawA,
        rawB,
      }
    })

    const corr = calculateCorrelation(pairs)

    return { chartData: cData, validPairs: pairs, correlation: corr }
  }, [seriesA, seriesB, mode])

  const handleExportCsv = () => {
    const headers = ['Jahr', `"${seriesA.label} (${seriesA.unit})"`, `"${seriesB.label} (${seriesB.unit})"`]
    const rows = chartData.map((d) => [d.year, d.rawA ?? '', d.rawB ?? ''])
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vergleich_${seriesA.label}_vs_${seriesB.label}.csv`.replace(/[^a-zA-Z0-9_-]/g, '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCorrelationText = (r: number | null) => {
    if (r === null) return 'Unzureichende gemeinsame Datenpunkte für eine Korrelationsanalyse.'
    const abs = Math.abs(r)
    const dir = r >= 0 ? 'positiver' : 'negativer'
    let strength = 'schwacher'
    if (abs >= 0.7) strength = 'starker'
    else if (abs >= 0.4) strength = 'moderater'

    return `Es besteht ein ${strength} ${dir} Zusammenhang (Pearson r = ${r.toFixed(2)}) zwischen beiden Indikatoren.`
  }

  return (
    <div className="space-y-6">
      {/* Visualisierungs-Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {mode === 'index' ? 'Relativer Trend-Vergleich (Basis = 100 %)' : 'Absoluter Gegenüberstellungs-Vergleich'}
          </h3>
          <p className="text-xs text-slate-500">
            {chartData.length} Jahre ({chartData[0]?.year} – {chartData[chartData.length - 1]?.year})
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          title="Vergleichstabelle als CSV herunterladen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV Export
        </button>
      </div>

      {/* Chart */}
      <div className="h-[420px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: mode === 'absolute' ? 30 : 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} />

            {mode === 'absolute' ? (
              <>
                <YAxis
                  yAxisId="left"
                  stroke="#0284c7"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: seriesA.unit, angle: -90, position: 'insideLeft', style: { fill: '#0284c7', fontSize: 11 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#dc2626"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: seriesB.unit, angle: 90, position: 'insideRight', style: { fill: '#dc2626', fontSize: 11 } }}
                />
              </>
            ) : (
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Index (Start = 100 %)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 11 } }}
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                padding: '12px',
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any, name: any, item: any) => {
                const isA = name === seriesA.label
                const raw = isA ? item.payload.rawA : item.payload.rawB
                if (val == null) return ['Keine Daten', name]
                if (mode === 'index') {
                  return [`${Number(val).toLocaleString('de-DE')} % (Absolut: ${raw != null ? Number(raw).toLocaleString('de-DE') : '-'} ${isA ? seriesA.unit : seriesB.unit})`, name]
                }
                return [`${Number(val).toLocaleString('de-DE')} ${isA ? seriesA.unit : seriesB.unit}`, name]
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px' }} />

            <Line
              yAxisId={mode === 'absolute' ? 'left' : undefined}
              type="monotone"
              dataKey="valA"
              name={seriesA.label}
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ r: 3, fill: '#0284c7' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            <Line
              yAxisId={mode === 'absolute' ? 'right' : undefined}
              type="monotone"
              dataKey="valB"
              name={seriesB.label}
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ r: 3, fill: '#dc2626' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Statistische Korrelation Insights Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-sky-100 text-sky-700 rounded-lg shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Statistische Korrelation ({validPairs.length} Datenpaare)
          </h4>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {getCorrelationText(correlation)}
          </p>
        </div>
      </div>
    </div>
  )
}
