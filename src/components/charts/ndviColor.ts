// Gemeinsame NDVI→Farbe-Abbildung — identisch zur Raster-Skala in
// scripts/satellite/process_ndvi.py (COLOR_STOPS). Damit sind Choropleth
// (grob, Bundesländer) und 10-m-Raster (scharf, Ausschnitt) farblich
// kontinuierlich und wirken wie EINE Karte — das „Verschmelzen" aus
// docs/umweltpuls_skalierung_deutschland.md.

type Stop = [number, [number, number, number]]

const STOPS: Stop[] = [
  [-1.0, [0x42, 0x6e, 0xa8]], // Wasser / negativ → blau
  [0.0, [0x8c, 0x6d, 0x3f]],  // nackter Boden → braun
  [0.2, [0xd9, 0xae, 0x4e]],  // spärlich → ocker
  [0.4, [0xc6, 0xd6, 0x4e]],  // mäßig → gelbgrün
  [0.6, [0x5a, 0xa8, 0x3a]],  // gesund → grün
  [1.0, [0x16, 0x5e, 0x1f]],  // sehr dicht → dunkelgrün
]

/** NDVI-Wert (−1…1) → CSS-rgb-Farbe, lineare Interpolation der Stützpunkte. */
export function ndviColor(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '#f1f5f9' // keine Daten → hellgrau
  const x = Math.max(-1, Math.min(1, v))
  for (let i = 1; i < STOPS.length; i++) {
    const [x1, c1] = STOPS[i]
    if (x <= x1) {
      const [x0, c0] = STOPS[i - 1]
      const t = (x - x0) / (x1 - x0)
      const ch = (a: number, b: number) => Math.round(a + (b - a) * t)
      return `rgb(${ch(c0[0], c1[0])},${ch(c0[1], c1[1])},${ch(c0[2], c1[2])})`
    }
  }
  const last = STOPS[STOPS.length - 1][1]
  return `rgb(${last[0]},${last[1]},${last[2]})`
}

/** CSS-Gradient für die Legende (Bereich Boden→dicht). */
export const NDVI_LEGEND_GRADIENT =
  'linear-gradient(90deg,#8c6d3f,#d9ae4e,#c6d64e,#5aa83a,#165e1f)'
