import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShareNetwork } from '@phosphor-icons/react'
import { CompareChart, type CompareSeries } from '../components/charts/CompareChart'
import { SEO } from '../components/SEO'
import { fetchAveragedSeries, fetchSingleSeries, type TimePoint } from '../api/sdmx'
import { SocialCardModal } from '../components/social/SocialCardModal'
import type { SocialCardData } from '../components/social/types'

const NORDIC = {
  navy:  '#1B2B3A',
  red:   '#dc2626',
  blue:  '#0284c7',
  stone: '#8C8880',
}

interface PresetOption {
  id: string
  title: string
  subtitle: string
  loadA: () => Promise<CompareSeries>
  loadB: () => Promise<CompareSeries>
}

const PRESETS: PresetOption[] = [
  {
    id: 'ghg-vs-renewable',
    title: 'Treibhausgase vs. Erneuerbare Energien',
    subtitle: 'Wie beeinflusst der Ausbau erneuerbarer Energien die Treibhausgasemissionen in Deutschland?',
    loadA: async () => {
      const data = await fetchAveragedSeries('UBA,DF_CLIMATE_EMISSIONS_GHG,1.0', 'all')
      return { label: 'Treibhausgasemissionen', unit: 'Mio. t CO₂-Äquiv.', data }
    },
    loadB: async () => {
      const data = await fetchSingleSeries('UBA,DF_ENERGY_RENEWABLE_SHARE,1.0', 'all')
      return { label: 'Anteil Erneuerbare Energien', unit: '% am Bruttestromverbrauch', data }
    },
  },
  {
    id: 'fuel-vs-emissions',
    title: 'Pkw-Kraftstoffverbrauch vs. Luftschadstoffe',
    subtitle: 'Zusammenhang zwischen Pkw-Kraftstoffverbrauch und dem Luftschadstoff-Emissionsindex.',
    loadA: async () => {
      const data = await fetchSingleSeries('UBA,DF_TRANSPORT_ENERGY_FUEL_CONSUMPTION,1.0', 'all')
      return { label: 'Pkw Kraftstoffverbrauch', unit: 'l/100 km', data }
    },
    loadB: async () => {
      const data = await fetchAveragedSeries('UBA,DF_AIR_EMISSIONS_INDEX,1.0', 'all')
      return { label: 'Luftschadstoff-Index', unit: 'Index (1990 = 100)', data }
    },
  },
  {
    id: 'water-vs-heat',
    title: 'Wassertemperatur vs. Heiße Tage (DWD)',
    subtitle: 'Langzeitverlauf der Fließgewässer-Wassertemperatur im Vergleich zu den DWD-Hitzetagen.',
    loadA: async () => {
      const data = await fetchAveragedSeries('UBA,DF_DAS_WASSER_WW_I_10,1.0', 'all')
      return { label: 'Fließgewässer Wassertemperatur', unit: '°C (Jahresmittel)', data }
    },
    loadB: async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}heat_thresholds.json`)
      const json = await res.json()
      const firstByYr: Record<string, string> = json.states[0]?.firstByYear?.['30'] ?? {}
      const data: TimePoint[] = Object.keys(firstByYr).map((y) => ({
        year: y,
        value: 1,
      }))
      return { label: 'Erstmals 30 °C in DWD-Stationen', unit: 'Tage im Jahr', data }
    },
  },
]

export default function ComparePage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id)
  const [mode, setMode]                         = useState<'absolute' | 'index'>('absolute')
  const [seriesA, setSeriesA]                   = useState<CompareSeries | null>(null)
  const [seriesB, setSeriesB]                   = useState<CompareSeries | null>(null)
  const [loading, setLoading]                   = useState<boolean>(true)
  const [error, setError]                       = useState<string>('')
  const [modalCard, setModalCard]               = useState<SocialCardData | null>(null)

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0],
    [selectedPresetId]
  )

  useEffect(() => {
    let active = true

    Promise.all([activePreset.loadA(), activePreset.loadB()])
      .then(([a, b]) => {
        if (!active) return
        setSeriesA(a)
        setSeriesB(b)
      })
      .catch((err) => {
        if (!active) return
        console.error('Fehler beim Laden der Vergleichsdaten:', err)
        setError('Fehler beim Laden der Vergleichsdaten. Bitte wähle ein anderes Preset.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [activePreset])

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id)
    setLoading(true)
    setError('')
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="Datenvergleich & Umwelt-Indikatoren"
        description="Vergleiche zwei Umweltdatenreihen des UBA und DWD auf einer gemeinsamen Zeitachse mit Dual-Y-Achse und Korrelationsanalyse."
        path="/vergleich"
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
          Datenvergleich & Indikatoren
        </h1>
        <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400, maxWidth: 740, lineHeight: 1.6 }}>
          Setze zwei Umweltdatenreihen in Beziehung: Untersuche Zusammenhänge zwischen Treibhausgasen,
          erneuerbaren Energien, Verkehr und Hitzetagen auf einer synchronisierten Zeitachse.
        </p>
        <div style={{ width: 40, height: 3, background: NORDIC.blue, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      {/* Preset-Auswahl Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PRESETS.map((p) => {
          const isSelected = p.id === selectedPresetId
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <h3 className={`text-sm font-bold mb-1 ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                {p.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.subtitle}</p>
            </button>
          )
        })}
      </div>

      {/* Modus-Umschaltung */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Darstellungsmodus:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setMode('absolute')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'absolute' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absolutwerte (Dual-Y-Achse)
            </button>
            <button
              onClick={() => setMode('index')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'index' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relativer Trend (% Index = 100)
            </button>
          </div>

          {seriesA && seriesB && (
            <button
              onClick={() =>
                setModalCard({
                  category: 'vergleich',
                  metric: 'Zusammenhang',
                  metricLabel: `${seriesA.label} vs. ${seriesB.label}`,
                  headline: activePreset.title,
                  story: activePreset.subtitle,
                  sparkline: seriesA.data.slice(0, 10).map((d) => d.value ?? 0),
                  yearRange: 'Zeitanalyse',
                  datasetId: activePreset.id,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors cursor-pointer border-0 shadow-sm ml-2"
            >
              <ShareNetwork size={14} weight="bold" />
              Vergleichs-Infografik teilen
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
            <span className="text-xs font-semibold">Lade Indikatoren & Zeitreihen …</span>
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
