import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { CHART_COLORS, GlassTooltip } from './ChartStyles'

interface ClimateChartProps {
  chartData: any[]
  activeSeriesList: { label: string }[]
}

export function ClimateChart({ chartData, activeSeriesList }: ClimateChartProps) {
  // Determine if data contains negative values (e.g. sinks) – show reference line
  const hasNegative = chartData.some(row =>
    activeSeriesList.some(s => row[s.label] != null && row[s.label] < 0)
  )

  return (
    <div>
      {/* Inspired by Our World in Data – badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 11, color: '#64748b',
      }}>
        <span style={{
          background: '#dc2626', color: '#fff', borderRadius: 4,
          padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        }}>KLIMA</span>
        <span>Gestapelte Flächen · Zeitreihe · inspiriert von</span>
        <a href="https://ourworldindata.org/co2-emissions" target="_blank" rel="noreferrer"
          style={{ color: '#1e3a5f', fontWeight: 600, textDecoration: 'none' }}>
          Our World in Data ↗
        </a>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {activeSeriesList.map(({ label }, i) => (
              <linearGradient key={label} id={`climateGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            width={70}
            tickFormatter={(val) => {
              if (val === 0) return '0'
              if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} Mio.`
              if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)} Tsd.`
              return val.toLocaleString('de-DE', { maximumFractionDigits: 2 })
            }}
          />
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="circle" />
          {hasNegative && (
            <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="6 3"
              label={{ value: 'Netto-Null', position: 'insideTopRight', fill: '#dc2626', fontSize: 11 }} />
          )}
          {activeSeriesList.map(({ label }, i) => (
            <Area
              key={label}
              type="monotone"
              dataKey={label}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              fill={`url(#climateGrad${i})`}
              connectNulls
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
