import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS, GlassTooltip } from './ChartStyles'

interface EconomyChartProps {
  chartData: any[]
  activeSeriesList: { label: string }[]
}

export function EconomyChart({ chartData, activeSeriesList }: EconomyChartProps) {
  // Split series into two groups: first half → left Y-axis (bars), second half → right Y-axis (lines)
  // This creates a "decoupling chart" effect (e.g. Wirtschaft vs. Ressourcenverbrauch)
  const splitIdx = Math.ceil(activeSeriesList.length / 2)
  const leftSeries = activeSeriesList.slice(0, splitIdx)
  const rightSeries = activeSeriesList.slice(splitIdx)

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 11, color: '#64748b',
      }}>
        <span style={{
          background: '#475569', color: '#fff', borderRadius: 4,
          padding: '2px 7px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        }}>UMWELT & WIRTSCHAFT</span>
        <span>Dual-Achsen Chart · Entkopplungsanalyse</span>
      </div>
      {rightSeries.length > 0 && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 8, fontSize: 11, color: '#64748b',
          background: '#f8fafc', borderRadius: 6, padding: '6px 12px',
        }}>
          <span>
            <strong style={{ color: CHART_COLORS[0] }}>Balken (links)</strong>:&nbsp;
            {leftSeries.map(s => s.label).join(', ')}
          </span>
          <span>·</span>
          <span>
            <strong style={{ color: CHART_COLORS[splitIdx % CHART_COLORS.length] }}>Linie (rechts)</strong>:&nbsp;
            {rightSeries.map(s => s.label).join(', ')}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          {/* Left Y-axis for Bars */}
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10 }}
            width={70}
            tickFormatter={(val) => {
              if (val === 0) return '0'
              if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
              if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}T`
              return val.toLocaleString('de-DE', { maximumFractionDigits: 1 })
            }}
          />
          {/* Right Y-axis for Lines (only if we have split series) */}
          {rightSeries.length > 0 && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10 }}
              width={70}
              tickFormatter={(val) => {
                if (val === 0) return '0'
                if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
                if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}T`
                return val.toLocaleString('de-DE', { maximumFractionDigits: 1 })
              }}
            />
          )}
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="circle" />
          {leftSeries.map(({ label }, i) => (
            <Bar
              key={label}
              dataKey={label}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.7}
              radius={[3, 3, 0, 0]}
              yAxisId="left"
            />
          ))}
          {rightSeries.map(({ label }, i) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={CHART_COLORS[(splitIdx + i) % CHART_COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls
              yAxisId={rightSeries.length > 0 ? 'right' : 'left'}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
