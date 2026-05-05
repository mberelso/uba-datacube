import { useState } from 'react'

interface GuidedTipProps {
  id: string
  text: string
  color?: string
}

function isClosedInStorage(id: string): boolean {
  try {
    return localStorage.getItem(`guided-tip-${id}`) === 'closed'
  } catch {
    return false
  }
}

function closeInStorage(id: string): void {
  try {
    localStorage.setItem(`guided-tip-${id}`, 'closed')
  } catch {
    // ignore
  }
}

export function GuidedTip({ id, text, color = '#1e3a5f' }: GuidedTipProps) {
  const [visible, setVisible] = useState(() => !isClosedInStorage(id))

  if (!visible) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: `${color}08`,
      border: `1.5px solid ${color}25`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 8,
      padding: '10px 14px',
      marginBottom: 16,
      fontSize: 13,
      color: '#475569',
      lineHeight: 1.5,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
      <span style={{ flex: 1 }}>{text}</span>
      <button
        onClick={() => {
          closeInStorage(id)
          setVisible(false)
        }}
        aria-label="Hinweis schließen"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#94a3b8', fontSize: 16, padding: '0 2px',
          lineHeight: 1, flexShrink: 0, marginTop: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
