import { CubeMark } from '../CubeMark'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types'
import type { SocialCardData } from './types'

const W = 1080
const H = 1920

function normalize(data: number[]): number[] {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data.map(v => (v - min) / range)
}

function Sparkline({ data, width, height, color }: {
  data: number[]
  width: number
  height: number
  color: string
}) {
  if (data.length < 2) return null
  const norm = normalize(data)
  const pad = 4
  const pts = norm.map((v, i) => {
    const x = pad + (i / (norm.length - 1)) * (width - pad * 2)
    const y = pad + (1 - v) * (height - pad * 2)
    return `${x},${y}`
  })
  const areaPoints = `${pad},${height} ${pts.join(' ')} ${width - pad},${height}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkFill)" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SocialCardStory({ data }: { data: SocialCardData }) {
  const label = CATEGORY_LABELS[data.category]
  const accent = CATEGORY_COLORS[data.category]
  const [yearStart, yearEnd] = data.yearRange.split('–').map(s => s.trim())

  const metricLen = data.metric.length
  const metricFontSize = metricLen <= 5 ? 160 : metricLen <= 8 ? 120 : metricLen <= 14 ? 90 : 72
  const metricLetterSpacing = metricLen <= 5 ? '-7px' : metricLen <= 8 ? '-4px' : '-2px'

  const headlineLen = data.headline.length
  const headlineFontSize = headlineLen > 60 ? 48 : headlineLen > 35 ? 58 : 72

  const storyLen = data.story.length
  const storyFontSize = storyLen > 180 ? 28 : storyLen > 100 ? 32 : 36

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Geist', system-ui, sans-serif",
        background: '#0d1a24',
        flexShrink: 0,
      }}
    >
      {/* Hintergrundbild */}
      {data.backgroundUrl && (
        <img
          src={data.backgroundUrl}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.35,
          }}
        />
      )}

      {/* Gradient-Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'linear-gradient(to bottom,',
          'rgba(13,26,36,0.25) 0%,',
          'rgba(13,26,36,0.45) 35%,',
          'rgba(13,26,36,0.88) 65%,',
          '#0d1a24 85%)',
        ].join(' '),
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '88px 88px 96px',
      }}>

        {/* Logo + Kategorie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <CubeMark size={26} color="rgba(255,255,255,0.92)" accent={accent} />
          <span style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}>
            Umweltpuls
          </span>
          <div style={{
            marginLeft: 'auto',
            background: accent,
            color: '#fff',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '2.5px',
            padding: '7px 22px',
            borderRadius: 8,
          }}>
            {label}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Metric */}
        <div>
          <div style={{
            fontSize: metricFontSize,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: metricLetterSpacing,
          }}>
            {data.metric}
          </div>
          <div style={{
            fontSize: 34,
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 500,
            marginTop: 18,
            letterSpacing: '-0.3px',
          }}>
            {data.metricLabel}
          </div>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: headlineFontSize,
          fontWeight: 700,
          color: '#fff',
          marginTop: 44,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
        }}>
          {data.headline}
        </div>

        {/* Story */}
        <div style={{
          fontSize: storyFontSize,
          color: 'rgba(255,255,255,0.68)',
          marginTop: 28,
          lineHeight: 1.5,
          fontWeight: 400,
        }}>
          {data.story}
        </div>

        {/* Sparkline */}
        {data.sparkline.length >= 2 && (
          <div style={{ marginTop: 64 }}>
            <Sparkline data={data.sparkline} width={W - 176} height={130} color={accent} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 14,
            }}>
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.28)' }}>{yearStart}</span>
              <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.28)' }}>{yearEnd}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 52,
          paddingTop: 36,
          borderTop: '1px solid rgba(255,255,255,0.10)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 3, height: 32, background: accent, borderRadius: 2 }} />
              <span style={{ fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                Quelle: Umweltbundesamt
              </span>
            </div>
            <span style={{ fontSize: 30, fontWeight: 700, color: accent, letterSpacing: '-0.5px' }}>
              Umweltpuls.de →
            </span>
          </div>
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1px' }}>
            Rohdaten: Umweltpuls.de/dataset/{data.datasetId}
          </span>
        </div>
      </div>
    </div>
  )
}
