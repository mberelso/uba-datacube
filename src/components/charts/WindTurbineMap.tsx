import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { Play, Pause } from '@phosphor-icons/react'

// Spaltenorientiertes Format aus scripts/mastr/build_wind_json.py
interface WindData {
  generated: string
  source: string
  count: number
  units: {
    lon: number[]
    lat: number[]
    year: number[]     // Inbetriebnahmejahr (bei Status 2: geplant), 0 = unbekannt
    kw: number[]
    status: number[]   // 0 in Betrieb, 1 endgültig stillgelegt, 2 in Planung
    endYear: number[]  // Stilllegungsjahr oder 0
    offshore: number[]
  }
}

const W = 560
const H = 660
const START_YEAR = 1990
const END_YEAR = new Date().getFullYear()
const YEARS_PER_SECOND = 2.2

const COLORS = {
  onshore:  '#3D5A6E',
  offshore: '#0284c7',
  fresh:    '#d97706', // im letzten Animationsjahr neu errichtet
  planned:  '#7c3aed',
  land:     '#eef2f5',
  border:   '#ffffff',
}

export function WindTurbineMap() {
  const [geoJson, setGeoJson] = useState<any>(null)
  const [data, setData] = useState<WindData | null>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [showPlanned, setShowPlanned] = useState(false)
  // Ganzzahliges Jahr für UI/Zähler — die Animation selbst läuft mit Bruchteilen im Ref
  const [year, setYear] = useState(END_YEAR)

  const yearRef = useRef<number>(END_YEAR)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const showPlannedRef = useRef(showPlanned)
  showPlannedRef.current = showPlanned

  useEffect(() => {
    fetch('/bundeslaender.geo.json').then(r => r.json()).then(setGeoJson).catch(() => setError(true))
    fetch('/wind_units.json').then(r => r.json()).then(setData).catch(() => setError(true))
  }, [])

  const projection = useMemo(
    () => geoJson ? geoMercator().fitExtent([[14, 30], [W - 14, H - 12]], geoJson) : null,
    [geoJson]
  )

  // Projizierte Punktkoordinaten + Zeichenreihenfolge einmalig vorberechnen
  const points = useMemo(() => {
    if (!projection || !data) return null
    const n = data.count
    const u = data.units
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    const r = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const p = projection([u.lon[i], u.lat[i]])
      x[i] = p ? p[0] : -99
      y[i] = p ? p[1] : -99
      r[i] = Math.min(0.9 + Math.sqrt(u.kw[i]) / 60, 2.6)
    }
    return { x, y, r }
  }, [projection, data])

  // Kumulative Statistik pro Jahr (Stilllegungen werden abgezogen),
  // getrennt nach An Land / Auf See fürs Stapeldiagramm
  const yearStats = useMemo(() => {
    if (!data) return null
    const u = data.units
    const span = END_YEAR - START_YEAR + 1
    const addOn = new Array(span).fill(0)
    const addOff = new Array(span).fill(0)
    const addMw = new Array(span).fill(0)
    for (let i = 0; i < data.count; i++) {
      if (u.status[i] === 2 || u.year[i] === 0) continue
      const a = Math.max(0, Math.min(span - 1, u.year[i] - START_YEAR))
      ;(u.offshore[i] ? addOff : addOn)[a]++
      addMw[a] += u.kw[i] / 1000
      if (u.endYear[i] > 0) {
        const e = Math.max(0, u.endYear[i] - START_YEAR)
        if (e < span) { (u.offshore[i] ? addOff : addOn)[e]--; addMw[e] -= u.kw[i] / 1000 }
      }
    }
    const cumOn: number[] = []
    const cumOff: number[] = []
    const cumCount: number[] = []
    const cumMw: number[] = []
    let on = 0, off = 0, m = 0
    for (let i = 0; i < span; i++) {
      on += addOn[i]; off += addOff[i]; m += addMw[i]
      cumOn.push(on); cumOff.push(off); cumCount.push(on + off); cumMw.push(m)
    }
    // Brutto-Zubau pro Jahr fürs Balkendiagramm (ohne Stilllegungsabzug)
    const grossCount = new Array(span).fill(0)
    for (let i = 0; i < data.count; i++) {
      if (u.status[i] === 2 || u.year[i] === 0) continue
      const a = u.year[i] - START_YEAR
      if (a >= 0 && a < span) grossCount[a]++
    }
    return { cumOn, cumOff, cumCount, cumMw, grossCount }
  }, [data])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !points || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const cur = yearRef.current
    const u = data.units
    const { x, y, r } = points

    for (let i = 0; i < data.count; i++) {
      const st = u.status[i]
      if (st === 2) {
        if (!showPlannedRef.current) continue
        ctx.globalAlpha = 0.3
        ctx.fillStyle = COLORS.planned
        ctx.fillRect(x[i] - r[i] / 2, y[i] - r[i] / 2, r[i], r[i])
        continue
      }
      if (u.year[i] === 0 || u.year[i] > cur) continue
      if (u.endYear[i] > 0 && u.endYear[i] <= cur) continue
      const age = cur - u.year[i]
      const size = r[i] * 2
      if (age < 1) {
        // frisch errichtet: kurz aufleuchten
        ctx.globalAlpha = 0.95
        ctx.fillStyle = COLORS.fresh
        const glow = size + (1 - age) * 3
        ctx.fillRect(x[i] - glow / 2, y[i] - glow / 2, glow, glow)
      } else {
        ctx.globalAlpha = 0.55
        ctx.fillStyle = u.offshore[i] ? COLORS.offshore : COLORS.onshore
        ctx.fillRect(x[i] - size / 2, y[i] - size / 2, size, size)
      }
    }
    ctx.globalAlpha = 1
  }, [points, data])

  // Animationsschleife
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      let next = yearRef.current + dt * YEARS_PER_SECOND
      if (next >= END_YEAR) {
        next = END_YEAR
        setPlaying(false)
      }
      yearRef.current = next
      const intYear = Math.floor(next)
      setYear(prev => (prev !== intYear ? intYear : prev))
      draw()
      if (next < END_YEAR) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, draw])

  // Statisches Neuzeichnen bei Slider/Toggle/Datenänderung
  useEffect(() => { draw() }, [draw, year, showPlanned])

  const handlePlay = () => {
    if (!playing && yearRef.current >= END_YEAR) {
      yearRef.current = START_YEAR
      setYear(START_YEAR)
    }
    setPlaying(p => !p)
  }

  const handleSlider = (v: number) => {
    setPlaying(false)
    yearRef.current = v
    setYear(v)
  }

  if (error) {
    return (
      <div className="py-16 text-center text-[13px] text-slate-400">
        Die Karten-Daten konnten nicht geladen werden.
      </div>
    )
  }

  if (!geoJson || !data || !points || !yearStats) {
    return (
      <div className="flex items-center justify-center text-[13px] text-slate-400" style={{ height: 500 }}>
        Karte wird geladen…
      </div>
    )
  }

  const idx = Math.max(0, Math.min(year - START_YEAR, yearStats.cumCount.length - 1))
  const pathGen = geoPath(projection!)
  const maxGross = Math.max(...yearStats.grossCount)

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,560px)_1fr]">
      {/* ── Karte ──────────────────────────────────────────────────────── */}
      <div className="relative" style={{ aspectRatio: `${W} / ${H}`, maxWidth: 560 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full">
          {geoJson.features.map((f: any) => (
            <path key={f.properties.id} d={pathGen(f) ?? ''} fill={COLORS.land} stroke={COLORS.border} strokeWidth={1.2} />
          ))}
        </svg>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />
      </div>

      {/* ── Steuerung + Statistik ──────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {/* Jahr + Zähler */}
        <div>
          <div className="text-[52px] font-extrabold tracking-tight tabular-nums leading-none" style={{ color: '#1B2B3A' }}>
            {year}
          </div>
          <div className="flex gap-8 mt-4">
            <div>
              <div className="text-[26px] font-bold tabular-nums" style={{ color: '#3D5A6E' }}>
                {yearStats.cumCount[idx].toLocaleString('de-DE')}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Anlagen in Betrieb</div>
            </div>
            <div>
              <div className="text-[26px] font-bold tabular-nums" style={{ color: '#0284c7' }}>
                {(yearStats.cumMw[idx] / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} GW
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Installierte Leistung</div>
            </div>
          </div>
        </div>

        {/* Play + Slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            aria-label={playing ? 'Pause' : 'Abspielen'}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-0 shrink-0 transition-transform hover:scale-105"
            style={{ background: '#1B2B3A', color: '#fff' }}
          >
            {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          </button>
          <input
            type="range"
            min={START_YEAR}
            max={END_YEAR}
            step={1}
            value={year}
            onChange={(e) => handleSlider(Number(e.target.value))}
            className="w-full accent-[#1B2B3A]"
            aria-label="Jahr wählen"
          />
        </div>

        {/* Zubau-Balken (klickbar) */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            Neue Anlagen pro Jahr
          </div>
          <div className="flex items-end gap-[2px] h-[72px]">
            {yearStats.grossCount.map((c, i) => {
              const y = START_YEAR + i
              return (
                <button
                  key={y}
                  onClick={() => handleSlider(y)}
                  title={`${y}: ${c.toLocaleString('de-DE')} neue Anlagen`}
                  className="flex-1 cursor-pointer border-0 p-0 rounded-t-[2px] transition-colors"
                  style={{
                    height: `${Math.max(3, (c / maxGross) * 100)}%`,
                    background: y === year ? '#d97706' : y < year ? '#3D5A6E' : '#cbd5e1',
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
            <span>{START_YEAR}</span>
            <span>{END_YEAR}</span>
          </div>
        </div>

        {/* Bestand (Stapelfläche An Land/Auf See) + installierte Leistung (Linie) */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
            Bestand gesamt &amp; installierte Leistung
          </div>
          {(() => {
            const CW = 320, CH = 96
            const span = yearStats.cumCount.length
            const maxCount = Math.max(...yearStats.cumCount)
            const maxMw = Math.max(...yearStats.cumMw)
            const xs = (i: number) => (i / (span - 1)) * CW
            const yc = (v: number) => CH - (v / maxCount) * (CH - 8)
            const ym = (v: number) => CH - (v / maxMw) * (CH - 8)
            const areaPath = (upper: number[], lower: (i: number) => number) =>
              'M' + upper.map((v, i) => `${xs(i).toFixed(1)},${yc(v).toFixed(1)}`).join('L') +
              'L' + upper.map((_, i, a) => {
                const j = a.length - 1 - i
                return `${xs(j).toFixed(1)},${lower(j).toFixed(1)}`
              }).join('L') + 'Z'
            const onshoreArea = areaPath(yearStats.cumOn, () => CH)
            const totalArea = areaPath(yearStats.cumCount, (i) => yc(yearStats.cumOn[i]))
            const mwLine = 'M' + yearStats.cumMw.map((v, i) => `${xs(i).toFixed(1)},${ym(v).toFixed(1)}`).join('L')
            const xCur = xs(idx)
            return (
              <svg
                viewBox={`0 0 ${CW} ${CH}`}
                className="w-full cursor-pointer"
                style={{ height: 96 }}
                role="img"
                aria-label="Kumulierter Anlagenbestand und installierte Leistung pro Jahr"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  const t = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
                  handleSlider(START_YEAR + Math.round(t * (span - 1)))
                }}
              >
                <path d={onshoreArea} fill={COLORS.onshore} opacity={0.35} />
                <path d={totalArea} fill={COLORS.offshore} opacity={0.45} />
                <path d={mwLine} fill="none" stroke={COLORS.fresh} strokeWidth={2} strokeLinejoin="round" />
                <line x1={xCur} y1={0} x2={xCur} y2={CH} stroke="#1B2B3A" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
                <circle cx={xCur} cy={ym(yearStats.cumMw[idx])} r={3.5} fill={COLORS.fresh} stroke="#fff" strokeWidth={1.5} />
              </svg>
            )
          })()}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.onshore, opacity: 0.5 }} />
              Anlagen an Land
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.offshore, opacity: 0.6 }} />
              Anlagen auf See
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-[2px] rounded-full" style={{ background: COLORS.fresh }} />
              Leistung (GW)
            </span>
          </div>
        </div>

        {/* Legende + Geplant-Toggle */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.onshore }} /> An Land
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.offshore }} /> Auf See
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.fresh }} /> Neu im gewählten Jahr
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPlanned}
              onChange={(e) => setShowPlanned(e.target.checked)}
              className="accent-[#7c3aed]"
            />
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.planned, opacity: 0.5 }} />
            Geplante Anlagen ({data.units.status.filter(s => s === 2).length.toLocaleString('de-DE')})
          </label>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed">
          Punktgröße ∝ Anlagenleistung. Endgültig stillgelegte Anlagen verschwinden im Jahr ihrer
          Stilllegung von der Karte. Quelle: {data.source}, Stand {new Date(data.generated).toLocaleDateString('de-DE')}.
        </div>
      </div>
    </div>
  )
}
