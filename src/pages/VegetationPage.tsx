import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts'
import { Plant, Play, Pause, Leaf, CloudSun, TrendUp, MapTrifold, MapPin } from '@phosphor-icons/react'
import { SEO } from '../components/SEO'
import { GlassTooltip } from '../components/charts/ChartStyles'
import { NdviChoropleth } from '../components/charts/NdviChoropleth'
import { NDVI_LEGEND_GRADIENT } from '../components/charts/ndviColor'

// ─── Typen ──────────────────────────────────────────────────────────────────

interface Period {
  year: string; img: string
  median: number | null; veg_pct: number | null; gap_pct: number
}
interface TimelinePoint { date: string; ndvi: number }
interface Meta {
  region: string; slug: string; source: string; indicator: string
  updated: string; periods: Period[]; timeline: TimelinePoint[]
}

const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')
const DATA_DIR = `${BASE}/data/vegetation/ebersberg`
const fmt = (v: number | null, d = 2) =>
  v == null ? '—' : v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d })

type View = 'de' | 'ebersberg'

// ─── Seite (Shell + Umschalter) ───────────────────────────────────────────────

export default function VegetationPage() {
  const [view, setView] = useState<View>('de')

  return (
    <>
      <SEO
        title="Vegetationsgesundheit"
        description="Vegetation (NDVI) aus Sentinel-2 — Deutschland-Übersicht nach Bundesländern und hochaufgelöstes Detail am Beispiel Ebersberg."
        path="/vegetation"
      />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 56px' }}>
        <div style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 8 }}>Dashboard · Vegetationsgesundheit</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ background: '#4A6741', color: '#fff', borderRadius: 5, padding: '3px 9px', fontSize: 10, fontWeight: 700, letterSpacing: 0.6 }}>SATELLIT</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Copernicus Sentinel-2 · CDSE OpenEO</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: '0 0 8px', color: '#0f172a' }}>
          <Plant size={26} weight="fill" color="#4A6741" style={{ verticalAlign: '-4px', marginRight: 8 }} />
          Vegetationsgesundheit
        </h1>
        <p style={{ color: '#475569', fontSize: 15, maxWidth: 720, margin: 0, lineHeight: 1.55 }}>
          Wie grün ist das Land? NDVI misst die Vegetationsdichte aus dem All. Zwei Ebenen:
          die <b>Deutschland-Übersicht</b> färbt jedes Bundesland nach seinem Monatswert,
          das <b>Detail</b> zeigt einen Landkreis in voller 10-m-Schärfe — beide mit derselben
          Farbskala, sodass sie ineinandergreifen.
        </p>

        {/* Umschalter */}
        <div style={{ display: 'inline-flex', gap: 4, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 11, padding: 4, margin: '22px 0 4px' }}>
          <Toggle active={view === 'de'} onClick={() => setView('de')} icon={<MapTrifold size={16} weight="fill" />}>
            Deutschland
          </Toggle>
          <Toggle active={view === 'ebersberg'} onClick={() => setView('ebersberg')} icon={<MapPin size={16} weight="fill" />}>
            Ebersberg · 10 m Detail
          </Toggle>
        </div>

        <div style={{ marginTop: 18 }}>
          {view === 'de'
            ? <Card title="Deutschland — NDVI je Bundesland (Monatsmedian)"><NdviChoropleth /></Card>
            : <EbersbergView />}
        </div>

        <p style={{ color: '#64748b', fontSize: 12.5, marginTop: 22, lineHeight: 1.65, borderTop: '1px solid #e2e8f0', paddingTop: 15 }}>
          Quelle: Copernicus Sentinel-2 · CDSE OpenEO. NDVI = (NIR − Rot) / (NIR + Rot),
          Wolken über die Scene Classification maskiert. Deutschland-Ebene grob aggregiert
          (Bundesland-Mittel), Detail-Ebene in 10 m. Prototyp.
        </p>
      </div>
    </>
  )
}

// ─── Ebersberg-Detail (Slider + Crossfade + Charts) ───────────────────────────

function EbersbergView() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [sel, setSel] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    fetch(`${DATA_DIR}/meta.json`).then(r => r.json())
      .then((m: Meta) => { setMeta(m); setSel(m.periods.length - 1) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!playing || !meta) return
    timer.current = window.setInterval(() => {
      setSel(prev => { if (prev >= meta.periods.length - 1) { setPlaying(false); return prev } return prev + 1 })
    }, 1200)
    return () => { if (timer.current) window.clearInterval(timer.current) }
  }, [playing, meta])

  const seasonal = useMemo(() => {
    if (!meta) return []
    const selYear = meta.periods[sel]?.year
    const byMonth: Record<number, number[]> = {}
    const curByMonth: Record<number, number> = {}
    for (const { date, ndvi } of meta.timeline) {
      const m = +date.slice(5, 7)
      ;(byMonth[m] ??= []).push(ndvi)
      if (date.slice(0, 4) === selYear) curByMonth[m] = ndvi
    }
    return MONTHS_DE.map((label, i) => {
      const m = i + 1
      const vals = byMonth[m] ?? []
      const lo = vals.length ? Math.min(...vals) : null
      const hi = vals.length ? Math.max(...vals) : null
      const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      return { label, lo, mean, band: lo != null && hi != null ? +(hi - lo).toFixed(3) : null, cur: curByMonth[m] ?? null }
    })
  }, [meta, sel])

  const timeline = useMemo(() => meta?.timeline.map(p => ({ m: p.date.slice(0, 7), ndvi: p.ndvi })) ?? [], [meta])
  const highlight = useMemo(() => {
    if (!meta) return null
    const y = meta.periods[sel]?.year
    const inYear = timeline.filter(t => t.m.slice(0, 4) === y)
    return inYear.length ? { x1: inYear[0].m, x2: inYear[inYear.length - 1].m } : null
  }, [meta, sel, timeline])

  if (!meta) return <div style={{ padding: '40px 0', color: '#94a3b8' }}>Lade Ebersberg-Daten …</div>

  const p = meta.periods[sel]
  const others = meta.periods.filter((_, i) => i !== sel).map(x => x.median).filter((v): v is number => v != null)
  const mean = others.length ? others.reduce((a, b) => a + b, 0) / others.length : 0
  const diff = (p.median ?? 0) - mean
  const diffPct = mean ? (diff / mean) * 100 : 0

  return (
    <>
      {/* Scrubber */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <button onClick={() => setPlaying(v => !v)} aria-label={playing ? 'Pause' : 'Abspielen'}
          style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#1B2B3A', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1B2B3A', letterSpacing: '-0.5px' }}>Sommer {p.year}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>Landkreis Ebersberg · Median-NDVI {fmt(p.median)}</span>
          </div>
          <input type="range" min={0} max={meta.periods.length - 1} step={1} value={sel}
            onChange={e => { setPlaying(false); setSel(+e.target.value) }}
            style={{ width: '100%', accentColor: '#16a34a', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {meta.periods.map((per, i) => (
              <button key={per.year} onClick={() => { setPlaying(false); setSel(i) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11.5, fontWeight: i === sel ? 700 : 500, color: i === sel ? '#1B2B3A' : '#94a3b8' }}>
                {per.year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,0.95fr)', gap: 18 }} className="veg-grid">
        <Card title="Sommer-Komposit (10 m)">
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', aspectRatio: '814 / 1000' }}>
            <AnimatePresence mode="popLayout">
              <motion.img key={p.year} src={`${DATA_DIR}/${p.img}`} alt={`NDVI Sommer ${p.year}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
            </AnimatePresence>
            <span style={{ position: 'absolute', left: 10, top: 10, background: 'rgba(27,43,58,0.9)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '5px 11px', borderRadius: 8 }}>Sommer {p.year}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 13, fontSize: 11, color: '#64748b' }}>
            <span>gestresst</span>
            <div style={{ height: 9, flex: 1, borderRadius: 3, background: NDVI_LEGEND_GRADIENT }} />
            <span>gesund</span>
          </div>
        </Card>

        <Card title={`Auswertung ${p.year}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            <Kpi icon={<Leaf size={15} weight="fill" />} value={fmt(p.median)} label="Median-NDVI" />
            <Kpi icon={<Plant size={15} weight="fill" />} value={`${Math.round(p.veg_pct ?? 0)} %`} label="Vegetation >0,4" />
            <Kpi icon={<CloudSun size={15} weight="fill" />} value={`${fmt(p.gap_pct, 1)} %`} label="Wolkenlücke" />
          </div>
          <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginBottom: 18 }}>
            <TrendUp size={15} weight="bold" style={{ verticalAlign: '-2px', marginRight: 5, color: diff >= 0 ? '#16a34a' : '#dc2626' }} />
            Median <b style={{ color: '#0f172a' }}>{fmt(p.median)}</b> liegt{' '}
            <b style={{ color: diff >= 0 ? '#16a34a' : '#dc2626' }}>{diff >= 0 ? '▲' : '▼'} {fmt(Math.abs(diffPct), 1)} %</b>{' '}
            {diff >= 0 ? 'über' : 'unter'} dem Mittel der anderen Jahre ({fmt(mean)}).
          </div>
          <h3 style={CARD_H3}>Jahresverlauf vs. Mittel</h3>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={seasonal} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} />
              <YAxis domain={[0.2, 1]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<GlassTooltip />} />
              <Area dataKey="lo" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} legendType="none" />
              <Area dataKey="band" stackId="band" stroke="none" fill="#e2e8f0" name="Spannweite" isAnimationActive={false} />
              <Line dataKey="mean" stroke="#94a3b8" strokeWidth={2} dot={false} name="Mittel" />
              <Line dataKey="cur" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 2.5 }} name={`Sommer ${p.year}`} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
          <Legend2 />
        </Card>

        <div style={{ gridColumn: '1 / -1' }}>
          <Card title="Langzeit-Zeitreihe (monatlich) — gewähltes Jahr hervorgehoben">
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={timeline} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }}
                  ticks={timeline.filter(t => t.m.endsWith('-01')).map(t => t.m)} tickFormatter={m => m.slice(0, 4)} />
                <YAxis domain={[0.2, 1]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<GlassTooltip />} />
                {highlight && <ReferenceArea x1={highlight.x1} x2={highlight.x2} fill="#16a34a" fillOpacity={0.1} />}
                <Line dataKey="ndvi" stroke="#4A6741" strokeWidth={1.8} dot={false} name="NDVI" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
      <style>{`@media (max-width: 840px) { .veg-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  )
}

// ─── UI-Bausteine ────────────────────────────────────────────────────────────

const CARD_H3: React.CSSProperties = {
  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
  color: '#94a3b8', margin: '0 0 10px', fontWeight: 600,
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <h2 style={CARD_H3}>{title}</h2>
      {children}
    </div>
  )
}

function Kpi({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e2e8f0', borderRadius: 11, padding: 13 }}>
      <div style={{ color: '#4A6741', marginBottom: 3 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1B2B3A', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Toggle({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer',
      borderRadius: 8, padding: '8px 14px', fontSize: 13.5, fontWeight: 600,
      background: active ? '#1B2B3A' : 'transparent', color: active ? '#fff' : '#64748b',
      transition: 'all 0.15s',
    }}>
      {icon}{children}
    </button>
  )
}

function Legend2() {
  const item = (c: string, t: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />{t}
    </span>
  )
  return (
    <div style={{ display: 'flex', gap: 15, fontSize: 12, color: '#64748b', marginTop: 9, flexWrap: 'wrap' }}>
      {item('#16a34a', 'Gewähltes Jahr')}{item('#94a3b8', 'Mittel')}{item('#e2e8f0', 'Spannweite')}
    </div>
  )
}
