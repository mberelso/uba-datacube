export function CubeMark({ size = 32, color = '#fff', accent = '#4A6741' }: {
  size?: number
  color?: string
  accent?: string
}) {
  const s = size
  const h = s * 0.577
  return (
    <svg width={s * 2} height={h * 2 + s} viewBox={`0 0 ${s * 2} ${h * 2 + s}`} fill="none">
      <polygon
        points={`${s},0 ${s * 2},${h} ${s},${h * 2} 0,${h}`}
        fill={color} fillOpacity="0.12"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <polygon
        points={`0,${h} ${s},${h * 2} ${s},${h * 2 + s} 0,${h + s}`}
        fill={color} fillOpacity="0.22"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <polygon
        points={`${s * 2},${h} ${s},${h * 2} ${s},${h * 2 + s} ${s * 2},${h + s}`}
        fill={color} fillOpacity="0.08"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <circle cx={s} cy={h * 1.4 + s * 0.05} r={size * 0.09} fill={accent} />
    </svg>
  )
}
