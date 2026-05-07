import type { DatasetContent } from '../data/datasetContent'

interface Props {
  content: DatasetContent
  color: string
}

export function DatasetStory({ content, color }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      {content.status === 'draft' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 8, padding: '8px 12px', marginBottom: 16,
          fontSize: 12, color: '#92400e',
        }}>
          <span>Redaktioneller Entwurf — noch nicht final geprüft.</span>
        </div>
      )}

      {/* Headline */}
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: '#0f172a',
        margin: '0 0 16px', lineHeight: 1.3, letterSpacing: '-0.3px',
        borderLeft: `3px solid ${color}`, paddingLeft: 14,
      }}>
        {content.headline}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {/* Lead */}
        <StoryCard
          label="Was ist das?"
          text={content.lead}
          color={color}
        />

        {/* Trend */}
        <StoryCard
          label="Aktuelle Entwicklung"
          text={content.trend}
          color={color}
        />

        {/* Context */}
        <StoryCard
          label="Politischer Kontext"
          text={content.context}
          color={color}
        />

        {/* Methodology */}
        <StoryCard
          label="Methodik & Einschränkungen"
          text={content.methodology}
          color={color}
          muted
        />
      </div>
    </div>
  )
}

function StoryCard({ label, text, color, muted = false }: {
  label: string
  text: string
  color: string
  muted?: boolean
}) {
  return (
    <div style={{
      background: muted ? '#f8fafc' : '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color, marginBottom: 6,
      }}>
        {label}
      </div>
      <p style={{
        fontSize: 13, color: muted ? '#64748b' : '#334155',
        lineHeight: 1.65, margin: 0,
      }}>
        {text}
      </p>
    </div>
  )
}
