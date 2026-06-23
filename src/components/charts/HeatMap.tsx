import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { Play, Pause } from '@phosphor-icons/react'

// Datenformat aus scripts/dwd/build_heat_json.py
type Metric = 'hotDays' | 'summerDays'
interface KreisRec { name: string; hotDays: (number | null)[]; summerDays: (number | null)[] }
interface HeatData {
  generated: string
  source: string
  years: number[]
  metrics: Record<Metric, string>
  kreise: Record<string, KreisRec>
}
interface Summary { years: number[]; hotDays: number[]; summerDays: number[] }

const W = 560
const H = 720
const YEARS_PER_SECOND = 6
const METRIC_LABEL: Record<Metric, string> = {
  hotDays: 'Heiße Tage',
  summerDays: 'Sommertage',
}
const METRIC_SUB: Record<Metric, string> = {
  hotDays: 'Tmax ≥ 30 °C',
  summerDays: 'Tmax ≥ 25 °C',
}

const COLORS = { land: '#eef0f2', border: '#ffffff', navy: '#1B2B3A', accent: '#dc2626' }

// Sequentielle Hitze-Rampe (kühl-hell → tiefrot)
const RAMP: [number, [number, number, number]][] = [
  [0.0, [255, 247, 222]],
  [0.2, [254, 224, 144]],
  [0.4, [253, 174, 97]],
  [0.6, [244, 109, 67]],
  [0.8, [215, 48, 39]],
  [1.0, [120, 15, 15]],
]
function rampColor(t: number): string {
  t = Math.max(0, Math.min(1, t))
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, c0] = RAMP[i - 1]
      const [t1, c1] = RAMP[i]
      const f = (t - t0) / (t1 - t0)
      return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * f)},${Math.round(c0[1] + (c1[1] - c0[1]) * f)},${Math.round(c0[2] + (c1[2] - c0[2]) * f)})`
    }
  }
  return 'rgb(120,15,15)'
}

export function HeatMap() {
  const [geoJson, setGeoJson] = useState<any>(null)
  const [data, setData] = useState<HeatData | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [metric, setMetric] = useState<Metric>('hotDays')
  const [hover, setHover] = useState<{ name: string; value: number | null } | null>(null)
  const [year, setYear] = useState(2025)

  const yearRef = useRef<number>(2025)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    fetch('/kreise.geo.json').then(r => r.json()).then(setGeoJson).catch(() => setError(true))
    fetch('/heat_kreise.json').then(r => r.json()).then(setData).catch(() => setError(true))
    fetch('/heat_summary.json').then(r => r.json()).then(setSummary).catch(() => setError(true))
  }, [])

  const projection = useMemo(
    () => geoJson ? geoMercator().fitExtent([[14, 12], [W - 14, H - 12]], geoJson) : null,
    [geoJson]
  )

  const startYear = data?.years[0] ?? 1951
  const endYear = data?.years[data.years.length - 1] ?? 2025

  // Feste Farbskala je Metrik = 99. Perzentil über alle Kreise/Jahre.
  // (Nicht das Maximum: das eine Extremjahr 2003 würde sonst alles andere
  // zusammenstauchen.) So bleibt das Nachdunkeln über die Zeit sichtbar.
  const maxByMetric = useMemo(() => {
    const out: Record<Metric, number> = { hotDays: 1, summerDays: 1 }
    if (!data) return out
    for (const m of ['hotDays', 'summerDays'] as Metric[]) {
      const vals: number[] = []
      for (const k of Object.values(data.kreise)) {
        for (const v of k[m]) if (v != null) vals.push(v)
      }
      vals.sort((a, b) => a - b)
      out[m] = vals[Math.floor(vals.length * 0.99)] || 1
    }
    return out
  }, [data])

  const yearIndex = useCallback(
    (y: number) => data ? Math.max(0, Math.min(data.years.length - 1, y - data.years[0])) : 0,
    [data]
  )

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      let next = yearRef.current + dt * YEARS_PER_SECOND
      if (next >= endYear) { next = endYear; setPlaying(false) }
      yearRef.current = next
      const intYear = Math.floor(next)
      setYear(prev => (prev !== intYear ? intYear : prev))
      if (next < endYear) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, endYear])

  const handlePlay = () => {
    if (!playing && yearRef.current >= endYear) { yearRef.current = startYear; setYear(startYear) }
    setPlaying(p => !p)
  }
  const handleSlider = (v: number) => { setPlaying(false); yearRef.current = v; setYear(v) }

  if (error) {
    return <div className="py-16 text-center text-[13px] text-slate-400">Die Karten-Daten konnten nicht geladen werden.</div>
  }
  if (!geoJson || !data || !summary || !projection) {
    return <div className="flex items-center justify-center text-[13px] text-slate-400" style={{ height: 500 }}>Karte wird geladen…</div>
  }

  const idx = yearIndex(year)
  const pathGen = geoPath(projection)
  const maxScale = maxByMetric[metric]
  const natSeries = summary[metric]
  const natVal = natSeries[Math.max(0, Math.min(natSeries.length - 1, year - summary.years[0]))]
  const maxNat = Math.max(...natSeries)

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr]">
      {/* ── Karte ──────────────────────────────────────────────────────── */}
      <div className="relative" style={{ aspectRatio: `${W} / ${H}`, maxWidth: 560 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
          {geoJson.features.map((f: any, fi: number) => {
            const k = data.kreise[f.properties.ags]
            const v = k ? k[metric][idx] : null
            const fill = v != null ? rampColor(v / maxScale) : COLORS.land
            return (
              <path
                key={`${f.properties.ags}-${fi}`}
                d={pathGen(f) ?? ''}
                fill={fill}
                stroke={COLORS.border}
                strokeWidth={0.4}
                onMouseEnter={() => setHover(k ? { name: k.name, value: k[metric][idx] } : null)}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
        </svg>
        {hover && (
          <div className="absolute top-2 left-2 bg-white/95 rounded-lg shadow-md px-3 py-2 pointer-events-none">
            <div className="text-[12px] font-bold text-[#1B2B3A]">{hover.name}</div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {hover.value != null ? `${hover.value.toLocaleString('de-DE', { maximumFractionDigits: 1 })} ${METRIC_LABEL[metric]}` : 'keine Daten'}
            </div>
          </div>
        )}
      </div>

      {/* ── Steuerung + Statistik ──────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {/* Metrik-Umschalter */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 self-start">
          {(Object.keys(METRIC_LABEL) as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-md cursor-pointer border-0 transition-all"
              style={{
                background: metric === m ? '#fff' : 'transparent',
                color: metric === m ? '#1B2B3A' : '#94a3b8',
                boxShadow: metric === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {METRIC_LABEL[m]} <span className="text-[10px] opacity-60">({METRIC_SUB[m]})</span>
            </button>
          ))}
        </div>

        <div>
          <div className="text-[52px] font-extrabold tracking-tight tabular-nums leading-none" style={{ color: COLORS.navy }}>
            {year}
          </div>
          <div className="flex gap-8 mt-4">
            <div>
              <div className="text-[26px] font-bold tabular-nums" style={{ color: COLORS.accent }}>
                {natVal?.toLocaleString('de-DE', { maximumFractionDigits: 1 })}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                {METRIC_LABEL[metric]} · Ø Deutschland
              </div>
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
            type="range" min={startYear} max={endYear} step={1} value={year}
            onChange={(e) => handleSlider(Number(e.target.value))}
            className="w-full accent-[#dc2626]" aria-label="Jahr wählen"
          />
        </div>

        {/* Nationaler Verlauf pro Jahr (klickbar) */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            {METRIC_LABEL[metric]} pro Jahr · Deutschland-Mittel
          </div>
          <div className="flex items-end gap-[1px] h-[72px]">
            {summary.years.map((y, i) => {
              const c = natSeries[i]
              return (
                <button
                  key={y}
                  onClick={() => handleSlider(y)}
                  title={`${y}: ${c.toLocaleString('de-DE', { maximumFractionDigits: 1 })} ${METRIC_LABEL[metric]}`}
                  className="flex-1 cursor-pointer border-0 p-0 rounded-t-[1px] transition-colors"
                  style={{
                    height: `${Math.max(2, (c / maxNat) * 100)}%`,
                    background: y === year ? COLORS.accent : y < year ? rampColor(c / maxScale) : '#e2e8f0',
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
            <span>{startYear}</span>
            <span>{endYear}</span>
          </div>
        </div>

        {/* Farbskala */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            {METRIC_LABEL[metric]} je Landkreis
          </div>
          <div className="h-2.5 rounded-full" style={{
            background: `linear-gradient(to right, ${rampColor(0.02)}, ${rampColor(0.4)}, ${rampColor(0.7)}, ${rampColor(1)})`,
          }} />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
            <span>0</span>
            <span>{Math.round(maxScale)} Tage</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed">
          Die Einfärbung zeigt die Zahl der {METRIC_LABEL[metric].toLowerCase()} ({METRIC_SUB[metric]}) je Landkreis,
          aggregiert aus dem 1-km-Raster des DWD. Die Farbskala ist über alle Jahre fixiert — beim Abspielen
          dunkelt die Karte sichtbar nach. Quelle: {data.source}, Stand {new Date(data.generated).toLocaleDateString('de-DE')}.
        </div>
      </div>
    </div>
  )
}
