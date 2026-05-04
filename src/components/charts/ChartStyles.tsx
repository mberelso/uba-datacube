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

// --- Glassmorphism Tooltip component (reusable) ---
export function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={GlassTooltipContainer}>
      <div style={GlassTooltipLabel}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={GlassTooltipRow}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={GlassTooltipName}>{entry.name}</span>
          <span style={GlassTooltipValue}>{formatVal(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  )
}
