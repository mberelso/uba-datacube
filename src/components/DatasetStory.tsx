import type { DatasetContent } from '../data/datasetContent'

interface Props {
  content: DatasetContent
  color: string
}

const CARD_CONFIG = [
  {
    key: 'lead' as const,
    label: 'Was ist das?',
    icon: '◎',
    accent: false,
  },
  {
    key: 'trend' as const,
    label: 'Aktuelle Entwicklung',
    icon: '↗',
    accent: true,
  },
  {
    key: 'context' as const,
    label: 'Politischer Kontext',
    icon: '⬡',
    accent: false,
  },
  {
    key: 'methodology' as const,
    label: 'Methodik & Einschränkungen',
    icon: '≋',
    accent: false,
    muted: true,
  },
]

export function DatasetStory({ content, color }: Props) {
  return (
    <div style={{ marginTop: 4, marginBottom: 8 }}>
      {content.status === 'draft' && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 6, padding: '4px 10px', marginBottom: 20,
          fontSize: 11, color: '#92400e', letterSpacing: '0.02em',
        }}>
          <span style={{ opacity: 0.7 }}>●</span>
          Redaktioneller Entwurf — noch nicht final geprüft
        </div>
      )}

      {/* Headline */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-block',
          width: 32, height: 3,
          background: color,
          borderRadius: 2,
          marginBottom: 10,
        }} />
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: '#0f172a',
          margin: 0, lineHeight: 1.25, letterSpacing: '-0.5px',
        }}>
          {content.headline}
        </h2>
      </div>

      {/* 2×2 Card Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
      }}>
        {CARD_CONFIG.map(({ key, label, icon, accent, muted }) => (
          <StoryCard
            key={key}
            label={label}
            icon={icon}
            text={content[key]}
            color={color}
            accent={accent}
            muted={muted}
          />
        ))}
      </div>
    </div>
  )
}

function StoryCard({ label, icon, text, color, accent = false, muted = false }: {
  label: string
  icon: string
  text: string
  color: string
  accent?: boolean
  muted?: boolean
}) {
  const bg = accent
    ? `${color}08`
    : muted ? '#f8fafc' : '#fff'

  const borderColor = accent ? `${color}30` : '#e2e8f0'

  return (
    <div style={{
      background: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle top stripe on accent cards */}
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2, background: color, opacity: 0.7,
        }} />
      )}

      {/* Label row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 13, lineHeight: 1,
          color: accent ? color : muted ? '#94a3b8' : '#94a3b8',
          fontWeight: 400,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: accent ? color : '#94a3b8',
        }}>
          {label}
        </span>
      </div>

      {/* Text */}
      <p style={{
        fontSize: 13, lineHeight: 1.7, margin: 0,
        color: muted ? '#64748b' : '#334155',
        fontWeight: muted ? 400 : 400,
      }}>
        {text}
      </p>
    </div>
  )
}
