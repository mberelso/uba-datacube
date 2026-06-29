import { useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { HeatExportCard } from './HeatExportCard'
import { NORDIC, type ThreshData, type StatesGeo } from './heatShared'

const PREVIEW_SCALE = 0.30

export function HeatExportModal({ data, geo, mode, onClose }: {
  data: ThreshData
  geo: StatesGeo
  mode: string                 // 'DE' oder Bundesland-Code
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  const title = mode === 'DE' ? 'Deutschland' : data.states.find(s => s.code === mode)?.name ?? ''
  const fileBase = mode === 'DE' ? 'deutschland' : mode.toLowerCase()

  async function handleShare() {
    if (!cardRef.current) return
    setBusy(true); setHint('')
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 1, cacheBust: true })
      if (!blob) throw new Error('Export fehlgeschlagen')
      const file = new File([blob], `umweltpuls-hitze-${fileBase}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Hitzerekord ${title}` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        setHint('Bild heruntergeladen — bereit für Instagram, WhatsApp & Co.')
      }
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') setHint('Fehler beim Exportieren.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div style={{ width: '100%', maxWidth: 420, background: '#0f1c26', borderRadius: 20, padding: '20px 20px 28px', maxHeight: '92dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Hitzerekord {title}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>Bild für Instagram, WhatsApp & Co. · 1080×1350 px</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Vorschau (skaliert) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 1080 * PREVIEW_SCALE, height: 1350 * PREVIEW_SCALE, position: 'relative', overflow: 'hidden', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
              <HeatExportCard data={data} geo={geo} mode={mode} />
            </div>
          </div>
        </div>

        {hint && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textAlign: 'center' }}>{hint}</div>}

        <button
          onClick={handleShare}
          disabled={busy}
          style={{ width: '100%', padding: '14px 0', background: busy ? `${NORDIC.red}80` : NORDIC.red, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}
        >
          {busy ? 'Bereite vor…' : '↓ Bild speichern / teilen'}
        </button>

        {/* Off-screen Vollgröße für Export */}
        <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
          <div ref={cardRef}><HeatExportCard data={data} geo={geo} mode={mode} /></div>
        </div>
      </div>
    </div>
  )
}
