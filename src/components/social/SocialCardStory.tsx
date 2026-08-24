import { CubeMark } from '../CubeMark'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types'
import type { SocialCardData, ChartPoint } from './types'

const W = 1080
const H = 1920

function RichInfographicChart({
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

  const padX = 36
  const padY = 48
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
    <div style={{ position: 'relative', width, height, marginTop: 28, marginBottom: 12 }}>
      {/* Visual Container Card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.035)',
          border: '1.5px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 28,
        }}
      />

      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="richAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.48" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="rgba(255,255,255,0.07)" strokeDasharray="6 6" strokeWidth="2" />
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="rgba(255,255,255,0.07)" strokeDasharray="6 6" strokeWidth="2" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(255,255,255,0.07)" strokeDasharray="6 6" strokeWidth="2" />

        {/* Area & Path */}
        <path d={areaD} fill="url(#richAreaGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

        {/* First Point Dot */}
        <circle cx={firstPt.x} cy={firstPt.y} r="8" fill={color} stroke="#fff" strokeWidth="4" />

        {/* Peak Point Dot (if distinct) */}
        {peakPt !== firstPt && peakPt !== lastPt && (
          <circle cx={peakPt.x} cy={peakPt.y} r="8" fill="#f59e0b" stroke="#fff" strokeWidth="3" />
        )}

        {/* Last Point Glowing Outer Ring & Dot */}
        <circle cx={lastPt.x} cy={lastPt.y} r="18" fill={color} opacity="0.35" />
        <circle cx={lastPt.x} cy={lastPt.y} r="10" fill="#fff" stroke={color} strokeWidth="5" />
      </svg>

      {/* Start Value Callout Badge */}
      <div
        style={{
          position: 'absolute',
          left: Math.min(firstPt.x, width - 240),
          top: Math.max(16, firstPt.y - 48),
          background: 'rgba(15, 23, 42, 0.90)',
          border: '1px solid rgba(255, 255, 255, 0.20)',
          borderRadius: 10,
          padding: '6px 14px',
          fontSize: 22,
          fontWeight: 600,
          color: '#cbd5e1',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        {firstPt.year}: {formatV(firstPt.value)}{unitSuffix}
      </div>

      {/* End Value Callout Badge (Highlighted) */}
      <div
        style={{
          position: 'absolute',
          right: Math.max(16, width - lastPt.x - 40),
          top: Math.max(16, lastPt.y - 52),
          background: color,
          borderRadius: 12,
          padding: '8px 18px',
          fontSize: 24,
          fontWeight: 800,
          color: '#fff',
          boxShadow: `0 6px 20px ${color}88`,
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
            left: Math.max(padX, Math.min(peakPt.x - 60, width - 220)),
            top: Math.max(16, peakPt.y - 46),
            background: '#d97706',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(217,119,6,0.5)',
          }}
        >
          Höchststand ({peakPt.year}): {formatV(peakPt.value)}
        </div>
      )}

      {/* X-Axis Year Labels */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: padX,
          right: padX,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          color: 'rgba(255, 255, 255, 0.50)',
          fontWeight: 600,
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

  // Fallback: Wenn keine echten chartPoints übergeben wurden, sparkline umwandeln
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
  const metricFontSize = metricLen <= 5 ? 150 : metricLen <= 8 ? 115 : metricLen <= 14 ? 85 : 68
  const metricLetterSpacing = metricLen <= 5 ? '-6px' : metricLen <= 8 ? '-3px' : '-1.5px'

  const headlineLen = data.headline.length
  const headlineFontSize = headlineLen > 65 ? 44 : headlineLen > 35 ? 54 : 66

  const storyLen = data.story.length
  const storyFontSize = storyLen > 180 ? 26 : storyLen > 100 ? 30 : 34

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Geist', system-ui, -apple-system, sans-serif",
        background: '#0a1622',
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
            opacity: 0.32,
          }}
        />
      )}

      {/* Premium Dark Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'linear-gradient(to bottom,',
            'rgba(10,22,34,0.30) 0%,',
            'rgba(10,22,34,0.65) 30%,',
            'rgba(10,22,34,0.94) 65%,',
            '#0a1622 88%)',
          ].join(' '),
        }}
      />

      {/* Main Grid Content */}
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
          <CubeMark size={28} color="rgba(255,255,255,0.95)" accent={accent} />
          <span
            style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: 36,
              fontWeight: 800,
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
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 20,
                  fontWeight: 600,
                  padding: '6px 18px',
                  borderRadius: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {data.seriesName}
              </div>
            )}
            <div
              style={{
                background: accent,
                color: '#fff',
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '2px',
                padding: '7px 22px',
                borderRadius: 8,
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
              color: '#fff',
              lineHeight: 1,
              letterSpacing: metricLetterSpacing,
              textShadow: `0 4px 24px ${accent}44`,
            }}
          >
            {data.metric}
          </div>
          <div
            style={{
              fontSize: 34,
              color: 'rgba(255,255,255,0.70)',
              fontWeight: 500,
              marginTop: 16,
              letterSpacing: '-0.2px',
            }}
          >
            {data.metricLabel}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: headlineFontSize,
            fontWeight: 800,
            color: '#fff',
            marginTop: 36,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
          }}
        >
          {data.headline}
        </div>

        {/* Main High-Impact Infographic Chart */}
        {chartPoints.length >= 2 && (
          <RichInfographicChart
            points={chartPoints}
            width={W - 160}
            height={380}
            color={accent}
            unit={data.unit}
          />
        )}

        {/* Editorial Story Text Box */}
        <div
          style={{
            fontSize: storyFontSize,
            color: 'rgba(255, 255, 255, 0.72)',
            marginTop: 20,
            lineHeight: 1.48,
            fontWeight: 400,
            background: 'rgba(255, 255, 255, 0.025)',
            borderLeft: `4px solid ${accent}`,
            padding: '16px 24px',
            borderRadius: '0 14px 14px 0',
          }}
        >
          {data.story}
        </div>

        {/* Verified Data Footer */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 30,
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 4, height: 32, background: accent, borderRadius: 2 }} />
              <span style={{ fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                Quelle: Umweltbundesamt (UBA)
              </span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: '-0.5px' }}>
              Umweltpuls.de →
            </span>
          </div>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.40)', letterSpacing: '0.1px' }}>
            Interaktiver Datensatz: Umweltpuls.de/dataset/{data.datasetId}
          </span>
        </div>
      </div>
    </div>
  )
}
