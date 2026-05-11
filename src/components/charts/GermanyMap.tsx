import { useEffect, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'

// Static data computed from UBA DF_AREA_SOIL_LAND_ECOSYSTEMS_AREA (2016–2022)
// Outlier years excluded: TH 2017/18, MV 2017, BB 2021/22
const SETTLEMENT_DATA: Record<string, {
  name: string; avgHaPerDay: number; km2Start: number; km2End: number
}> = {
  BB: { name: 'Brandenburg',           avgHaPerDay: 5.06, km2Start: 2029.4, km2End: 1983.1 },
  BE: { name: 'Berlin',                avgHaPerDay: 0.28, km2Start:  491.2, km2End:  497.3 },
  BW: { name: 'Baden-Württemberg',     avgHaPerDay: 4.87, km2Start: 3265.5, km2End: 3372.1 },
  BY: { name: 'Bayern',                avgHaPerDay: 8.93, km2Start: 5280.2, km2End: 5475.8 },
  HB: { name: 'Bremen',                avgHaPerDay: 0.17, km2Start:  185.0, km2End:  187.2 },
  HE: { name: 'Hessen',                avgHaPerDay: 2.31, km2Start: 1947.4, km2End: 1998.0 },
  HH: { name: 'Hamburg',               avgHaPerDay: 0.06, km2Start:  351.2, km2End:  347.8 },
  MV: { name: 'Mecklenburg-Vorpommern',avgHaPerDay: 1.25, km2Start: 1320.8, km2End: 1294.6 },
  NI: { name: 'Niedersachsen',         avgHaPerDay: 3.38, km2Start: 4447.9, km2End: 4521.9 },
  NW: { name: 'Nordrhein-Westfalen',   avgHaPerDay: 5.88, km2Start: 5602.2, km2End: 5731.1 },
  RP: { name: 'Rheinland-Pfalz',       avgHaPerDay: 2.35, km2Start: 1682.0, km2End: 1733.4 },
  SH: { name: 'Schleswig-Holstein',    avgHaPerDay: 3.11, km2Start: 1401.1, km2End: 1469.2 },
  SL: { name: 'Saarland',              avgHaPerDay: 0.39, km2Start:  392.6, km2End:  401.2 },
  SN: { name: 'Sachsen',               avgHaPerDay: 5.45, km2Start: 1845.4, km2End: 1964.8 },
  ST: { name: 'Sachsen-Anhalt',        avgHaPerDay: 0.55, km2Start: 1569.5, km2End: 1572.0 },
  TH: { name: 'Thüringen',             avgHaPerDay: 0.92, km2Start:  958.6, km2End: 1251.3 },
}

const GEO_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.keys(SETTLEMENT_DATA).map(k => [`DE-${k}`, k])
)

const MAX_GROWTH = Math.max(...Object.values(SETTLEMENT_DATA).map(d => d.avgHaPerDay))

function heatColor(t: number) {
  const g = Math.round(255 - t * 185)
  const b = Math.round(255 - t * 255)
  return `rgb(255,${g},${b})`
}

interface TooltipInfo { code: string; svgX: number; svgY: number }

export function GermanyMap() {
  const [geoJson, setGeoJson] = useState<any>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetch('/bundeslaender.geo.json').then(r => r.json()).then(setGeoJson).catch(() => {})
  }, [])

  const projection = useMemo(
    () => geoJson ? geoMercator().fitSize([340, 420], geoJson) : null,
    [geoJson]
  )
  const pathGen = useMemo(() => projection ? geoPath(projection) : null, [projection])

  if (!geoJson || !pathGen) {
    return (
      <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
        Karte wird geladen…
      </div>
    )
  }

  const tip = tooltip ? SETTLEMENT_DATA[tooltip.code] : null

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
        <span style={{ whiteSpace: 'nowrap' }}>Ø Zuwachs Siedlungsfläche (inkl. Grün)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>gering</span>
          <div style={{
            width: 100, height: 10, borderRadius: 3,
            background: 'linear-gradient(to right, #fff5f5, #fbbf24, #dc2626)',
            border: '1px solid #e2e8f0',
          }} />
          <span>hoch</span>
        </div>
        <span style={{ color: '#94a3b8' }}>· Ø 2016–2022, Ausreißer bereinigt</span>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 340 420"
        style={{ width: '100%', maxWidth: 400, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {geoJson.features.map((feature: any) => {
          const geoId: string = feature.properties.id
          const code = GEO_TO_CODE[geoId]
          const d = code ? SETTLEMENT_DATA[code] : undefined
          const t = d ? Math.min(d.avgHaPerDay / MAX_GROWTH, 1) : 0
          const fill = d ? heatColor(t) : '#f1f5f9'
          const pathD = pathGen(feature) ?? ''
          return (
            <path
              key={geoId}
              d={pathD}
              fill={fill}
              stroke="#fff"
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => {
                if (!code) return
                const rect = svgRef.current!.getBoundingClientRect()
                setTooltip({
                  code,
                  svgX: (e.clientX - rect.left) / rect.width * 340,
                  svgY: (e.clientY - rect.top) / rect.height * 420,
                })
              }}
            />
          )
        })}
      </svg>

      {tooltip && tip && (
        <div style={{
          position: 'absolute',
          left: `${(tooltip.svgX / 340) * 100}%`,
          top: `${(tooltip.svgY / 420) * 100}%`,
          transform: 'translate(-50%, -115%)',
          background: '#1e293b',
          color: '#f8fafc',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{tip.name}</div>
          <div>
            Ø <span style={{ color: '#fbbf24', fontWeight: 700 }}>{tip.avgHaPerDay.toFixed(2)} ha/Tag</span> Neubau
          </div>
          <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>
            {tip.km2Start.toFixed(0)} → {tip.km2End.toFixed(0)} km² Siedlung (2016–2022)
          </div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 1 }}>
            inkl. Grünanlagen, Parks, Freizeit
          </div>
        </div>
      )}
    </div>
  )
}
