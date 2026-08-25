/**
 * Zentrale Formatierungsbibliothek für Umweltpuls.
 * Garantiert einheitliche deutsche Zahlen-, Prozent- und Kompaktformatierung.
 */

const numFormatCache = new Map<string, Intl.NumberFormat>()

function getNumFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options)
  let fmt = numFormatCache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat('de-DE', options)
    numFormatCache.set(key, fmt)
  }
  return fmt
}

/** Formatiert eine Zahl nach deutscher Konvention (z.B. 1234.5 -> "1.234,5") */
export function fmtNum(v: number | null | undefined, maxDigits = 1, minDigits = 0): string {
  if (v == null || isNaN(v)) return '—'
  return getNumFormat({
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(v)
}

/** Formatiert eine ganzzahlige Zahl mit Tausendertrennung (z.B. 12345 -> "12.345") */
export function fmtInt(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  return getNumFormat({ maximumFractionDigits: 0 }).format(Math.round(v))
}

/** Formatiert einen Prozentwert (z.B. 0.153 -> "15,3 %" oder 15.3 -> "15,3 %" falls isPercentValue=true) */
export function fmtPct(v: number | null | undefined, digits = 1, isPercentValue = false): string {
  if (v == null || isNaN(v)) return '—'
  const val = isPercentValue ? v : v * 100
  return `${fmtNum(val, digits)} %`
}

/** Kompakte Zahlendarstellung für große Werte (z.B. 4.200.000 -> "4,2 Mio.") */
export function fmtCompact(v: number | null | undefined, digits = 1): string {
  if (v == null || isNaN(v)) return '—'
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) {
    return `${fmtNum(v / 1_000_000_000, digits)} Mrd.`
  }
  if (abs >= 1_000_000) {
    return `${fmtNum(v / 1_000_000, digits)} Mio.`
  }
  if (abs >= 100_000) {
    return `${fmtNum(v / 1_000, 0)} Tsd.`
  }
  return fmtNum(v, digits)
}

/** Vorzeichenbehaftete Formatierung (z.B. +12,3 oder −4,5) */
export function fmtSigned(v: number | null | undefined, digits = 1): string {
  if (v == null || isNaN(v)) return '—'
  const formatted = fmtNum(Math.abs(v), digits)
  if (v > 0) return `+${formatted}`
  if (v < 0) return `−${formatted}`
  return formatted
}

/** Formatiert ein Jahr oder eine Periode (z.B. "2022-Q4" -> "Q4 2022", "2002-04" -> "04/2002") */
export function fmtYear(y: number | string | null | undefined): string {
  if (y == null) return '—'
  const str = String(y).trim()
  const qMatch = str.match(/^(\d{4})[-_]?Q([1-4])$/i)
  if (qMatch) return `Q${qMatch[2]} ${qMatch[1]}`
  const mMatch = str.match(/^(\d{4})[-_](\d{2})$/)
  if (mMatch) return `${mMatch[2]}/${mMatch[1]}`
  return str
}

/** Aggregiert sub-jährliche Zeitreihen (z.B. monatlich/quartalsweise) auf Jahreswerte */
export function aggregateByYear(
  points: Array<{ year: string; value: number }>,
  mode: 'avg' | 'sum' = 'avg'
): Array<{ year: string; value: number }> {
  const acc: Record<string, number[]> = {}
  for (const p of points) {
    const year = p.year.slice(0, 4)
    if (year.length === 4 && !isNaN(Number(year))) {
      (acc[year] ??= []).push(p.value)
    }
  }
  return Object.entries(acc)
    .map(([year, values]) => ({
      year,
      value: mode === 'sum' ? values.reduce((a, b) => a + b, 0) : +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
    }))
    .sort((a, b) => a.year.localeCompare(b.year))
}
