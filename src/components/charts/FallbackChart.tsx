import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { GlassTooltip, CHART_COLORS_PALETTE, formatVal, xAxisTickProps } from './ChartStyles'

export const CHART_COLORS = CHART_COLORS_PALETTE

export interface ChartProps {
  chartData: any[]
  activeSeriesList: { label: string; color?: string }[]
  chartType: 'line' | 'bar'
  exportMode?: boolean
}

export function FallbackChart({ chartData, activeSeriesList, chartType }: ChartProps) {
  const tickFmt = (val: number) => formatVal(val)
  const { interval, angle, textAnchor, dy, ticks } = xAxisTickProps(chartData)
  const bottomMargin = angle ? 20 : 5

  return (
    <ResponsiveContainer width="100%" height={380}>
      {chartType === 'line' ? (
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: bottomMargin }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, ...(angle ? { angle, textAnchor, dy } : {}) }}
            ticks={ticks} interval={ticks ? 0 : interval} />
          <YAxis tick={{ fontSize: 10 }} width={70} tickFormatter={tickFmt} />
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
          {activeSeriesList.map(({ label, color }, i) => (
            <Line key={label} type="monotone" dataKey={label}
              stroke={color ?? CHART_COLORS[i % CHART_COLORS.length]}
              dot={chartData.length === 1 ? { r: 4 } : false}
              strokeWidth={2.5} connectNulls />
          ))}
        </LineChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: bottomMargin }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, ...(angle ? { angle, textAnchor, dy } : {}) }}
            ticks={ticks} interval={ticks ? 0 : interval} />
          <YAxis tick={{ fontSize: 10 }} width={70} tickFormatter={tickFmt} />
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
          {activeSeriesList.map(({ label, color }, i) => (
            <Bar key={label} dataKey={label}
              fill={color ?? CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

