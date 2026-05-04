import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { GlassTooltip, CHART_COLORS_PALETTE, formatVal } from './ChartStyles'

export const CHART_COLORS = CHART_COLORS_PALETTE

export interface ChartProps {
  chartData: any[]
  activeSeriesList: { label: string }[]
  chartType: 'line' | 'bar'
}

export function FallbackChart({ chartData, activeSeriesList, chartType }: ChartProps) {
  const tickFmt = (val: number) => formatVal(val)

  return (
    <ResponsiveContainer width="100%" height={380}>
      {chartType === 'line' ? (
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} width={70} tickFormatter={tickFmt} />
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
          {activeSeriesList.map(({ label }, i) => (
            <Line key={label} type="monotone" dataKey={label}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              dot={chartData.length === 1 ? { r: 4 } : false} 
              strokeWidth={2.5} connectNulls />
          ))}
        </LineChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} width={70} tickFormatter={tickFmt} />
          <Tooltip content={<GlassTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
          {activeSeriesList.map(({ label }, i) => (
            <Bar key={label} dataKey={label}
              fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

