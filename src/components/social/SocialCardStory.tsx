import { CubeMark } from '../CubeMark'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types'
import type { SocialCardData, ChartPoint, KpiCardItem } from './types'

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

  const padX = 44
  const padY = 64
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
    <div style={{ position: 'relative', width, height, marginTop: 28, marginBottom: 20 }}>
      {/* Glassmorphic High-Contrast Container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(9, 15, 28, 0.95) 100%)',
          border: `2px solid ${color}55`,
          borderRadius: 28,
          boxShadow: `0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      />

      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="contrastAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.65" />
            <stop offset="100%" stopColor={color} stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="rgba(255,255,255,0.14)" strokeDasharray="6 6" strokeWidth="2" />
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="rgba(255,255,255,0.14)" strokeDasharray="6 6" strokeWidth="2" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(255,255,255,0.14)" strokeDasharray="6 6" strokeWidth="2" />

        {/* Gradient Fill */}
        <path d={areaD} fill="url(#contrastAreaGrad)" />

        {/* Thick Vibrant Stroke Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

        {/* Inner White Highlight Core Line */}
        <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

        {/* Start Point Dot */}
        <circle cx={firstPt.x} cy={firstPt.y} r="10" fill={color} stroke="#ffffff" strokeWidth="4" />

        {/* Peak Point Dot (if distinct) */}
        {peakPt !== firstPt && peakPt !== lastPt && (
          <circle cx={peakPt.x} cy={peakPt.y} r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="4" />
        )}

        {/* Last Point Glowing Outer Ring & Core Dot */}
        <circle cx={lastPt.x} cy={lastPt.y} r="24" fill={color} opacity="0.45" />
        <circle cx={lastPt.x} cy={lastPt.y} r="12" fill="#ffffff" stroke={color} strokeWidth="6" />
      </svg>

      {/* Start Value Callout Badge */}
      <div
        style={{
          position: 'absolute',
          left: Math.min(firstPt.x, width - 260),
          top: Math.max(16, firstPt.y - 54),
          background: '#1e293b',
          border: '2px solid rgba(255, 255, 255, 0.38)',
          borderRadius: 12,
          padding: '6px 16px',
          fontSize: 23,
          fontWeight: 700,
          color: '#ffffff',
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
        }}
      >
        {firstPt.year}: {formatV(firstPt.value)}{unitSuffix}
      </div>

      {/* End Value Callout Badge */}
      <div
        style={{
          position: 'absolute',
          right: Math.max(16, width - lastPt.x - 40),
          top: Math.max(16, lastPt.y - 58),
          background: color,
          border: '2px solid #ffffff',
          borderRadius: 14,
          padding: '8px 20px',
          fontSize: 25,
          fontWeight: 900,
          color: '#ffffff',
          boxShadow: `0 8px 26px ${color}aa, 0 4px 12px rgba(0,0,0,0.6)`,
          whiteSpace: 'nowrap',
        }}
      >
        {lastPt.year}: {formatV(lastPt.value)}{unitSuffix}
      </div>

      {/* Peak Callout Badge */}
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
            fontSize: 21,
            fontWeight: 800,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
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

function BentoKpiGrid({ items }: { items: KpiCardItem[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 22,
        marginTop: 28,
        marginBottom: 20,
      }}
    >
      {items.slice(0, 4).map((item, idx) => (
        <div
          key={idx}
          style={{
            background: 'linear-gradient(145deg, rgba(15, 26, 44, 0.92) 0%, rgba(10, 17, 30, 0.96) 100%)',
            border: `2px solid ${item.color}55`,
            borderRadius: 24,
            padding: '26px 28px',
            boxShadow: `0 12px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                color: item.color,
              }}
            >
              {item.label}
            </span>
            {item.rankBadge && (
              <span
                style={{
                  background: `${item.color}25`,
                  border: `1.5px solid ${item.color}88`,
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.rankBadge}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-1.5px',
              lineHeight: 1.08,
              marginTop: 14,
              textShadow: `0 4px 20px ${item.color}66`,
            }}
          >
            {item.value}
          </div>

          {item.sublabel && (
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: '#94a3b8',
                marginTop: 8,
                lineHeight: 1.3,
              }}
            >
              {item.sublabel}
            </div>
          )}
        </div>
      ))}
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
  const metricFontSize = metricLen <= 5 ? 148 : metricLen <= 8 ? 114 : metricLen <= 14 ? 84 : 66
  const metricLetterSpacing = metricLen <= 5 ? '-5px' : metricLen <= 8 ? '-3px' : '-1.5px'

  const headlineLen = data.headline.length
  const headlineFontSize = headlineLen > 65 ? 46 : headlineLen > 35 ? 56 : 64

  const storyLen = data.story.length
  const storyFontSize = storyLen > 180 ? 27 : storyLen > 100 ? 30 : 34

  const footerUrl = data.sharePath
    ? `umweltpuls.de/${data.sharePath.replace(/^\//, '')}`
    : `umweltpuls.de/dataset/${data.datasetId}`

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Geist', system-ui, -apple-system, sans-serif",
        background: '#060c17',
        flexShrink: 0,
      }}
    >
      {/* Ambient Radial Color Glows (so card never looks empty/black even without photo) */}
      <div
        style={{
          position: 'absolute',
          top: -180,
          right: -180,
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}42 0%, ${accent}14 42%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: -220,
          width: 820,
          height: 820,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}2e 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Editorial Grid Pattern */}
      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="socialGrid" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#socialGrid)" />
      </svg>

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
            opacity: 0.42,
          }}
        />
      )}

      {/* Atmospheric Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            'linear-gradient(to bottom,',
            'rgba(6,12,23,0.28) 0%,',
            'rgba(6,12,23,0.58) 32%,',
            'rgba(6,12,23,0.92) 66%,',
            '#060c17 92%)',
          ].join(' '),
        }}
      />

      {/* Main Content Layout */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '76px 76px 80px',
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <CubeMark size={34} color="#ffffff" accent={accent} />
          <div>
            <div
              style={{
                color: '#ffffff',
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-0.8px',
                lineHeight: 1,
              }}
            >
              Umweltpuls
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 19,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              Offene Umweltdaten Deutschland
            </div>
          </div>

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
                  background: 'rgba(255,255,255,0.16)',
                  border: '1.5px solid rgba(255,255,255,0.30)',
                  color: '#ffffff',
                  fontSize: 21,
                  fontWeight: 700,
                  padding: '8px 20px',
                  borderRadius: 12,
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
                fontSize: 23,
                fontWeight: 900,
                letterSpacing: '2.5px',
                padding: '9px 24px',
                borderRadius: 12,
                boxShadow: `0 6px 20px ${accent}88`,
              }}
            >
              {label}
            </div>
          </div>
        </div>

        {/* Center Hero Block (Headline + Hero Metric + Chart or Bento KPI Grid + Story) */}
        <div style={{ display: 'flex', flexDirection: 'column', my: 'auto' } as React.CSSProperties}>
          {/* Headline on top for clear visual context */}
          <div
            style={{
              fontSize: headlineFontSize,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
              textShadow: '0 4px 16px rgba(0,0,0,0.85)',
              marginBottom: 28,
            }}
          >
            {data.headline}
          </div>

          {/* Primary Hero Metric Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 24,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: metricFontSize,
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 0.95,
                letterSpacing: metricLetterSpacing,
                textShadow: `0 6px 34px ${accent}cc, 0 2px 10px rgba(0,0,0,0.9)`,
              }}
            >
              {data.metric}
            </div>
            <div
              style={{
                fontSize: 34,
                color: '#e2e8f0',
                fontWeight: 700,
                letterSpacing: '-0.3px',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {data.metricLabel}
            </div>
          </div>

          {/* Centerpiece: Either 2x2 Bento KPI Grid (for Regional/Summary cards) OR High-Contrast Time-Series Chart */}
          {data.kpiGrid && data.kpiGrid.length > 0 ? (
            <BentoKpiGrid items={data.kpiGrid} />
          ) : chartPoints.length >= 2 ? (
            <HighContrastChart
              points={chartPoints}
              width={W - 152}
              height={420}
              color={accent}
              unit={data.unit}
            />
          ) : null}

          {/* Editorial Story Box */}
          <div
            style={{
              fontSize: storyFontSize,
              color: '#f8fafc',
              marginTop: 18,
              lineHeight: 1.48,
              fontWeight: 500,
              background: 'rgba(13, 24, 39, 0.90)',
              borderLeft: `7px solid ${accent}`,
              borderTop: '1.5px solid rgba(255, 255, 255, 0.18)',
              borderRight: '1.5px solid rgba(255, 255, 255, 0.18)',
              borderBottom: '1.5px solid rgba(255, 255, 255, 0.18)',
              padding: '22px 28px',
              borderRadius: '0 18px 18px 0',
              boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
            }}
          >
            {data.story}
          </div>
        </div>

        {/* Verified Data Footer */}
        <div
          style={{
            paddingTop: 28,
            borderTop: '2px solid rgba(255,255,255,0.18)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 6, height: 34, background: accent, borderRadius: 3 }} />
              <span style={{ fontSize: 26, fontWeight: 800, color: '#ffffff' }}>
                Quelle: UBA · DWD · Bundesnetzagentur
              </span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: accent, letterSpacing: '-0.5px' }}>
              umweltpuls.de →
            </span>
          </div>
          <span style={{ fontSize: 22, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.2px' }}>
            Direktlink: {footerUrl}
          </span>
        </div>
      </div>
    </div>
  )
}
