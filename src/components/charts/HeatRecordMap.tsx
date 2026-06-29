import { useMemo, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { HeatExportModal } from './HeatExportModal'
import { NORDIC, fmtDateLong, fmtMd, tempColor, projectStates, type ThreshData, type StatesGeo } from './heatShared'

const VB_W = 520
const VB_H = 640

export function HeatRecordMap({ data, geo }: { data: ThreshData; geo: StatesGeo }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [exportMode, setExportMode] = useState<string | null>(null)

  const { states } = useMemo(() => projectStates(geo, VB_W, VB_H, 6), [geo])
  const recByCode = useMemo(
    () => Object.fromEntries(data.states.map(s => [s.code, s])),
    [data]
  )
  const sel = selected ? recByCode[selected] : null
  const provYear = data.provisionalYear
  const isProv = (iso?: string) => !!iso && iso.slice(0, 4) === String(provYear)

  // Legenden-Stützpunkte
  const legendStops = [37, 38, 39, 40, 41, 42]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }} className="heat-record-map-grid">
        {/* Karte */}
        <div>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {states.map(s => {
              const rec = recByCode[s.code]?.record.temp
              const active = selected === s.code
              return (
                <path
                  key={s.code}
                  d={s.d}
                  fill={rec != null ? tempColor(rec) : '#e2e8f0'}
                  stroke={active ? NORDIC.navy : '#fff'}
                  strokeWidth={active ? 2.5 : 0.8}
                  style={{ cursor: 'pointer', transition: 'opacity .15s', opacity: selected && !active ? 0.55 : 1 }}
                  onClick={() => setSelected(active ? null : s.code)}
                >
                  <title>{`${s.name}: ${recByCode[s.code]?.record.temp.toLocaleString('de-DE')} °C`}</title>
                </path>
              )
            })}
          </svg>

          {/* Legende */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: NORDIC.fog }}>Allzeit-Rekord:</span>
            {legendStops.map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 14, height: 14, borderRadius: 3, background: tempColor(t), display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: NORDIC.stone }}>{t}°</span>
              </span>
            ))}
          </div>
        </div>

        {/* Detail-Panel */}
        <div>
          {sel ? (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: NORDIC.navy }}>{sel.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: NORDIC.red, letterSpacing: '-1px' }}>
                  {sel.record.temp.toLocaleString('de-DE')} °C
                </span>
                {isProv(sel.record.date) && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: NORDIC.amber, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 8px' }}>vorläufig</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: NORDIC.fog, marginTop: 4, lineHeight: 1.4 }}>
                Gemessen am {fmtDateLong(sel.record.date)} in {sel.record.station}.
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {['30', '35', '40'].map(T => {
                  const st = sel.stats[T]
                  return (
                    <div key={T} style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: NORDIC.fog, fontWeight: 700 }}>erstmals {T} °C</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: st?.earliestMd ? NORDIC.navy : NORDIC.fog }}>
                        {st?.earliestMd ? fmtMd(st.earliestMd) : 'nie'}
                      </div>
                      {st?.earliestDate && <div style={{ fontSize: 10, color: NORDIC.fog }}>{st.earliestDate.slice(0, 4)}</div>}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => setExportMode(sel.code)}
                style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: NORDIC.red, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <DownloadSimple size={16} weight="bold" /> {sel.name} als Bild teilen
              </button>
            </div>
          ) : (
            <div style={{ border: '1px dashed #e2e8f0', borderRadius: 14, padding: '24px 20px', color: NORDIC.stone, fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ color: NORDIC.navy }}>Bundesland anklicken</strong> für Rekord, Schwellen-Termine und ein teilbares Bild — oder direkt ganz Deutschland exportieren:
              <button
                onClick={() => setExportMode('DE')}
                style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: NORDIC.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <DownloadSimple size={16} weight="bold" /> Ganz Deutschland als Bild
              </button>
            </div>
          )}

          {sel && (
            <button
              onClick={() => setExportMode('DE')}
              style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', background: 'transparent', color: NORDIC.navy, border: `1px solid ${NORDIC.navy}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <DownloadSimple size={15} weight="bold" /> Stattdessen ganz Deutschland
            </button>
          )}
        </div>
      </div>

      <style>{`@media (max-width: 720px){ .heat-record-map-grid{ grid-template-columns: 1fr !important; } }`}</style>

      {exportMode && (
        <HeatExportModal data={data} geo={geo} mode={exportMode} onClose={() => setExportMode(null)} />
      )}
    </div>
  )
}
