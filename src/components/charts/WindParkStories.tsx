import { useEffect, useRef, useState, useCallback } from 'react'

// Metadaten aus scripts/satellite/fetch_park_images.py
interface Park {
  slug: string
  name: string
  state: string
  year: number
  units: number
  mw: number
  type: 'neubau' | 'repowering'
  oldUnits: number
  phases: { vorher: number; bauphase: number; betrieb: number }
}

type Phase = 'bauphase' | 'betrieb'

const PHASE_LABEL: Record<Phase, string> = { bauphase: 'Bauphase', betrieb: 'In Betrieb' }

/** Vorher/Nachher-Vergleich mit ziehbarer Trennlinie. */
function CompareSlider({ before, after, beforeYear, afterYear }: {
  before: string; after: string; beforeYear: number; afterYear: number
}) {
  const [pos, setPos] = useState(50) // Prozent der Trennlinie
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.min(Math.max(((clientX - r.left) / r.width) * 100, 2), 98))
  }, [])

  useEffect(() => {
    const move = (e: PointerEvent) => { if (dragging.current) updateFromClientX(e.clientX) }
    const up = () => { dragging.current = false }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [updateFromClientX])

  return (
    <div
      ref={ref}
      className="relative select-none overflow-hidden rounded-xl cursor-ew-resize"
      style={{ aspectRatio: '1 / 1', touchAction: 'none' }}
      onPointerDown={(e) => { dragging.current = true; updateFromClientX(e.clientX) }}
    >
      {/* Nachher als Basis */}
      <img src={after} alt={`Satellitenbild ${afterYear}`} loading="lazy"
        className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      {/* Vorher, auf linken Teil geclippt */}
      <img src={before} alt={`Satellitenbild ${beforeYear}`} loading="lazy"
        className="absolute inset-0 w-full h-full object-cover" draggable={false}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />

      {/* Trennlinie + Griff */}
      <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-0 bottom-0 -ml-px w-[2px] bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)]" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M4 1 L1 5 L4 9 M10 1 L13 5 L10 9" stroke="#1B2B3A" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Jahres-Labels */}
      <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-black/45 rounded px-1.5 py-0.5 pointer-events-none">
        {beforeYear}
      </span>
      <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-black/45 rounded px-1.5 py-0.5 pointer-events-none">
        {afterYear}
      </span>
    </div>
  )
}

function ParkCard({ park }: { park: Park }) {
  const [phase, setPhase] = useState<Phase>('betrieb')
  const base = `/wind_parks/${park.slug}`

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[14px] font-bold text-[#1B2B3A] leading-tight">{park.name}</div>
          <div className="text-[11px] text-slate-400">{park.state}</div>
        </div>
        <span
          className="shrink-0 text-[10px] font-semibold rounded-md px-2 py-0.5 mt-0.5"
          style={park.type === 'repowering'
            ? { color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe' }
            : { color: '#4A6741', background: '#f2f7f0', border: '1px solid #d4e3cf' }}
        >
          {park.type === 'repowering' ? 'Repowering' : 'Neubau'}
        </span>
      </div>

      <CompareSlider
        before={`${base}_vorher.png`}
        after={`${base}_${phase}.png`}
        beforeYear={park.phases.vorher}
        afterYear={park.phases[phase]}
      />

      {/* Phasen-Umschalter rechts */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 self-start">
        {(Object.keys(PHASE_LABEL) as Phase[]).map(p => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-md cursor-pointer border-0 transition-all"
            style={{
              background: phase === p ? '#fff' : 'transparent',
              color: phase === p ? '#1B2B3A' : '#94a3b8',
              boxShadow: phase === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {PHASE_LABEL[p]} ({park.phases[p]})
          </button>
        ))}
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed m-0">
        {park.units} Anlagen · {park.mw.toLocaleString('de-DE')} MW · in Betrieb seit {park.year}.{' '}
        {park.type === 'repowering'
          ? `Hier standen zuvor ${park.oldUnits} ältere Anlagen, die für den leistungsstärkeren Park zurückgebaut wurden.`
          : 'Errichtet auf zuvor unbebauter Fläche — gut erkennbar an den neuen Zuwegungen und Kranstellflächen.'}
      </p>
    </div>
  )
}

export function WindParkStories() {
  const [parks, setParks] = useState<Park[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/wind_parks/parks.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setParks(d.parks))
      .catch(() => setError(true))
  }, [])

  if (error || (parks && parks.length === 0)) return null
  if (!parks) return null

  return (
    <div className="mt-10">
      <div className="mb-1 flex items-center gap-2">
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#7A9BAD' }}>
          SATELLITENPERSPEKTIVE
        </span>
      </div>
      <h2 className="text-[22px] font-extrabold text-[#1B2B3A] tracking-tight m-0 mb-2">
        Vom Acker zum Windpark
      </h2>
      <p className="text-[13px] text-slate-500 leading-relaxed max-w-[720px] mb-6">
        Sechs Windparks aus der Karte, gesehen mit den Augen des Copernicus-Satelliten Sentinel-2:
        Ziehe den Regler, um dieselbe Landschaft vor dem Bau und danach zu vergleichen. Die hellen
        Punkte sind Kranstellflächen und Fundamente, die feinen Linien neue Zuwegungen. Jedes Bild
        ist ein wolkenfreier Sommer-Median (Echtfarben, 10 m Auflösung).
      </p>
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map(p => <ParkCard key={p.slug} park={p} />)}
      </div>
      <p className="text-[11px] text-slate-400 mt-4">
        Bilddaten: Copernicus Sentinel-2 L2A (ESA), verarbeitet über den Copernicus Data Space ·
        Anlagendaten: Marktstammdatenregister (BNetzA)
      </p>
    </div>
  )
}
