import { useEffect, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { ndviColor, NDVI_LEGEND_GRADIENT } from './ndviColor'

interface ChoroData {
  level: string
  source: string
  resolution_m: number
  updated: string
  months: string[]
  values: Record<string, Record<string, number>>
}

interface Tip { name: string; value: number | null; x: number; y: number }

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function monthLabel(ym: string) {
  const M = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
  const [y, m] = ym.split('-')
  return `${M[+m - 1]} ${y}`
}

export function NdviChoropleth() {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null)
  const [data, setData] = useState<ChoroData | null>(null)
  const [idx, setIdx] = useState(0)
  const [tip, setTip] = useState<Tip | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetch(`${BASE}/bundeslaender.geo.json`).then(r => r.json()).then(setGeo).catch(() => {})
    fetch(`${BASE}/data/vegetation/ndvi_bundeslaender.json`)
      .then(r => r.json())
      .then((d: ChoroData) => { setData(d); setIdx(d.months.length - 1) })
      .catch(() => {})
  }, [])

  const projection = useMemo(
    () => geo ? geoMercator().fitSize([360, 440], geo) : null, [geo])
  const pathGen = useMemo(() => projection ? geoPath(projection) : null, [projection])

  if (!geo || !pathGen || !data) {
    return (
      <div style={{ height: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        {!data ? 'Bundesland-Daten werden geladen … (erst nach erstem Daten-Lauf vorhanden)' : 'Karte wird geladen…'}
      </div>
    )
  }

  const month = data.months[idx]
  const vals = Object.entries(data.values).map(([, v]) => v[month]).filter((x): x is number => x != null)
  const lo = vals.length ? Math.min(...vals) : 0
  const hi = vals.length ? Math.max(...vals) : 1

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Monats-Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1B2B3A', minWidth: 96 }}>
          {monthLabel(month)}
        </span>
        <input
          type="range" min={0} max={data.months.length - 1} step={1} value={idx}
          onChange={e => setIdx(+e.target.value)}
          style={{ flex: 1, accentColor: '#16a34a', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,340px) 1fr', gap: 18, alignItems: 'start' }}
        className="choro-grid">
        {/* Karte */}
        <svg
          ref={svgRef}
          viewBox="0 0 360 440"
          style={{ width: '100%', maxWidth: 380, display: 'block' }}
          onMouseLeave={() => setTip(null)}
        >
          {geo.features.map((f) => {
            const id = String(f.properties?.id ?? '')
            const name = String(f.properties?.name ?? '')
            const v = data.values[id]?.[month] ?? null
            return (
              <path
                key={id}
                d={pathGen(f) ?? ''}
                fill={ndviColor(v)}
                stroke="#fff"
                strokeWidth={1.2}
                style={{ cursor: 'pointer' }}
                onMouseMove={e => {
                  const r = svgRef.current!.getBoundingClientRect()
                  setTip({ name, value: v, x: (e.clientX - r.left) / r.width * 360, y: (e.clientY - r.top) / r.height * 440 })
                }}
              />
            )
          })}
        </svg>

        {/* Seitenpanel: Legende + Ranking */}
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>NDVI {monthLabel(month)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748b', marginBottom: 16 }}>
            <span>gestresst</span>
            <div style={{ height: 9, flex: 1, borderRadius: 3, background: NDVI_LEGEND_GRADIENT }} />
            <span>gesund</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rangliste
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {geo.features
              .map((f) => ({
                name: String(f.properties?.name ?? ''),
                v: (data.values[String(f.properties?.id ?? '')]?.[month] ?? null) as number | null,
              }))
              .sort((a, b) => (b.v ?? -1) - (a.v ?? -1))
              .map((row) => {
                const t = hi > lo && row.v != null ? (row.v - lo) / (hi - lo) : 0
                return (
                  <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 130, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span>
                    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${t * 100}%`, height: '100%', background: ndviColor(row.v) }} />
                    </div>
                    <span style={{ width: 38, textAlign: 'right', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {row.v != null ? row.v.toFixed(2).replace('.', ',') : '—'}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {tip && (
        <div style={{
          position: 'absolute', left: `${(tip.x / 360) * 100}%`, top: `${(tip.y / 440) * 100}%`,
          transform: 'translate(-50%, -120%)', background: '#1e293b', color: '#f8fafc',
          borderRadius: 8, padding: '7px 11px', fontSize: 12, pointerEvents: 'none',
          whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tip.name}</div>
          <div>NDVI <span style={{ color: '#86efac', fontWeight: 700 }}>{tip.value != null ? tip.value.toFixed(2).replace('.', ',') : '—'}</span></div>
        </div>
      )}

      <style>{`@media (max-width: 720px){ .choro-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
