import { useRef, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { SocialCardStory } from '../components/social/SocialCardStory'
import { SocialCardFeed } from '../components/social/SocialCardFeed'
import type { SocialCardData } from '../components/social/types'

const BG_VARIANTS: Record<string, { file: string; label: string }[]> = {
  klima:     [{ file: 'klima-1.jpg', label: 'Sturmwolken' }, { file: 'klima-2.jpg', label: 'Gletscher' }],
  energie:   [{ file: 'energie-1.jpg', label: 'Windräder' }, { file: 'energie-2.jpg', label: 'Solar' }],
  transport: [{ file: 'transport-1.jpg', label: 'Autobahn' }, { file: 'transport-2.jpg', label: 'Bahngleise' }],
  wasser:    [{ file: 'wasser-1.jpg', label: 'Fluss' }, { file: 'wasser-2.jpg', label: 'Nordsee' }],
  luft:      [{ file: 'luft-1.jpg', label: 'Wolken' }, { file: 'luft-2.jpg', label: 'Industrie' }],
  boden:     [{ file: 'boden-1.jpg', label: 'Waldboden' }, { file: 'boden-2.jpg', label: 'Acker' }],
  flaeche:   [{ file: 'flaeche-1.jpg', label: 'Aerial' }, { file: 'flaeche-2.jpg', label: 'Waldgrenze' }],
}

const INITIAL: SocialCardData = {
  category: 'klima',
  metric: '−38 %',
  metricLabel: 'gegenüber 1990',
  headline: 'CO₂-Emissionen fast halbiert',
  story: 'Deutschland hat seine Treibhausgasemissionen seit der Wiedervereinigung stark reduziert. Der Rückgang kam vor allem durch den Strukturwandel in der Industrie.',
  sparkline: [1250, 1180, 1090, 980, 920, 870, 820, 800, 780, 790, 760, 740, 720, 700, 680],
  yearRange: '1990 – 2023',
  datasetId: 'DF_CLIMATE_EMISSIONS_GHG_TRENDS',
}

const S = 0.3

function ScaledCard({ width, height, children }: {
  width: number
  height: number
  children: React.ReactNode
}) {
  return (
    <div style={{
      width: width * S,
      height: height * S,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 12,
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${S})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}

function DownloadBtn({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        marginTop: 12,
        width: '100%',
        padding: '8px 0',
        background: loading ? 'rgba(74,103,65,0.4)' : '#4A6741',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'Geist, sans-serif',
        cursor: loading ? 'default' : 'pointer',
        letterSpacing: '0.3px',
        transition: 'background 0.15s',
      }}
    >
      {loading ? 'Exportiere…' : label}
    </button>
  )
}

async function downloadCard(el: HTMLElement | null, filename: string) {
  if (!el) return
  const png = await toPng(el, { pixelRatio: 1, cacheBust: true })
  const a = document.createElement('a')
  a.href = png
  a.download = filename
  a.click()
}

export default function SocialPreviewPage() {
  const [data, setData] = useState<SocialCardData>(INITIAL)
  const [dlStory, setDlStory] = useState(false)
  const [dlFeed, setDlFeed] = useState(false)
  const [availableBgs, setAvailableBgs] = useState<string[]>([])

  const storyRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const variants = BG_VARIANTS[data.category] ?? []
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    Promise.all(
      variants.map(v =>
        fetch(`${base}/social-bg/${v.file}`, { method: 'HEAD' })
          .then(r => r.ok ? v.file : null)
          .catch(() => null)
      )
    ).then(results => setAvailableBgs(results.filter(Boolean) as string[]))
  }, [data.category])

  async function handleDownloadStory() {
    setDlStory(true)
    await downloadCard(storyRef.current, `umweltpuls-story-${data.datasetId}.png`)
    setDlStory(false)
  }

  async function handleDownloadFeed() {
    setDlFeed(true)
    await downloadCard(feedRef.current, `umweltpuls-feed-${data.datasetId}.png`)
    setDlFeed(false)
  }

  return (
    <div style={{ padding: 40, background: '#0a0f14', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#fff', fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, margin: 0 }}>
          Social Card Preview
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Geist, sans-serif', fontSize: 13, margin: '4px 0 0' }}>
          Story 1080×1920 · Feed 1080×1080 — Vorschau {S * 100}%, Export in voller Auflösung
        </p>
      </div>

      {/* Hintergrund-Picker */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Geist, sans-serif', letterSpacing: '0.5px' }}>
          HINTERGRUND
        </span>
        <button
          onClick={() => setData(d => ({ ...d, backgroundUrl: undefined }))}
          style={{
            width: 48, height: 48, borderRadius: 8,
            border: !data.backgroundUrl ? '2px solid #4A6741' : '2px solid rgba(255,255,255,0.12)',
            background: '#1a2530', cursor: 'pointer', fontSize: 18, color: 'rgba(255,255,255,0.4)',
          }}
          title="Kein Hintergrund"
        >—</button>

        {availableBgs.length === 0 && (
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'Geist, sans-serif' }}>
            Noch keine Bilder — <code style={{ fontSize: 11 }}>npm run generate-backgrounds</code> ausführen
          </span>
        )}

        {availableBgs.map(file => {
          const base = import.meta.env.BASE_URL.replace(/\/$/, '')
          const url = `${base}/social-bg/${file}`
          const variant = (BG_VARIANTS[data.category] ?? []).find(v => v.file === file)
          const isActive = data.backgroundUrl === url
          return (
            <button
              key={file}
              onClick={() => setData(d => ({ ...d, backgroundUrl: url }))}
              title={variant?.label ?? file}
              style={{
                width: 48, height: 48, borderRadius: 8, padding: 0, cursor: 'pointer',
                border: isActive ? '2px solid #4A6741' : '2px solid rgba(255,255,255,0.12)',
                overflow: 'hidden', flexShrink: 0,
              }}
            >
              <img src={url} alt={variant?.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          )
        })}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'Geist, sans-serif', margin: '0 0 10px', letterSpacing: '0.5px' }}>
            STORY / WHATSAPP STATUS
          </p>
          <ScaledCard width={1080} height={1920}>
            <SocialCardStory data={data} />
          </ScaledCard>
          <DownloadBtn onClick={handleDownloadStory} loading={dlStory} label="↓ Story PNG (1080×1920)" />
        </div>

        <div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'Geist, sans-serif', margin: '0 0 10px', letterSpacing: '0.5px' }}>
            FEED / LINKEDIN
          </p>
          <ScaledCard width={1080} height={1080}>
            <SocialCardFeed data={data} />
          </ScaledCard>
          <DownloadBtn onClick={handleDownloadFeed} loading={dlFeed} label="↓ Feed PNG (1080×1080)" />
        </div>
      </div>

      {/* Versteckte Full-Size-Instanzen für html-to-image */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }}>
        <div ref={storyRef}><SocialCardStory data={data} /></div>
        <div ref={feedRef}><SocialCardFeed data={data} /></div>
      </div>

    </div>
  )
}
