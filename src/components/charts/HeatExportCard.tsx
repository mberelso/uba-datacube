import { CubeMark } from '../CubeMark'
import { fmtDate, fmtDateLong, fmtMd, tempColor, projectStates, type ThreshData, type StateRec, type StatesGeo } from './heatShared'

const W = 1080
const H = 1350

// Insta-Export-Karte für Hitzerekorde. mode = 'DE' (ganz Deutschland) oder ein
// Bundesland-Code. Wird off-screen in voller Größe gerendert und via html-to-image
// als PNG exportiert.
export function HeatExportCard({ data, geo, mode }: {
  data: ThreshData
  geo: StatesGeo
  mode: string                 // 'DE' oder Bundesland-Code (z. B. 'BY')
}) {
  const isDE = mode === 'DE'
  const sel: StateRec | undefined = isDE ? undefined : data.states.find(s => s.code === mode)
  const provYear = data.provisionalYear
  const isProv = (iso?: string) => !!iso && iso.slice(0, 4) === String(provYear)

  const mapW = W - 160
  const mapH = 560
  const { states, project } = projectStates(geo, mapW, mapH, 6)
  const recOf = (code: string) => data.states.find(s => s.code === code)?.record.temp
  // Position der Rekord-Messstelle (falls Koordinaten vorhanden)
  const stationXY = !isDE && sel?.record.lon != null && sel.record.lat != null
    ? project(sel.record.lon, sel.record.lat) : null

  // Headline-Rekord (DE = National, sonst Bundesland)
  const rec = isDE ? data.national : sel?.record
  const recName = isDE ? 'Deutschland' : sel?.name ?? ''
  // Bundesland-Name des National-Rekords (für den Deutschland-Satz)
  const natStateName = data.states.find(s => s.code === data.national.state)?.name ?? data.national.state

  // 40-°C-Statistik fürs Deutschland-Card
  const over40 = data.states.filter(s => s.stats['40']?.earliestMd).length

  const accent = '#dc2626'
  const grad = 'linear-gradient(160deg, #1a0f0a 0%, #2a1410 40%, #0d1a24 100%)'

  return (
    <div style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      fontFamily: "'Geist', system-ui, sans-serif", background: grad, flexShrink: 0,
      color: '#fff',
    }}>
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: '70px 80px 64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <CubeMark size={28} color="rgba(255,255,255,0.92)" accent={accent} />
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.5px' }}>Umweltpuls</span>
          <div style={{
            marginLeft: 'auto', background: accent, color: '#fff', fontSize: 22, fontWeight: 700,
            letterSpacing: '2.5px', padding: '7px 22px', borderRadius: 8,
          }}>HITZE</div>
        </div>

        {/* Titel */}
        <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-1.2px', marginTop: 40, lineHeight: 1.1 }}>
          {isDE ? 'Hitzerekorde in Deutschland' : `Hitzerekord ${recName}`}
        </div>

        {/* Rekord-Zahl */}
        {rec && (
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 150, fontWeight: 800, lineHeight: 1, letterSpacing: '-6px', color: '#fff' }}>
              {rec.temp.toLocaleString('de-DE')} °C
            </span>
            {isProv(rec.date) && (
              <span style={{ fontSize: 26, fontWeight: 700, color: '#0d1a24', background: '#fbbf24', borderRadius: 999, padding: '4px 18px' }}>
                vorläufig
              </span>
            )}
          </div>
        )}
        {rec && (
          <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 1.35 }}>
            {isDE
              ? `So heiß war es in Deutschland noch nie — gemessen am ${fmtDateLong(rec.date)} in ${rec.station} (${natStateName}).`
              : `Gemessen am ${fmtDateLong(rec.date)} in ${rec.station}.`}
          </div>
        )}

        {/* Karte */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
          <svg width={mapW} height={mapH} viewBox={`0 0 ${mapW} ${mapH}`} style={{ display: 'block' }}>
            {states.map(s => {
              const r = recOf(s.code)
              const highlight = isDE || s.code === mode
              const fill = highlight && r != null ? tempColor(r) : 'rgba(255,255,255,0.07)'
              return (
                <path key={s.code} d={s.d} fill={fill}
                  stroke={s.code === mode ? '#fff' : 'rgba(13,26,36,0.55)'}
                  strokeWidth={s.code === mode ? 3 : 1} />
              )
            })}
            {/* Marker am echten Standort der Rekord-Messstelle */}
            {stationXY && (
              <g>
                <circle cx={stationXY[0]} cy={stationXY[1]} r={16} fill="rgba(255,255,255,0.25)" />
                <circle cx={stationXY[0]} cy={stationXY[1]} r={7} fill="#fff" stroke="#dc2626" strokeWidth={3} />
              </g>
            )}
          </svg>
          {stationXY && (
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '2px solid #dc2626', display: 'inline-block' }} />
              Ort der Rekordmessung: {sel?.record.station}
            </div>
          )}
        </div>

        {/* Fakten */}
        {isDE ? (
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Fact big={`${over40}/16`} label="Länder schon über 40 °C" accent={accent} />
            <Fact big={`${data.thresholds[0]}–${data.thresholds[data.thresholds.length - 1]} °C`} label="Schwellen ausgewertet" accent={accent} />
            <Fact big="seit 2003" label="erste 40-°C-Marken" accent={accent} />
          </div>
        ) : sel ? (
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            {['30', '35', '40'].map(T => {
              const st = sel.stats[T]
              const year = st?.earliestDate?.slice(0, 4)
              return (
                <div key={T} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 16, padding: '16px 20px' }}>
                  <div style={{ fontSize: 21, color: 'rgba(255,255,255,0.5)' }}>erstmals {T} °C</div>
                  <div style={{ fontSize: 62, fontWeight: 800, color: year ? '#fff' : 'rgba(255,255,255,0.4)', letterSpacing: '-2px', lineHeight: 1.05, marginTop: 2 }}>
                    {year ?? 'nie'}
                  </div>
                  <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                    {st?.earliestMd ? `am ${fmtMd(st.earliestMd)}` : ' '}
                  </div>
                  <div style={{ width: 28, height: 3, background: accent, borderRadius: 2, marginTop: 10 }} />
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Footer */}
        <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)' }}>
            Quelle: DWD · Tagesmaxima{data.dataThrough ? ` · Stand ${fmtDate(data.dataThrough)}` : ''}
          </span>
          <span style={{ fontSize: 28, fontWeight: 700, color: accent, letterSpacing: '-0.5px' }}>
            umweltpuls.de/hitze →
          </span>
        </div>
      </div>
    </div>
  )
}

function Fact({ big, label, accent, muted }: { big: string; label: string; accent: string; muted?: boolean }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 16, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: muted ? 'rgba(255,255,255,0.4)' : '#fff', letterSpacing: '-1px' }}>{big}</div>
      <div style={{ fontSize: 21, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.25 }}>{label}</div>
      <div style={{ width: 28, height: 3, background: accent, borderRadius: 2, marginTop: 10 }} />
    </div>
  )
}
