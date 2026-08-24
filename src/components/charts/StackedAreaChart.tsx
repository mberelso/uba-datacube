import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { GlassTooltip, formatVal } from './ChartStyles'

export interface StackedSeriesConfig {
  label: string
  color: string
}

interface Props {
  chartData: Record<string, number | string | null>[]
  seriesConfig: StackedSeriesConfig[]
}

export function StackedAreaChart({ chartData, seriesConfig }: Props) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 10 }}
          width={80}
          tickFormatter={(v) => formatVal(Number(v))}
        />
        <Tooltip content={<GlassTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} iconType="circle" />
        {seriesConfig.map(({ label, color }) => (
          <Area
            key={label}
            type="monotone"
            dataKey={label}
            stackId="1"
            stroke={color}
            fill={color}
            fillOpacity={0.85}
            strokeWidth={1}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
