import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { Play, Pause } from '@phosphor-icons/react'

// Datenformate aus scripts/mastr/build_pv_json.py
interface KreiseData {
  generated: string
  source: string
  years: number[]
  kreise: Record<string, { name: string; cumGw: number[]; cumCount: number[] }>
}
interface PointData {
  count: number
  units: { lon: number[]; lat: number[]; year: number[]; kw: number[]; status: number[]; endYear: number[] }
}
interface Summary {
  years: number[]
  newCount: number[]
  cumCount: number[]
  cumGw: number[]
}

const W = 560
const H = 720
const DISPLAY_START = 2000 // PV vor 2000 ist vernachlässigbar
const END_YEAR = new Date().getFullYear()
const YEARS_PER_SECOND = 2.4

const COLORS = {
  land:   '#f1f3f5',
  border: '#ffffff',
  point:  '#ea580c', // Freiflächen-Anlagen
  fresh:  '#dc2626', // im gewählten Jahr neu
  accent: '#f59e0b',
  navy:   '#1B2B3A',
}

// Sequentielle Amber-Rampe (hell → tief) für die Choropleth
const RAMP: [number, [number, number, number]][] = [
  [0.0, [255, 251, 235]],
  [0.2, [254, 230, 170]],
  [0.4, [253, 199, 90]],
  [0.6, [245, 158, 11]],
  [0.8, [217, 110, 13]],
  [1.0, [154, 52, 18]],
]

function rampColor(t: number): string {
  t = Math.max(0, Math.min(1, t))
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1]
      const [t1, c1] = RAMP[i]
      const f = (t - t0) / (t1 - t0)
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f)
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f)
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f)
      return `rgb(${r},${g},${b})`
    }
  }
  return `rgb(154,52,18)`
}

export function SolarMap() {
  const [geoJson, setGeoJson] = useState<any>(null)
  const [kreise, setKreise] = useState<KreiseData | null>(null)
  const [points, setPoints] = useState<PointData | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [showPoints, setShowPoints] = useState(true)
  const [hover, setHover] = useState<{ name: string; gw: number; count: number } | null>(null)
  const [year, setYear] = useState(END_YEAR)

  const yearRef = useRef<number>(END_YEAR)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const showPointsRef = useRef(showPoints)
  showPointsRef.current = showPoints

  useEffect(() => {
    fetch('/kreise.geo.json').then(r => r.json()).then(setGeoJson).catch(() => setError(true))
    fetch('/pv_kreise.json').then(r => r.json()).then(setKreise).catch(() => setError(true))
    fetch('/pv_points.json').then(r => r.json()).then(setPoints).catch(() => setError(true))
    fetch('/pv_summary.json').then(r => r.json()).then(setSummary).catch(() => setError(true))
  }, [])

  const projection = useMemo(
    () => geoJson ? geoMercator().fitExtent([[14, 12], [W - 14, H - 12]], geoJson) : null,
    [geoJson]
  )

  // Jahr → Index in den Datenreihen (years startet 1990)
  const yearIndex = useCallback(
    (y: number) => kreise ? Math.max(0, Math.min(kreise.years.length - 1, y - kreise.years[0])) : 0,
    [kreise]
  )

  // Maximale Kreis-GW (Endjahr) als Skalenobergrenze für die Farbrampe
  const maxKreisGw = useMemo(() => {
    if (!kreise) return 1
    let m = 0
    for (const k of Object.values(kreise.kreise)) m = Math.max(m, k.cumGw[k.cumGw.length - 1])
    return m || 1
  }, [kreise])

  // Projizierte Punktkoordinaten vorberechnen
  const proj = useMemo(() => {
    if (!projection || !points) return null
    const n = points.count
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    const r = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const p = projection([points.units.lon[i], points.units.lat[i]])
      x[i] = p ? p[0] : -99
      y[i] = p ? p[1] : -99
      r[i] = Math.min(1.4 + Math.sqrt(points.units.kw[i]) / 90, 4)
    }
    return { x, y, r }
  }, [projection, points])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !proj || !points) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!showPointsRef.current) return

    const cur = yearRef.current
    const u = points.units
    const { x, y, r } = proj
    for (let i = 0; i < points.count; i++) {
      if (u.year[i] === 0 || u.year[i] > cur) continue
      if (u.endYear[i] > 0 && u.endYear[i] <= cur) continue
      const age = cur - u.year[i]
      const size = r[i] * 2
      if (age < 1) {
        ctx.globalAlpha = 0.95
        ctx.fillStyle = COLORS.fresh
        const glow = size + (1 - age) * 3
        ctx.fillRect(x[i] - glow / 2, y[i] - glow / 2, glow, glow)
      } else {
        ctx.globalAlpha = 0.7
        ctx.fillStyle = COLORS.point
        ctx.fillRect(x[i] - size / 2, y[i] - size / 2, size, size)
      }
    }
    ctx.globalAlpha = 1
  }, [proj, points])

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      let next = yearRef.current + dt * YEARS_PER_SECOND
      if (next >= END_YEAR) { next = END_YEAR; setPlaying(false) }
      yearRef.current = next
      const intYear = Math.floor(next)
      setYear(prev => (prev !== intYear ? intYear : prev))
      draw()
      if (next < END_YEAR) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, draw])

  useEffect(() => { draw() }, [draw, year, showPoints])

  const handlePlay = () => {
    if (!playing && yearRef.current >= END_YEAR) { yearRef.current = DISPLAY_START; setYear(DISPLAY_START) }
    setPlaying(p => !p)
  }
  const handleSlider = (v: number) => { setPlaying(false); yearRef.current = v; setYear(v) }

  if (error) {
    return <div className="py-16 text-center text-[13px] text-slate-400">Die Karten-Daten konnten nicht geladen werden.</div>
  }
  if (!geoJson || !kreise || !points || !summary || !proj) {
    return <div className="flex items-center justify-center text-[13px] text-slate-400" style={{ height: 500 }}>Karte wird geladen…</div>
  }

  const idx = yearIndex(year)
  const sIdx = Math.max(0, Math.min(summary.years.length - 1, year - summary.years[0]))
  const pathGen = geoPath(projection!)
  const maxNew = Math.max(...summary.newCount)
  const freiflaechenBis = points.units.year.filter((y, i) => y > 0 && y <= year && points.units.status[i] === 0 && (points.units.endYear[i] === 0 || points.units.endYear[i] > year)).length

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr]">
      {/* ── Karte ──────────────────────────────────────────────────────── */}
      <div className="relative" style={{ aspectRatio: `${W} / ${H}`, maxWidth: 560 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
          {geoJson.features.map((f: any, fi: number) => {
            const k = kreise.kreise[f.properties.ags]
            const gw = k ? k.cumGw[idx] : 0
            const fill = gw > 0 ? rampColor(Math.sqrt(gw / maxKreisGw)) : COLORS.land
            return (
              <path
                key={`${f.properties.ags}-${fi}`}
                d={pathGen(f) ?? ''}
                fill={fill}
                stroke={COLORS.border}
                strokeWidth={0.4}
                onMouseEnter={() => setHover(k ? { name: k.name, gw: k.cumGw[idx], count: k.cumCount[idx] } : null)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
        {hover && (
          <div className="absolute top-2 left-2 bg-white/95 rounded-lg shadow-md px-3 py-2 pointer-events-none">
            <div className="text-[12px] font-bold text-[#1B2B3A]">{hover.name}</div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {hover.gw.toLocaleString('de-DE', { maximumFractionDigits: 2 })} GW · {hover.count.toLocaleString('de-DE')} Anlagen
            </div>
          </div>
        )}
      </div>

      {/* ── Steuerung + Statistik ──────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-[52px] font-extrabold tracking-tight tabular-nums leading-none" style={{ color: COLORS.navy }}>
            {year}
          </div>
          <div className="flex gap-8 mt-4">
            <div>
              <div className="text-[26px] font-bold tabular-nums" style={{ color: COLORS.accent }}>
                {summary.cumGw[sIdx].toLocaleString('de-DE', { maximumFractionDigits: 1 })} GW
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Installierte Leistung</div>
            </div>
            <div>
              <div className="text-[26px] font-bold tabular-nums" style={{ color: COLORS.point }}>
                {(summary.cumCount[sIdx] / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio.
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Anlagen gesamt</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            aria-label={playing ? 'Pause' : 'Abspielen'}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 shrink-0 transition-transform hover:scale-105"
            style={{ background: COLORS.navy, color: '#fff' }}
          >
            {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          </button>
          <input
            type="range" min={DISPLAY_START} max={END_YEAR} step={1} value={year}
            onChange={(e) => handleSlider(Number(e.target.value))}
            className="w-full accent-[#f59e0b]" aria-label="Jahr wählen"
          />
        </div>

        {/* Zubau-Balken pro Jahr (klickbar) — der 2023er-Sprung */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            Neue Anlagen pro Jahr
          </div>
          <div className="flex items-end gap-[2px] h-[72px]">
            {summary.years.map((y, i) => {
              if (y < DISPLAY_START) return null
              const c = summary.newCount[i]
              return (
                <button
                  key={y}
                  onClick={() => handleSlider(y)}
                  title={`${y}: ${c.toLocaleString('de-DE')} neue Anlagen`}
                  className="flex-1 cursor-pointer border-0 p-0 rounded-t-[2px] transition-colors"
                  style={{
                    height: `${Math.max(3, (c / maxNew) * 100)}%`,
                    background: y === year ? COLORS.fresh : y < year ? COLORS.accent : '#e2e8f0',
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
            <span>{DISPLAY_START}</span>
            <span>{END_YEAR}</span>
          </div>
        </div>

        {/* Legende: Choropleth-Skala */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            Installierte Leistung je Landkreis
          </div>
          <div className="h-2.5 rounded-full" style={{
            background: `linear-gradient(to right, ${rampColor(0.05)}, ${rampColor(0.4)}, ${rampColor(0.7)}, ${rampColor(1)})`,
          }} />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
            <span>0</span>
            <span>{maxKreisGw.toLocaleString('de-DE', { maximumFractionDigits: 1 })} GW</span>
          </div>
        </div>

        {/* Freiflächen-Punkte-Toggle */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-500">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} className="accent-[#ea580c]" />
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.point }} />
            Freiflächen-Anlagen ({freiflaechenBis.toLocaleString('de-DE')})
          </label>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.fresh }} /> Neu im gewählten Jahr
          </span>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed">
          Die Einfärbung zeigt die installierte PV-Leistung je Landkreis (alle Anlagen, inkl. Dach und
          Balkon). Die orangen Punkte sind Freiflächen-Anlagen mit Koordinaten — nur ~4,5 % aller
          Anlagen haben Koordinaten, Dachanlagen werden daher nur über die Kreis-Einfärbung erfasst.
          Quelle: {kreise.source}, Stand {new Date(kreise.generated).toLocaleDateString('de-DE')}.
        </div>
      </div>
    </div>
  )
}
