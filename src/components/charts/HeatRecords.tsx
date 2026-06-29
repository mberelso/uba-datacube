import { useEffect, useMemo, useState } from 'react'

// Datenformat aus scripts/dwd/build_heat_thresholds.py
interface ThreshStat {
  earliestMd?: string       // "MM-DD" — frühester Kalendertag je gemessen
  earliestDate?: string     // "YYYY-MM-DD"
  firstYear?: number
  yearsReached?: number
  daysTotal?: number
}
interface StateRec {
  code: string
  name: string
  record: { temp: number; date: string; station: string }
  stats: Record<string, ThreshStat>
}
interface ThreshData {
  generated: string
  dataThrough?: string       // letzter erfasster Messtag "YYYY-MM-DD"
  provisionalYear?: number   // laufendes Jahr (recent-Daten, vorläufig)
  source: string
  thresholds: number[]
  national: { temp: number; date: string; station: string; state: string }
  states: StateRec[]
}

const NORDIC = { navy: '#1B2B3A', red: '#dc2626', amber: '#f59e0b', stone: '#8C8880', fog: '#94a3b8' }
const MONTHS = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function fmtMd(md?: string): string {
  if (!md) return '–'
  const [m, d] = md.split('-').map(Number)
  return `${d}. ${MONTHS[m - 1]}`
}
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// Farbskala nach Rekordtemperatur (heller → tiefrot), Domäne ~36–42 °C
function tempColor(t: number): string {
  const f = Math.max(0, Math.min(1, (t - 36) / 6))
  const stops: [number, [number, number, number]][] = [
    [0, [254, 224, 144]], [0.5, [244, 109, 67]], [1, [150, 20, 20]],
  ]
  for (let i = 1; i < stops.length; i++) {
    if (f <= stops[i][0]) {
      const [f0, c0] = stops[i - 1], [f1, c1] = stops[i]
      const k = (f - f0) / (f1 - f0)
      return `rgb(${c0.map((c, j) => Math.round(c + (c1[j] - c) * k)).join(',')})`
    }
  }
  return 'rgb(150,20,20)'
}

type SortKey = 'record' | '30' | '35' | '40'

export function HeatRecords() {
  const [data, setData] = useState<ThreshData | null>(null)
  const [sort, setSort] = useState<SortKey>('record')

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}heat_thresholds.json`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  const states = useMemo(() => {
    if (!data) return []
    const arr = [...data.states]
    if (sort === 'record') {
      arr.sort((a, b) => b.record.temp - a.record.temp)
    } else {
      // nach frühestem Kalendertag der gewählten Schwelle (früher = oben); nie erreicht ans Ende
      const md = (s: StateRec) => s.stats[sort]?.earliestMd ?? '99-99'
      arr.sort((a, b) => md(a).localeCompare(md(b)))
    }
    return arr
  }, [data, sort])

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center', color: NORDIC.fog, fontSize: 13 }}>Lade Hitzerekorde …</div>
  }

  const nat = data.national
  const provYear = data.provisionalYear
  const isProv = (iso?: string) => !!iso && !!provYear && iso.slice(0, 4) === String(provYear)
  // dezentes Sternchen für vorläufige Werte aus dem laufenden Jahr
  const prov = (iso?: string) =>
    isProv(iso) ? <sup style={{ color: NORDIC.amber, fontWeight: 700 }} title={`vorläufig (${provYear})`}>*</sup> : null

  const th = (k: SortKey, label: string, sub: string) => (
    <th
      onClick={() => setSort(k)}
      style={{
        padding: '8px 10px', textAlign: 'right', cursor: 'pointer', userSelect: 'none',
        borderBottom: `2px solid ${sort === k ? NORDIC.red : '#e2e8f0'}`,
        color: sort === k ? NORDIC.red : NORDIC.stone, whiteSpace: 'nowrap',
      }}
      title="Spalte sortieren"
    >
      <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 400, color: NORDIC.fog }}>{sub}</div>
    </th>
  )

  return (
    <div>
      {/* National-Rekord Headline */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
        background: '#fff7de', border: '1px solid #fde68a', borderRadius: 12,
        padding: '14px 18px', marginBottom: 18,
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: NORDIC.red, letterSpacing: '-0.5px' }}>
          {nat.temp.toLocaleString('de-DE')} °C
        </span>
        <span style={{ fontSize: 13, color: NORDIC.navy }}>
          höchste je in Deutschland gemessene Temperatur — {fmtDate(nat.date)}, {nat.station} ({nat.state})
          {isProv(nat.date) && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: NORDIC.amber, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '1px 8px' }}>
              vorläufig
            </span>
          )}
        </span>
        {data.dataThrough && (
          <span style={{
            marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: NORDIC.stone,
            background: '#fff', border: '1px solid #fde68a', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap',
          }}>
            Datenstand: {fmtDate(data.dataThrough)}
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: NORDIC.stone, fontSize: 12, fontWeight: 700 }}>
                Bundesland
              </th>
              {th('record', 'Rekord', 'höchste je gemessen')}
              {th('30', 'Erstmals 30 °C', 'frühester Tag im Jahr')}
              {th('35', 'Erstmals 35 °C', 'frühester Tag im Jahr')}
              {th('40', 'Erstmals 40 °C', 'frühester Tag im Jahr')}
            </tr>
          </thead>
          <tbody>
            {states.map(s => {
              const cell = (T: string) => {
                const st = s.stats[T]
                if (!st?.earliestMd) return <span style={{ color: NORDIC.fog }}>noch nie</span>
                return (
                  <>
                    <div style={{ fontWeight: 600, color: NORDIC.navy }}>{fmtMd(st.earliestMd)}</div>
                    <div style={{ fontSize: 10, color: NORDIC.fog }}>im Jahr {st.earliestDate!.slice(0, 4)}{prov(st.earliestDate)}</div>
                  </>
                )
              }
              return (
                <tr key={s.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: NORDIC.navy }}>{s.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: tempColor(s.record.temp) }} />
                      <div>
                        <div style={{ fontWeight: 700, color: NORDIC.navy }}>{s.record.temp.toLocaleString('de-DE')} °C{prov(s.record.date)}</div>
                        <div style={{ fontSize: 10, color: NORDIC.fog }}>{fmtDate(s.record.date)} · {s.record.station}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{cell('30')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{cell('35')}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{cell('40')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: NORDIC.fog, marginTop: 12, lineHeight: 1.5 }}>
        „Erstmals X °C" = frühester Kalendertag im Jahr, an dem irgendeine Station des Bundeslandes diese Marke je erreicht hat.
        {provYear && <> <span style={{ color: NORDIC.amber, fontWeight: 700 }}>*</span> vorläufige Werte aus dem laufenden Jahr {provYear} (noch nicht endgültig qualitätsgeprüft).</>}
        {' '}Quelle: {data.source}. Datenstand: {data.dataThrough ? fmtDate(data.dataThrough) : data.generated}.
      </p>
    </div>
  )
}
