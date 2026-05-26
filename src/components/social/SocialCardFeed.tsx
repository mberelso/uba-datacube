import { CubeMark } from '../CubeMark'
import { CATEGORY_LABELS, CATEGORY_COLORS } from './types'
import type { SocialCardData } from './types'

const W = 1080
const H = 1080

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
        <linearGradient id="sparkFillFeed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkFillFeed)" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SocialCardFeed({ data }: { data: SocialCardData }) {
  const label = CATEGORY_LABELS[data.category]
  const accent = CATEGORY_COLORS[data.category]
  const [yearStart, yearEnd] = data.yearRange.split('–').map(s => s.trim())

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
            objectFit: 'cover', opacity: 0.3,
          }}
        />
      )}

      {/* Gradient-Overlay: links dunkel für Text, rechts transparent */}
      <div style={{
        position: 'absolute', inset: 0,
        background: [
          'linear-gradient(135deg,',
          'rgba(13,26,36,0.97) 0%,',
          'rgba(13,26,36,0.80) 55%,',
          'rgba(13,26,36,0.50) 100%)',
        ].join(' '),
      }} />

      {/* Akzentlinie links */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 6,
        background: accent,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 72px 64px 80px',
      }}>

        {/* Logo + Kategorie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CubeMark size={22} color="rgba(255,255,255,0.9)" accent={accent} />
          <span style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.3px',
          }}>
            Umweltpuls
          </span>
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${accent}60`,
            color: accent,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '2px',
            padding: '5px 16px',
            borderRadius: 6,
          }}>
            {label}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Metric */}
        <div style={{
          fontSize: 128,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
          letterSpacing: '-5px',
        }}>
          {data.metric}
        </div>
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.42)',
          fontWeight: 400,
          marginTop: 10,
          letterSpacing: '-0.2px',
        }}>
          {data.metricLabel}
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 52,
          fontWeight: 700,
          color: '#fff',
          marginTop: 36,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          maxWidth: 800,
        }}>
          {data.headline}
        </div>

        {/* Story */}
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.58)',
          marginTop: 24,
          lineHeight: 1.55,
          fontWeight: 400,
          maxWidth: 760,
        }}>
          {data.story}
        </div>

        {/* Sparkline */}
        {data.sparkline.length >= 2 && (
          <div style={{ marginTop: 44 }}>
            <Sparkline data={data.sparkline} width={W - 152} height={90} color={accent} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)' }}>{yearStart}</span>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)' }}>{yearEnd}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 40,
          paddingTop: 28,
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 3, height: 24, background: accent, borderRadius: 2 }} />
              <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
                Quelle: Umweltbundesamt
              </span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '-0.3px' }}>
              Umweltpuls.de →
            </span>
          </div>
          <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.1px' }}>
            Rohdaten: Umweltpuls.de/dataset/{data.datasetId}
          </span>
        </div>
      </div>
    </div>
  )
}
