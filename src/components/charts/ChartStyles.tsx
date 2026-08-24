/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties } from 'react'

// --- Glass Tooltip --- 
export const GlassTooltipContainer: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.88)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
  minWidth: 160,
  fontSize: 12,
}

export const GlassTooltipLabel: CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  fontWeight: 600,
  marginBottom: 6,
}

export const GlassTooltipRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 3,
}

export const GlassTooltipValue: CSSProperties = {
  fontSize: 11,
  color: '#f1f5f9',
  fontWeight: 600,
  marginLeft: 4,
}

export const GlassTooltipName: CSSProperties = {
  fontSize: 11,
  color: '#cbd5e1',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 180,
}

// --- Shared formatter ---
export function formatVal(val: number): string {
  if (val === 0) return '0'
  if (Math.abs(val) < 0.01) return val.toExponential(2)
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)} Mio.`
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(2)} Tsd.`
  return val.toLocaleString('de-DE', { maximumFractionDigits: 4 })
}

// --- Shared Chart Colors ---
export const CHART_COLORS_PALETTE = [
  '#1e3a5f', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#be185d', '#65a30d', '#0284c7', '#92400e',
]

// Alias for direct import
export const CHART_COLORS = CHART_COLORS_PALETTE

/**
 * Computes XAxis tick props for dense or sub-annual time series.
 * - Quarterly data ("2022-Q3"): shows only Q1 labels, i.e. one per year
 * - Monthly data ("2002-04"): shows only January labels
 * - Annual data with >20 points: shows every 5th year
 * - Otherwise: show all ticks (interval="preserveStartEnd" default)
 */
export function xAxisTickProps(data: { year: string }[]): {
  interval: number | 'preserveStartEnd' | 'equidistantPreserveStart'
  angle?: number
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  dy?: number
  ticks?: string[]
} {
  if (!data.length) return { interval: 'preserveStartEnd' }
  const sample = data[0].year
  if (/^\d{4}-Q\d$/.test(sample)) {
    // Quarterly: only show Q1 of each year as tick
    const q1ticks = data.map(d => d.year).filter(y => y.endsWith('-Q1'))
    return { ticks: q1ticks, interval: 0, angle: -30, textAnchor: 'end', dy: 4 }
  }
  if (/^\d{4}-\d{2}$/.test(sample)) {
    // Monthly: only show January of each year
    const janTicks = data.map(d => d.year).filter(y => y.endsWith('-01'))
    return { ticks: janTicks, interval: 0, angle: -30, textAnchor: 'end', dy: 4 }
  }
  if (data.length > 20) {
    // Annual but many: show every 5th
    const every5 = data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map(d => d.year)
    return { ticks: every5, interval: 0 }
  }
  return { interval: 'preserveStartEnd' }
}

export interface GlassTooltipPayloadEntry {
  color?: string
  name?: string
  value?: number | string
}

export interface GlassTooltipProps {
  active?: boolean
  payload?: GlassTooltipPayloadEntry[]
  label?: string
}

// --- Glassmorphism Tooltip component (reusable) ---
export function GlassTooltip({ active, payload, label }: GlassTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={GlassTooltipContainer}>
      <div style={GlassTooltipLabel}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={GlassTooltipRow}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={GlassTooltipName}>{entry.name}</span>
          <span style={GlassTooltipValue}>{formatVal(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  )
}
