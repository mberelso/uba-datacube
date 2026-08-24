import { useRef, useState, useEffect } from 'react'
import { toBlob } from 'html-to-image'
import { SocialCardStory } from './SocialCardStory'
import { CATEGORY_COLORS } from './types'
import type { SocialCardData } from './types'

const BG_VARIANTS: Record<string, { file: string; label: string }[]> = {
  klima:     [{ file: 'klima-1.jpg', label: 'Sturmwolken' }, { file: 'klima-2.jpg', label: 'Gletscher' }],
  energie:   [{ file: 'energie-1.jpg', label: 'Windräder' }, { file: 'energie-2.jpg', label: 'Solar' }],
  transport: [{ file: 'transport-1.jpg', label: 'Autobahn' }, { file: 'transport-2.jpg', label: 'Bahngleise' }],
  wasser:    [{ file: 'wasser-1.jpg', label: 'Fluss' }, { file: 'wasser-2.jpg', label: 'Nordsee' }],
  luft:      [{ file: 'luft-1.jpg', label: 'Wolken' }, { file: 'luft-2.jpg', label: 'Industrie' }],
  boden:     [{ file: 'boden-1.jpg', label: 'Waldboden' }, { file: 'boden-2.jpg', label: 'Acker' }],
  flaeche:   [{ file: 'flaeche-1.jpg', label: 'Aerial' }, { file: 'flaeche-2.jpg', label: 'Waldgrenze' }],
}

const PREVIEW_SCALE = 0.28

async function exportPng(el: HTMLElement): Promise<Blob> {
  const blob = await toBlob(el, { pixelRatio: 1, cacheBust: true })
  if (!blob) throw new Error('Export fehlgeschlagen')
  return blob
}

export function SocialCardModal({ data: baseData, onClose }: {
  data: SocialCardData
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [bgUrl, setBgUrl] = useState<string | undefined>(undefined)
  const [availableBgs, setAvailableBgs] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  const data: SocialCardData = { ...baseData, backgroundUrl: bgUrl }
  const accent = CATEGORY_COLORS[data.category]
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  // Prüfe welche Hintergrundbilder vorhanden sind
  useEffect(() => {
    const variants = BG_VARIANTS[data.category] ?? []
    Promise.all(
      variants.map(v =>
        fetch(`${base}/social-bg/${v.file}`, { method: 'HEAD' })
          .then(r => r.ok ? v.file : null).catch(() => null)
      )
    ).then(res => setAvailableBgs(res.filter(Boolean) as string[]))
  }, [data.category, base])

  // Backdrop-Klick schließt
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  async function handleShare() {
    if (!cardRef.current) return
    setBusy(true)
    setHint('')
    try {
      const blob = await exportPng(cardRef.current)
      const file = new File([blob], `umweltpuls-story-${data.datasetId}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: data.headline })
      } else {
        // Desktop-Fallback: Download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
        setHint('Bild heruntergeladen — in Instagram Story hochladen.')
      }
    } catch (e: unknown) {
      const err = e as { name?: string }
      if (err?.name !== 'AbortError') setHint('Fehler beim Exportieren.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      {/* Sheet */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#0f1c26',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 32px',
        maxHeight: '92dvh',
        overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Titel */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#fff', fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: 16 }}>
            {data.headline}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Geist, sans-serif', fontSize: 12, marginTop: 3 }}>
            Instagram Story · WhatsApp Status · 1080×1920 px
          </div>
        </div>

        {/* Card-Vorschau */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 16,
        }}>
          <div style={{
            width: 1080 * PREVIEW_SCALE,
            height: 1920 * PREVIEW_SCALE,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: 'top left',
            }}>
              <SocialCardStory data={data} />
            </div>
          </div>
        </div>

        {/* Hintergrund-Picker */}
        {availableBgs.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Geist, sans-serif', letterSpacing: '0.8px', marginBottom: 8 }}>
              HINTERGRUND
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setBgUrl(undefined)}
                style={{
                  width: 44, height: 44, borderRadius: 8,
                  border: !bgUrl ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.1)',
                  background: '#1a2a36', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 16,
                }}
              >—</button>
              {availableBgs.map(file => {
                const url = `${base}/social-bg/${file}`
                const isActive = bgUrl === url
                const label = (BG_VARIANTS[data.category] ?? []).find(v => v.file === file)?.label
                return (
                  <button
                    key={file}
                    onClick={() => setBgUrl(url)}
                    title={label}
                    style={{
                      width: 44, height: 44, borderRadius: 8, padding: 0, cursor: 'pointer',
                      border: isActive ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden', flexShrink: 0,
                    }}
                  >
                    <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {hint && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Geist, sans-serif', marginBottom: 12, textAlign: 'center' }}>
            {hint}
          </div>
        )}

        {/* Share-Button */}
        <button
          onClick={handleShare}
          disabled={busy}
          style={{
            width: '100%', padding: '14px 0',
            background: busy ? `${accent}80` : accent,
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 700, fontFamily: 'Geist, sans-serif',
            cursor: busy ? 'default' : 'pointer',
            letterSpacing: '-0.2px',
          }}
        >
          {busy ? 'Bereite vor…' : '↑ Story teilen'}
        </button>

        {/* Hidden full-size für Export */}
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
          <div ref={cardRef}><SocialCardStory data={data} /></div>
        </div>
      </div>
    </div>
  )
}
