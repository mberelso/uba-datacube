import { CubeMark } from '../CubeMark'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types'
import type { SocialCardData, ChartPoint } from './types'

const W = 1080
const H = 1920

function HighContrastChart({
  points,
  width,
  height,
  color,
  unit,
}: {
  points: ChartPoint[]
  width: number
  height: number
  color: string
  unit?: string
}) {
  if (!points || points.length < 2) return null

  const values = points.map((p) => p.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const padX = 40
  const padY = 54
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * chartW
    const y = padY + (1 - (p.value - minVal) / range) * chartH
    return { x, y, year: p.year, value: p.value }
  })

  const pathD = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padY / 2} L ${coords[0].x} ${height - padY / 2} Z`

  const firstPt = coords[0]
  const lastPt = coords[coords.length - 1]
  const peakPt = coords.reduce((max, pt) => (pt.value > max.value ? pt : max), coords[0])

  const formatV = (v: number) =>
    v >= 1000 ? Math.round(v).toLocaleString('de-DE') : v.toLocaleString('de-DE', { maximumFractionDigits: 1 })

  const unitSuffix = unit ? ` ${unit}` : ''

  return (
    <div style={{ position: 'relative', width, height, marginTop: 32, marginBottom: 16 }}>
      {/* High Contrast Background Container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0e1826',
          border: '2px solid rgba(255, 255, 255, 0.22)',
          borderRadius: 26,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      />

      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="contrastAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.65" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* High Contrast Grid Lines */}
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="rgba(255,255,255,0.18)" strokeDasharray="6 6" strokeWidth="2" />
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="rgba(255,255,255,0.18)" strokeDasharray="6 6" strokeWidth="2" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(255,255,255,0.18)" strokeDasharray="6 6" strokeWidth="2" />

        {/* Gradient Fill */}
        <path d={areaD} fill="url(#contrastAreaGrad)" />

        {/* Thick Vibrant Stroke Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />

        {/* Inner White Highlight Core Line */}
        <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

        {/* Start Point Dot */}
        <circle cx={firstPt.x} cy={firstPt.y} r="9" fill={color} stroke="#ffffff" strokeWidth="4" />

        {/* Peak Point Dot (if distinct) */}
        {peakPt !== firstPt && peakPt !== lastPt && (
          <circle cx={peakPt.x} cy={peakPt.y} r="9" fill="#f59e0b" stroke="#ffffff" strokeWidth="4" />
        )}

        {/* Last Point Glowing Outer Ring & Core Dot */}
        <circle cx={lastPt.x} cy={lastPt.y} r="22" fill={color} opacity="0.45" />
        <circle cx={lastPt.x} cy={lastPt.y} r="12" fill="#ffffff" stroke={color} strokeWidth="6" />
      </svg>

      {/* Start Value Callout Badge */}
      <div
        style={{
          position: 'absolute',
          left: Math.min(firstPt.x, width - 260),
          top: Math.max(16, firstPt.y - 54),
          background: '#1e293b',
          border: '2px solid rgba(255, 255, 255, 0.40)',
          borderRadius: 12,
          padding: '6px 16px',
          fontSize: 24,
          fontWeight: 700,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
        }}
      >
        {firstPt.year}: {formatV(firstPt.value)}{unitSuffix}
      </div>

      {/* End Value Callout Badge (Highlighted) */}
      <div
        style={{
          position: 'absolute',
          right: Math.max(16, width - lastPt.x - 40),
          top: Math.max(16, lastPt.y - 58),
          background: color,
          border: '2px solid #ffffff',
          borderRadius: 14,
          padding: '8px 20px',
          fontSize: 26,
          fontWeight: 900,
          color: '#ffffff',
          boxShadow: `0 8px 26px ${color}aa, 0 4px 12px rgba(0,0,0,0.6)`,
          whiteSpace: 'nowrap',
        }}
      >
        {lastPt.year}: {formatV(lastPt.value)}{unitSuffix}
      </div>

      {/* Peak Callout Badge (if applicable) */}
      {peakPt !== firstPt && peakPt !== lastPt && (
        <div
          style={{
            position: 'absolute',
            left: Math.max(padX, Math.min(peakPt.x - 70, width - 240)),
            top: Math.max(16, peakPt.y - 52),
            background: '#d97706',
            border: '1.5px solid #ffffff',
            borderRadius: 10,
            padding: '5px 12px',
            fontSize: 22,
            fontWeight: 800,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          Höchststand ({peakPt.year}): {formatV(peakPt.value)}
        </div>
      )}

      {/* X-Axis Year Labels (Pure Bright White Text) */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: padX,
          right: padX,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 26,
          color: '#f8fafc',
          fontWeight: 700,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        <span>{points[0].year}</span>
        {points.length > 4 && <span>{points[Math.floor(points.length / 2)].year}</span>}
        <span>{points[points.length - 1].year}</span>
      </div>
    </div>
  )
}

export function SocialCardStory({ data }: { data: SocialCardData }) {
  const label = CATEGORY_LABELS[data.category]
  const accent = CATEGORY_COLORS[data.category]

  const chartPoints: ChartPoint[] =
    data.chartPoints && data.chartPoints.length >= 2
      ? data.chartPoints
      : (() => {
          const [startY, endY] = data.yearRange.split('–').map((s) => parseInt(s.trim()))
          const count = data.sparkline.length
          if (count < 2 || isNaN(startY) || isNaN(endY)) return []
          return data.sparkline.map((v, i) => ({
            year: `${Math.round(startY + (i / (count - 1)) * (endY - startY))}`,
            value: v,
          }))
        })()

  const metricLen = data.metric.length
  const metricFontSize = metricLen <= 5 ? 154 : metricLen <= 8 ? 118 : metricLen <= 14 ? 86 : 68
  const metricLetterSpacing = metricLen <= 5 ? '-6px' : metricLen <= 8 ? '-3px' : '-1.5px'

  const headlineLen = data.headline.length
  const headlineFontSize = headlineLen > 65 ? 46 : headlineLen > 35 ? 56 : 68

  const storyLen = data.story.length
  const storyFontSize = storyLen > 180 ? 28 : storyLen > 100 ? 32 : 36

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Geist', system-ui, -apple-system, sans-serif",
        background: '#060b12',
        flexShrink: 0,
      }}
    >
      {/* Background Image */}
      {data.backgroundUrl && (
        <img
          src={data.backgroundUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.35,
          }}
        />
      )}

      {/* High Contrast Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'linear-gradient(to bottom,',
            'rgba(6,11,18,0.35) 0%,',
            'rgba(6,11,18,0.70) 30%,',
            'rgba(6,11,18,0.96) 65%,',
            '#060b12 88%)',
          ].join(' '),
        }}
      />

      {/* Main Content Grid */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 80px 88px',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <CubeMark size={30} color="#ffffff" accent={accent} />
          <span
            style={{
              color: '#ffffff',
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: '-0.8px',
            }}
          >
            Umweltpuls
          </span>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {data.seriesName && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  color: '#ffffff',
                  fontSize: 22,
                  fontWeight: 700,
                  padding: '7px 20px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {data.seriesName}
              </div>
            )}
            <div
              style={{
                background: accent,
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: '2.5px',
                padding: '8px 24px',
                borderRadius: 10,
                boxShadow: `0 4px 16px ${accent}88`,
              }}
            >
              {label}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Metric Highlight Box */}
        <div>
          <div
            style={{
              fontSize: metricFontSize,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1,
              letterSpacing: metricLetterSpacing,
              textShadow: `0 4px 28px ${accent}bb, 0 2px 8px rgba(0,0,0,0.9)`,
            }}
          >
            {data.metric}
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#e2e8f0',
              fontWeight: 600,
              marginTop: 18,
              letterSpacing: '-0.2px',
              textShadow: '0 2px 6px rgba(0,0,0,0.8)',
            }}
          >
            {data.metricLabel}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: headlineFontSize,
            fontWeight: 900,
            color: '#ffffff',
            marginTop: 38,
            lineHeight: 1.12,
            letterSpacing: '-1.5px',
            textShadow: '0 2px 10px rgba(0,0,0,0.9)',
          }}
        >
          {data.headline}
        </div>

        {/* Main High-Contrast Centerpiece Chart */}
        {chartPoints.length >= 2 && (
          <HighContrastChart
            points={chartPoints}
            width={W - 160}
            height={380}
            color={accent}
            unit={data.unit}
          />
        )}

        {/* High Contrast Editorial Story Box */}
        <div
          style={{
            fontSize: storyFontSize,
            color: '#f8fafc',
            marginTop: 24,
            lineHeight: 1.5,
            fontWeight: 500,
            background: '#0d1827',
            borderLeft: `6px solid ${accent}`,
            border: '1.5px solid rgba(255, 255, 255, 0.20)',
            padding: '20px 28px',
            borderRadius: '0 16px 16px 0',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          }}
        >
          {data.story}
        </div>

        {/* Verified Data Footer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 32,
            borderTop: '2px solid rgba(255,255,255,0.20)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 5, height: 34, background: accent, borderRadius: 3 }} />
              <span style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>
                Quelle: Umweltbundesamt (UBA)
              </span>
            </div>
            <span style={{ fontSize: 30, fontWeight: 900, color: accent, letterSpacing: '-0.5px' }}>
              Umweltpuls.de →
            </span>
          </div>
          <span style={{ fontSize: 22, color: '#cbd5e1', fontWeight: 500, letterSpacing: '0.1px' }}>
            Interaktiver Datensatz: Umweltpuls.de/dataset/{data.datasetId}
          </span>
        </div>
      </div>
    </div>
  )
}
