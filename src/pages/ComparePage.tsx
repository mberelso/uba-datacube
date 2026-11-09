import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShareNetwork, LinkSimple, Check, ArrowsLeftRight } from '@phosphor-icons/react'
import { CompareChart, type CompareSeries } from '../components/charts/CompareChart'
import { SEO } from '../components/SEO'
import { fetchSingleSeries } from '../api/sdmx'
import { SocialCardModal } from '../components/social/SocialCardModal'
import type { SocialCardData } from '../components/social/types'

const NORDIC = {
  navy:  '#1B2B3A',
  red:   '#dc2626',
  blue:  '#0284c7',
  stone: '#8C8880',
}

interface IndicatorSpec {
  id: string
  category: string
  label: string
  unit: string
  load: () => Promise<CompareSeries>
}

const INDICATORS: IndicatorSpec[] = [
  {
    id: 'temp-mean',
    category: 'Klima & Wetter (DWD/UBA)',
    label: 'Durchschnittstemperatur Deutschland (ab 1881)',
    unit: '°C (Jahresmittel)',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_CLIMATE_GERMANY_TEMPERATURE_MEAN,1.0', 'DE.A.DEGC.JM.DE')
      return { label: 'Durchschnittstemperatur', unit: '°C (Jahresmittel)', data }
    },
  },
  {
    id: 'hot-days',
    category: 'Klima & Wetter (DWD/UBA)',
    label: 'Heiße Tage (Tmax ≥ 30 °C, ab 1951)',
    unit: 'Tage / Jahr (Ø)',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_CLIMATE_GERMANY_HOT_DAYS,1.0', 'DE.A.DAYS.JW.DE')
      return { label: 'Heiße Tage (Tmax ≥ 30 °C)', unit: 'Tage / Jahr (Ø)', data }
    },
  },
  {
    id: 'forest-fire',
    category: 'Klima & Wetter (DWD/UBA)',
    label: 'Waldbrandfläche in Deutschland',
    unit: 'ha / Jahr',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA,1.0', 'DE.A.HA.A.FA')
      return { label: 'Waldbrandfläche', unit: 'ha / Jahr', data }
    },
  },
  {
    id: 'ee-share',
    category: 'Energie & Ausbau',
    label: 'Anteil Erneuerbare Energien (Endenergie, ab 2004)',
    unit: '% am Bruttoendenergieverbrauch',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_ENERGY_AGEE_SHARE,1.0', 'DE.A.PZ.SHARE_EE_GFEC_RED.EE')
      return { label: 'Anteil Erneuerbare Energien', unit: '% am Bruttoendenergieverbrauch', data }
    },
  },
  {
    id: 'wind-gw',
    category: 'Energie & Ausbau',
    label: 'Installierte Windkraft-Leistung (MaStR, ab 1990)',
    unit: 'GW kumuliert',
    load: async () => {
      const res = await fetch('/wind_summary.json')
      const json: { years: number[]; cumGw: number[] } = await res.json()
      const data = json.years.map((y, i) => ({ year: String(y), value: json.cumGw[i] ?? null }))
      return { label: 'Windkraft-Leistung (MaStR)', unit: 'GW kumuliert', data }
    },
  },
  {
    id: 'solar-gw',
    category: 'Energie & Ausbau',
    label: 'Installierte Photovoltaik-Leistung (MaStR, ab 2000)',
    unit: 'GW kumuliert',
    load: async () => {
      const res = await fetch('/pv_summary.json')
      const json: { years: number[]; cumGw: number[] } = await res.json()
      const data = json.years
        .map((y, i) => ({ year: String(y), value: json.cumGw[i] ?? null }))
        .filter((d) => parseInt(d.year) >= 2000)
      return { label: 'Photovoltaik-Leistung (MaStR)', unit: 'GW kumuliert', data }
    },
  },
  {
    id: 'air-index',
    category: 'Luftschadstoffe (UBA)',
    label: 'Luftschadstoff-Emissionsindex (Gesamt, ab 1990)',
    unit: 'Index (2005 = 100)',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_AIR_EMISSIONS_INDEX,2026.0', 'A.NA.AM.DE')
      return { label: 'Luftschadstoff-Emissionsindex (Gesamt)', unit: 'Index (2005 = 100)', data }
    },
  },
  {
    id: 'nox-index',
    category: 'Luftschadstoffe (UBA)',
    label: 'Stickoxid-Emissionen NOₓ (Index, ab 1990)',
    unit: 'Index (2005 = 100)',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_AIR_EMISSIONS_INDEX,2026.0', 'A.NOx_NO2.IND2005.DE')
      return { label: 'Stickoxid-Emissionen (NOₓ)', unit: 'Index (2005 = 100)', data }
    },
  },
  {
    id: 'pm25-index',
    category: 'Luftschadstoffe (UBA)',
    label: 'Feinstaub-Emissionen PM2,5 (Index, ab 1990)',
    unit: 'Index (2005 = 100)',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_AIR_EMISSIONS_INDEX,2026.0', 'A.PM25.IND2005.DE')
      return { label: 'Feinstaub-Emissionen (PM2,5)', unit: 'Index (2005 = 100)', data }
    },
  },
  {
    id: 'so2-index',
    category: 'Luftschadstoffe (UBA)',
    label: 'Schwefeldioxid-Emissionen SO₂ (Index, ab 1990)',
    unit: 'Index (2005 = 100)',
    load: async () => {
      const data = await fetchSingleSeries('UBA,DF_AIR_EMISSIONS_INDEX,2026.0', 'A.SO2.IND2005.DE')
      return { label: 'Schwefeldioxid-Emissionen (SO₂)', unit: 'Index (2005 = 100)', data }
    },
  },
]

interface PresetOption {
  id: string
  title: string
  subtitle: string
  idA: string
  idB: string
  minYear?: number
}

const PRESETS: PresetOption[] = [
  {
    id: 'ghg-vs-renewable',
    title: 'Temperatur vs. Erneuerbare Energien (seit 2004)',
    subtitle: 'Entwicklung der Jahrestemperatur und des Anteils erneuerbarer Energien am Bruttoendenergieverbrauch seit 2004.',
    idA: 'temp-mean',
    idB: 'ee-share',
    minYear: 2004,
  },
  {
    id: 'temp-vs-hot-days',
    title: 'Durchschnittstemperatur vs. Heiße Tage',
    subtitle: 'Führt der langfristige Anstieg der Jahrestemperatur in Deutschland zu mehr Extremhitzetagen (≥ 30 °C)?',
    idA: 'temp-mean',
    idB: 'hot-days',
    minYear: 1951,
  },
  {
    id: 'air-emissions-index',
    title: 'Luftschadstoff-Emissionsindex seit 1990',
    subtitle: 'Langfristige Reduktion der Luftschadstoffe in Deutschland (Gesamtindex vs. Stickoxide NOₓ) seit 1990.',
    idA: 'air-index',
    idB: 'nox-index',
  },
]

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [copiedLink, setCopiedLink]     = useState(false)

  const initialIdA = searchParams.get('a')
  const initialIdB = searchParams.get('b')
  const initialMode = searchParams.get('mode')

  const [idA, setIdA] = useState<string>(() =>
    INDICATORS.some((i) => i.id === initialIdA) ? initialIdA! : PRESETS[0].idA
  )
  const [idB, setIdB] = useState<string>(() =>
    INDICATORS.some((i) => i.id === initialIdB) ? initialIdB! : PRESETS[0].idB
  )
  const [mode, setMode] = useState<'absolute' | 'index'>(() =>
    initialMode === 'index' ? 'index' : 'absolute'
  )

  const [seriesA, setSeriesA]     = useState<CompareSeries | null>(null)
  const [seriesB, setSeriesB]     = useState<CompareSeries | null>(null)
  const [loading, setLoading]     = useState<boolean>(true)
  const [error, setError]         = useState<string>('')
  const [modalCard, setModalCard] = useState<SocialCardData | null>(null)

  const matchingPreset = useMemo(
    () => PRESETS.find((p) => p.idA === idA && p.idB === idB) ?? null,
    [idA, idB]
  )

  const specA = useMemo(() => INDICATORS.find((i) => i.id === idA) ?? INDICATORS[0], [idA])
  const specB = useMemo(() => INDICATORS.find((i) => i.id === idB) ?? INDICATORS[1], [idB])

  useEffect(() => {
    let active = true

    Promise.all([specA.load(), specB.load()])
      .then(([rawA, rawB]) => {
        if (!active) return
        // Align to overlapping year range so the chart is never half-empty
        const yearsB = new Set(rawB.data.filter((d) => d.value !== null).map((d) => parseInt(d.year)))
        const yearsA = new Set(rawA.data.filter((d) => d.value !== null).map((d) => parseInt(d.year)))
        const commonYears = [...yearsA].filter((y) => yearsB.has(y))
        const minCommon = matchingPreset?.minYear ?? (commonYears.length > 0 ? Math.min(...commonYears) : 1881)

        setSeriesA({
          ...rawA,
          data: rawA.data.filter((d) => parseInt(d.year) >= minCommon),
        })
        setSeriesB({
          ...rawB,
          data: rawB.data.filter((d) => parseInt(d.year) >= minCommon),
        })
      })
      .catch((err) => {
        if (!active) return
        console.error('Fehler beim Laden der Vergleichsdaten:', err)
        setError('Fehler beim Laden der Vergleichsdaten. Bitte wähle eine andere Kombination.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [specA, specB, matchingPreset])

  const handleSelectPreset = (p: PresetOption) => {
    setIdA(p.idA)
    setIdB(p.idB)
    setLoading(true)
    setError('')
  }

  const handleChangeA = (newId: string) => {
    setIdA(newId)
    setLoading(true)
    setError('')
  }

  const handleChangeB = (newId: string) => {
    setIdB(newId)
    setLoading(true)
    setError('')
  }

  const handleSwap = () => {
    setIdA(idB)
    setIdB(idA)
    setLoading(true)
    setError('')
  }

  const handleCopyCompareLink = () => {
    const params = new URLSearchParams({ a: idA, b: idB, mode })
    setSearchParams(params, { replace: true })
    const shareUrl = `${window.location.origin}/vergleich/?${params.toString()}`
    navigator.clipboard?.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="Datenvergleich & Umwelt-Indikatoren"
        description="Vergleiche zwei Umweltdatenreihen des UBA, DWD und Marktstammdatenregisters auf einer gemeinsamen Zeitachse mit Dual-Y-Achse und Korrelationsanalyse."
        path="/vergleich"
        image="https://www.umweltpuls.de/og-vergleich.png"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold tracking-widest text-sky-600 uppercase">
            MULTIVARIATE ANALYSE
          </span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: NORDIC.navy,
                letterSpacing: '-0.6px',
                lineHeight: 1.15,
                marginBottom: 6,
              }}
            >
              Datenvergleich &amp; Indikatoren
            </h1>
            <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400, maxWidth: 740, lineHeight: 1.6 }}>
              Setze zwei Umweltdatenreihen frei in Beziehung: Wähle aus unseren Kuratierungen oder kombiniere
              beliebige Zeitreihen zu Klima, Wind-/Solarausbau und Luftschadstoffen auf einer synchronisierten Achse.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCompareLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 border-0"
          >
            {copiedLink ? (
              <>
                <Check size={15} weight="bold" className="text-emerald-400" />
                <span>Vergleichs-Link kopiert!</span>
              </>
            ) : (
              <>
                <LinkSimple size={15} weight="bold" />
                <span>Link zu diesem Vergleich kopieren</span>
              </>
            )}
          </button>
        </div>
        <div style={{ width: 40, height: 3, background: NORDIC.blue, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      {/* Preset-Auswahl Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PRESETS.map((p) => {
          const isSelected = matchingPreset?.id === p.id
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <h3 className={`text-sm font-bold mb-1 ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                {p.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed m-0">{p.subtitle}</p>
            </button>
          )
        })}
      </div>

      {/* Freier Indikator-Baukasten (Series A vs. Series B) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.05)] mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Eigenen Vergleich zusammenstellen (10 Zeitreihen frei kombinierbar)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div>
            <label htmlFor="select-ind-a" className="block text-xs font-bold text-sky-700 mb-1">
              Indikator A (Linke Y-Achse · Blau)
            </label>
            <select
              id="select-ind-a"
              value={idA}
              onChange={(e) => handleChangeA(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            >
              {INDICATORS.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  [{ind.category}] {ind.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            title="Achsen tauschen"
            className="self-end mb-0.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowsLeftRight size={15} weight="bold" />
            <span className="md:hidden">Achsen tauschen</span>
          </button>

          <div>
            <label htmlFor="select-ind-b" className="block text-xs font-bold text-red-600 mb-1">
              Indikator B (Rechte Y-Achse · Rot)
            </label>
            <select
              id="select-ind-b"
              value={idB}
              onChange={(e) => handleChangeB(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              {INDICATORS.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  [{ind.category}] {ind.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modus-Umschaltung */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Darstellungsmodus:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setMode('absolute')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'absolute' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absolutwerte (Dual-Y-Achse)
            </button>
            <button
              onClick={() => setMode('index')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'index' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relativer Trend (% Index = 100)
            </button>
          </div>

          {seriesA && seriesB && (
            <button
              onClick={() => {
                const ptsA = seriesA.data
                  .filter((d): d is { year: string; value: number } => typeof d.value === 'number')
                  .map((d) => ({ year: d.year, value: d.value }))
                const firstYear = ptsA[0]?.year ?? '1990'
                const lastYear = ptsA[ptsA.length - 1]?.year ?? '2025'
                return setModalCard({
                  category: 'vergleich',
                  seriesName: `${firstYear} – ${lastYear}`,
                  metric: `${ptsA.length} Jahre`,
                  metricLabel: `${seriesA.label} vs. ${seriesB.label}`,
                  headline: matchingPreset?.title ?? `${seriesA.label} & ${seriesB.label}`,
                  story:
                    matchingPreset?.subtitle ??
                    `Langzeit-Vergleich zwischen ${seriesA.label} (${seriesA.unit}) und ${seriesB.label} (${seriesB.unit}) von ${firstYear} bis ${lastYear}.`,
                  sparkline: ptsA.map((d) => d.value),
                  yearRange: `${firstYear} – ${lastYear}`,
                  datasetId: matchingPreset?.id ?? `${idA}-vs-${idB}`,
                  sharePath: `vergleich/?a=${idA}&b=${idB}`,
                  unit: seriesA.unit,
                  chartPoints: ptsA,
                })
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer border-0 shadow-sm"
            >
              <ShareNetwork size={14} weight="bold" />
              Infografik teilen
            </button>
          )}
        </div>

        {modalCard && <SocialCardModal data={modalCard} onClose={() => setModalCard(null)} />}

        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-sky-700">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block" />
            {seriesA?.label ?? 'Indikator A'}
          </span>
          <span className="flex items-center gap-1.5 text-red-600">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
            {seriesB?.label ?? 'Indikator B'}
          </span>
        </div>
      </div>

      {/* Main Visualisierung Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)]">
        {loading ? (
          <div className="h-[420px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Lade Indikatoren &amp; Zeitreihen …</span>
          </div>
        ) : error ? (
          <div className="h-[420px] flex items-center justify-center text-red-600 text-sm font-semibold">
            {error}
          </div>
        ) : seriesA && seriesB ? (
          <CompareChart seriesA={seriesA} seriesB={seriesB} mode={mode} />
        ) : null}
      </div>
    </div>
  )
}
