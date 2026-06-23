import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ShareNetwork, ChartLine, ChartBar,
  MagnifyingGlass, Funnel, CaretDown, Check, DownloadSimple,
  ArrowLineRight,
} from '@phosphor-icons/react'

import { fetchSingleDataflow, fetchData, fetchStructure, type Dataflow, type Dimension } from '../api/sdmx'
import { type LazyDimensionConfig } from '../data/datasetContent'
import { getCategoryMeta } from '../utils/categories'
import ForestFiresAnalysis from '../components/ForestFiresAnalysis'
import { DatasetPresets } from '../components/DatasetPresets'
import RelatedPublications from '../components/RelatedPublications'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { GuidedTip } from '../components/GuidedTip'
import { DatasetStory } from '../components/DatasetStory'
import { getDatasetContent } from '../data/datasetContent'
import { SEO } from '../components/SEO'
import { ExportModal } from '../components/ExportModal'

const CHART_COLORS = [
  '#1B2B3A', '#dc2626', '#4A6741', '#d97706', '#7c3aed',
  '#3D5A6E', '#be185d', '#65a30d', '#0284c7', '#92400e',
]

// Datensätze mit mehr als dieser Serien-Schätzung bekommen Lazy-Load-Modus
const LAZY_THRESHOLD = 500

// Bekannte Datensätze mit sehr vielen Serien — DSD gibt keine zuverlässige Schätzung zurück
const KNOWN_LARGE_DATASETS = new Set([
  'DF_PRTR',                          // 11.651 Serien
  'DF_AIR_EMISSIONS_TRENDS',          // 8.524 Serien
  'DF_CLIMATE_EMISSIONS_GHG_TRENDS',  // 6.696 Serien
  'DF_CLIMATE_EMISSIONS_GHG_TRENDS_KSG', // 6.344 Serien
  'DF_PRTR_WASTE_WATER',              // 2.617 Serien
  'DF_TRANSPORT_TRAFFIC_AREA_BUNDESLAND', // 2.004 Serien
  'DF_TRANSPORT_PUBLIC_PASSENGERS_BUS_TRAIN', // 160 Serien, Quartalsdaten
])

type ChartType = 'line' | 'bar'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 py-6 animate-pulse">
      <div className="h-4 w-48 rounded-full bg-slate-100 mb-6" />
      <div className="rounded-2xl border border-slate-200 bg-white p-7 mb-5">
        <div className="h-3 w-24 rounded-full bg-slate-100 mb-4" />
        <div className="h-7 w-2/3 rounded-lg bg-slate-100 mb-3" />
        <div className="h-3 w-full rounded-full bg-slate-100 mb-2" />
        <div className="h-3 w-4/5 rounded-full bg-slate-100" />
      </div>
      <div className="grid grid-cols-[240px_1fr] gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white h-64" />
        <div className="rounded-2xl border border-slate-200 bg-white h-64" />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  // ?lazy=<JSON> aus der URL lesen — einmalig beim Mount, nie wieder
  const urlLazyFilters = useRef<Record<string, string> | null | false>(false)
  if (urlLazyFilters.current === false) {
    try {
      const raw = new URLSearchParams(location.search).get('lazy')
      urlLazyFilters.current = raw ? JSON.parse(decodeURIComponent(raw)) : null
    } catch { urlLazyFilters.current = null }
  }
  const urlPresetApplied = useRef(false)

  const [flow, setFlow] = useState<Dataflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const [seriesMap, setSeriesMap] = useState<Record<string, { dimValues: string[]; observations: Record<string, number | null> }>>({})
  const [timeValues, setTimeValues] = useState<string[]>([])
  const [dims, setDims] = useState<Dimension[]>([])
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<Record<string, string>>(
    () => (id ? getDatasetContent(decodeURIComponent(id))?.defaultChartConfig?.defaultFilters ?? {} : {})
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Lazy-Load-Modus: true wenn Datensatz zu groß für vollständigen Download
  const [lazyMode, setLazyMode] = useState(false)
  // true während gefilterter Daten-Request läuft
  const [dataLoading, setDataLoading] = useState(false)
  // Kuratierte Dim-Konfiguration für Lazy-Modus (wenn DSD nicht verfügbar)
  const [lazyDimConfig, setLazyDimConfig] = useState<LazyDimensionConfig | null>(null)

  // Baut SDMX-Key aus aktiven Filtern.
  // Bei lazyDimConfig: Key hat genau totalDimensions Positionen, nur konfigurierte Dims werden gesetzt.
  // Bei normalen Dims: Key hat so viele Positionen wie dims.length.
  const buildSdmxKey = useCallback((
    activeDims: Dimension[],
    activeFilters: Record<string, string>,
    dimConfig: LazyDimensionConfig | null,
  ) => {
    if (dimConfig) {
      const slots = Array(dimConfig.totalDimensions).fill('')
      for (const d of dimConfig.dimensions) {
        const val = activeFilters[d.name] || activeFilters[d.id] || ''
        if (val) {
          const code = d.values.find(v => v.name === val || v.id === val)
          slots[d.position] = code?.id ?? val
        }
      }
      return slots.join('.')
    }
    return activeDims.map((d) => {
      const val = activeFilters[d.name] || activeFilters[d.id] || ''
      if (val) {
        const code = d.values.find(v => v.name === val || v.id === val)
        return code?.id ?? val
      }
      return ''
    }).join('.')
  }, [])

  const autoSelectTopSeries = useCallback((sm: typeof seriesMap) => {
    // Falls ein defaultChartConfig.defaultFilters gesetzt ist, nur Serien
    // ranken, die diese Filterwerte erfüllen — sonst kuratiert die Auswahl
    // nichts und die größten (oft uninteressanten) Serien gewinnen.
    const requiredVals = id
      ? Object.values(getDatasetContent(decodeURIComponent(id))?.defaultChartConfig?.defaultFilters ?? {})
      : []
    const ranked = Object.entries(sm)
      .filter(([, s]) => requiredVals.every((v) => s.dimValues.includes(v)))
      .map(([key, s]) => {
        const vals = Object.values(s.observations).filter((v) => v !== null) as number[]
        const avg = vals.length ? vals.reduce((a, v) => a + Math.abs(v), 0) / vals.length : -Infinity
        return { key, avg }
      })
    ranked.sort((a, b) => b.avg - a.avg)
    setSelectedSeries(new Set(ranked.slice(0, 5).map((s) => s.key)))
  }, [id])

  // Initialer Load: Struktur + Daten parallel — Struktur entscheidet ob Lazy-Modus nötig
  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    setLazyMode(false)
    setLazyDimConfig(null)
    setSeriesMap({})
    setTimeValues([])

    const dataAbort = new AbortController()

    fetchSingleDataflow(decodeURIComponent(id))
      .then(async (f) => {
        setFlow(f)
        const cfg = getDatasetContent(decodeURIComponent(id))?.defaultChartConfig ?? null

        // Bekannte Datensätze mit vielen Serien sofort in Lazy-Modus — ohne API-Runde
        if (KNOWN_LARGE_DATASETS.has(f.id)) {
          const localContent = getDatasetContent(f.id)
          let resolvedDimCfg: LazyDimensionConfig | null = null
          if (localContent?.lazyDimensions && localContent.lazyDimensions.dimensions.length > 0) {
            resolvedDimCfg = localContent.lazyDimensions
            setLazyDimConfig(resolvedDimCfg)
            setDims(resolvedDimCfg.dimensions.map(d => ({ ...d })))
          } else {
            const structure = await fetchStructure(f)
            setDims(structure.seriesDimensions)
          }
          setLazyMode(true)
          const urlFilters = urlLazyFilters.current as Record<string, string> | null
          const initFilters = urlFilters ?? cfg?.defaultFilters ?? null
          if (initFilters && Object.keys(initFilters).length > 0) {
            setFilters(initFilters)
            urlPresetApplied.current = true
            const dimsForKey = resolvedDimCfg ? resolvedDimCfg.dimensions.map(d => ({ ...d })) : []
            const key = buildSdmxKey(dimsForKey, initFilters, resolvedDimCfg)
            setDataLoading(true)
            fetchData(f, key || 'all')
              .then(({ seriesMap: sm, timeValues: tv }) => {
                setSeriesMap(sm)
                setTimeValues(tv)
                autoSelectTopSeries(sm)
              })
              .catch(() => {})
              .finally(() => setDataLoading(false))
          }
          return
        }

        // Für alle anderen: Struktur und Daten gleichzeitig anfordern
        const structurePromise = fetchStructure(f)
        const dataPromise = fetchData(f).catch(() => null)

        // Struktur auswerten — Fallback-Prüfung für unbekannte große Datensätze
        const structure = await structurePromise
        const structDims = structure.seriesDimensions
        setDims(structDims)

        const estimate = structDims.reduce((acc, d) => acc * (d.values.length || 1), 1)

        if (estimate > LAZY_THRESHOLD) {
          dataAbort.abort()
          setLazyMode(true)
          const urlFilters2 = urlLazyFilters.current as Record<string, string> | null
          if (urlFilters2 && Object.keys(urlFilters2).length > 0) {
            setFilters(urlFilters2)
            urlPresetApplied.current = true
            const key = buildSdmxKey(structDims, urlFilters2, null)
            setDataLoading(true)
            fetchData(f, key || 'all')
              .then(({ seriesMap: sm, timeValues: tv }) => { setSeriesMap(sm); setTimeValues(tv); autoSelectTopSeries(sm) })
              .catch(() => {})
              .finally(() => setDataLoading(false))
          } else if (cfg?.defaultFilters) {
            setFilters(cfg.defaultFilters)
          }
        } else {
          // Klein: auf parallel laufende Daten warten
          const result = await dataPromise
          if (!result) {
            const { seriesMap: sm, timeValues: tv, seriesDimensions } = await fetchData(f)
            setSeriesMap(sm)
            setTimeValues(tv)
            if (seriesDimensions.length > 0) setDims(seriesDimensions)
            if (cfg?.defaultFilters) setFilters(cfg.defaultFilters)
            autoSelectTopSeries(sm)
          } else {
            const { seriesMap: sm, timeValues: tv, seriesDimensions } = result
            setSeriesMap(sm)
            setTimeValues(tv)
            if (seriesDimensions.length > 0) setDims(seriesDimensions)
            if (cfg?.defaultFilters) setFilters(cfg.defaultFilters)
            autoSelectTopSeries(sm)
          }
        }
      })
      .catch((e) => setError(e.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false))

    return () => dataAbort.abort()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Gefilterte Daten laden (Lazy-Modus: wenn User auf "Laden" klickt)
  const loadFilteredData = useCallback(async (overrideFilters?: Record<string, string>) => {
    if (!flow) return
    setDataLoading(true)
    setError('')
    try {
      const activeFilters = overrideFilters ?? filters
      const key = buildSdmxKey(dims, activeFilters, lazyDimConfig)
      const { seriesMap: sm, timeValues: tv, seriesDimensions } = await fetchData(flow, key || 'all')
      setSeriesMap(sm)
      setTimeValues(tv)
      // Im Lazy-Modus dims nie überschreiben: Die Antwort enthält nur die
      // gerade geladenen Werte — die Dropdowns sollen aber weiterhin alle
      // wählbaren Werte aus der DSD anbieten
      if (!lazyMode && !lazyDimConfig && seriesDimensions.length > 0) setDims(seriesDimensions)
      autoSelectTopSeries(sm)
    } catch (e: any) {
      setError(e.message ?? 'Fehler beim Laden der gefilterten Daten')
    } finally {
      setDataLoading(false)
    }
  }, [flow, dims, filters, lazyMode, lazyDimConfig, buildSdmxKey, autoSelectTopSeries])

  const content = id ? getDatasetContent(decodeURIComponent(id)) : null
  const labelOverrides = content?.labelOverrides ?? {}
  const defaultChartConfig = content?.defaultChartConfig ?? null
  const isStacked = defaultChartConfig?.type === 'stacked'

  const applyLabelOverride = useCallback((val: string) => labelOverrides[val] ?? val, [labelOverrides])

  // Find which dimension positions actually vary across series (to shorten labels)
  const varyingDimIndices = useMemo(() => {
    const allDimValues = Object.values(seriesMap).map(s => s.dimValues)
    if (allDimValues.length === 0) return []
    const numDims = allDimValues[0].length
    return Array.from({ length: numDims }, (_, i) => i).filter(i => {
      const unique = new Set(allDimValues.map(v => v[i]))
      return unique.size > 1
    })
  }, [seriesMap])

  const stackedLabels = useMemo(
    () => new Set(defaultChartConfig?.stackedSeries?.map(s => s.label) ?? []),
    [defaultChartConfig]
  )

  const chartData = useMemo(() => {
    if (!timeValues.length) return []

    if (isStacked) {
      // Required raw dimValues from defaultFilters (e.g. 'Passenger car' must appear in dimValues)
      const requiredRawVals = new Set(Object.values(defaultChartConfig!.defaultFilters ?? {}))
      // Build label → seriesKey map: series must contain all required raw vals AND exactly one stacked label
      const labelToKey: Record<string, string> = {}
      for (const [key, s] of Object.entries(seriesMap)) {
        const hasRequiredVals = requiredRawVals.size === 0 || [...requiredRawVals].every(v => s.dimValues.includes(v))
        if (!hasRequiredVals) continue
        const translatedVals = s.dimValues.map(applyLabelOverride)
        const matchingLabel = translatedVals.find(v => stackedLabels.has(v))
        if (matchingLabel && !labelToKey[matchingLabel]) labelToKey[matchingLabel] = key
      }
      return timeValues.map(year => {
        const point: Record<string, any> = { year }
        let hasData = false
        for (const { label } of defaultChartConfig!.stackedSeries) {
          const key = labelToKey[label]
          const val = key ? (seriesMap[key].observations[year] ?? null) : null
          point[label] = val
          if (val !== null) hasData = true
        }
        return { point, hasData }
      }).filter(d => d.hasData).map(d => d.point)
    }

    return timeValues.map((year) => {
      const point: Record<string, any> = { year }
      let hasData = false
      for (const key of selectedSeries) {
        const s = seriesMap[key]
        if (s) {
          const shortVals = varyingDimIndices.length > 0
            ? varyingDimIndices.map(i => s.dimValues[i]).filter(Boolean)
            : s.dimValues
          const label = shortVals.map(applyLabelOverride).join(' · ') || s.dimValues.map(applyLabelOverride).join(' · ') || key
          const val = s.observations[year] ?? null
          point[label] = val
          if (val !== null) hasData = true
        }
      }
      return { point, hasData }
    }).filter(d => d.hasData).map(d => d.point)
  }, [timeValues, selectedSeries, seriesMap, varyingDimIndices, applyLabelOverride, isStacked, defaultChartConfig, stackedLabels])

  const filteredSeries = useMemo(() => {
    return Object.entries(seriesMap).filter(([_, s]) =>
      // Im Lazy-Modus: API hat bereits durch den Key gefiltert — alle geladenen
      // Serien sind relevant. (Clientseitiger Vergleich würde scheitern, weil
      // die Filter Code-IDs enthalten, dimValues aber Klartextnamen.)
      lazyMode || lazyDimConfig ? true : Object.entries(filters).every(([dimKey, targetVal]) => {
        if (!targetVal) return true
        const dimIdx = dims.findIndex(d => d.name === dimKey || d.id === dimKey)
        return dimIdx === -1 || s.dimValues[dimIdx] === targetVal
      })
    ).map(([key, s]) => {
      const shortVals = varyingDimIndices.length > 0
        ? varyingDimIndices.map(i => s.dimValues[i]).filter(Boolean)
        : s.dimValues
      const label = shortVals.map(applyLabelOverride).join(' · ') || s.dimValues.map(applyLabelOverride).join(' · ') || key
      return { key, label, dimValues: s.dimValues }
    })
  }, [seriesMap, filters, dims, lazyMode, lazyDimConfig, varyingDimIndices, applyLabelOverride])

  const filteredSeriesRef = useRef(filteredSeries)
  filteredSeriesRef.current = filteredSeries
  const seriesMapRef = useRef(seriesMap)
  seriesMapRef.current = seriesMap

  // When filters change (user picked a filter dropdown value), auto-select the
  // top 5 matching series by data density so the chart is never empty.
  useEffect(() => {
    const current = filteredSeriesRef.current
    if (current.length === 0) return
    const ranked = current
      .map(({ key }) => {
        const s = seriesMapRef.current[key]
        const vals = s ? Object.values(s.observations).filter(v => v !== null) : []
        return { key, count: vals.length }
      })
      .sort((a, b) => b.count - a.count)
    setSelectedSeries(new Set(ranked.slice(0, 5).map(s => s.key)))
  }, [filters])

  const applyPreset = useCallback((presetFilters: Record<string, string>, lazyFilters?: Record<string, string>) => {
    if (lazyMode && lazyFilters) {
      // Lazy-Modus: Filter setzen + Daten sofort laden
      setFilters(lazyFilters)
      loadFilteredData(lazyFilters)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    } else {
      // Normal-Modus: seriesMap bereits geladen, passende Serien selektieren
      const targetVals = Object.values(presetFilters).filter(Boolean)
      const matchingKeys = Object.entries(seriesMap).filter(([_, s]) =>
        targetVals.every(val => s.dimValues.includes(val))
      ).map(([key]) => key)
      setSelectedSeries(new Set(matchingKeys))
      setFilters({})
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }, [seriesMap, lazyMode, loadFilteredData])

  const meta = flow ? getCategoryMeta(flow.category) : getCategoryMeta('')

  // Assign colors by position in filteredSeries so sidebar and chart always match.
  const seriesColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    filteredSeries.forEach(({ key }, i) => {
      map[key] = CHART_COLORS[i % CHART_COLORS.length]
    })
    return map
  }, [filteredSeries])

  const activeSeriesList = filteredSeries
    .filter((s) => selectedSeries.has(s.key))
    .map((s) => ({ ...s, color: seriesColorMap[s.key] }))

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return <PageSkeleton />

  if (error) return (
    <div className="max-w-[800px] mx-auto px-5 py-10">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm leading-relaxed mb-4">
        {error}
      </div>
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-[#3D5A6E] font-medium no-underline hover:text-[#1B2B3A] transition-colors">
        <ArrowLeft size={14} weight="bold" /> Zurück zum Katalog
      </Link>
    </div>
  )

  if (!flow) return null

  const isForestFire = flow.id === 'DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 22 }}
      className="max-w-[1100px] mx-auto px-5 py-6"
    >
      <SEO
        title={content?.displayName ?? flow.name}
        description={content?.lead ?? `${flow.name} — Umweltdatensatz des Umweltbundesamts. Interaktive Zeitreihen, Trends und Rohdaten auf umweltpuls.de.`}
        path={`/dataset/${encodeURIComponent(flow.id)}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: flow.name,
          description: flow.description || `${flow.name} — Umweltdatensatz des Umweltbundesamts.`,
          url: `https://www.umweltpuls.de/dataset/${encodeURIComponent(flow.id)}`,
          creator: { '@type': 'Organization', name: 'Umweltbundesamt', url: 'https://www.umweltbundesamt.de' },
          publisher: { '@type': 'Organization', name: 'Umweltpuls', url: 'https://www.umweltpuls.de' },
          inLanguage: 'de-DE',
          license: 'https://www.govdata.de/dl-de/by-2-0',
        }}
      />
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1 text-[#3D5A6E] font-medium no-underline hover:text-[#1B2B3A] transition-colors"
        >
          <ArrowLeft size={12} weight="bold" />
          Katalog
        </Link>
        <span>›</span>
        <span style={{ color: meta.color }} className="font-medium">
          {meta.icon} {meta.label}
        </span>
        <span>›</span>
        <span className="text-slate-500 truncate max-w-[300px]">{flow.name}</span>
      </div>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 110, damping: 22 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] mb-5 overflow-hidden"
        style={{ borderLeft: `4px solid ${meta.color}` }}
      >
        <div className="px-7 pt-6 pb-5">
          {/* Dataset ID badge */}
          <div className="text-[10px] font-mono text-slate-400 tracking-wider mb-3 uppercase">
            {flow.agencyID}:{flow.id} · v{flow.version}
          </div>

          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight leading-tight mb-5">
            {flow.name}
          </h1>

          {(() => {
            const story = getDatasetContent(flow.id)
            return story
              ? <DatasetStory content={story} color={meta.color} />
              : flow.description && (
                  <p className="text-[13px] text-slate-500 leading-relaxed m-0">{flow.description}</p>
                )
          })()}

          <GuidedTip
            id="dataset-tip"
            text="Nutze die Filter links, um Serien einzugrenzen. Über den Share-Button kannst du die aktuelle Ansicht als Link teilen."
            color={meta.color}
          />
        </div>
      </motion.div>

      <RelatedPublications flowId={flow.id} flowName={flow.name} color={meta.color} categoryId={flow.category} />
      <DatasetPresets flowId={flow.id} onApplyPreset={applyPreset} />

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-[240px_1fr]">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <motion.aside
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 110, damping: 22 }}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] h-fit"
        >
          {/* Sidebar header — collapsible on mobile */}
          <button
            className="w-full px-4 pt-4 pb-3 border-b border-slate-100 cursor-pointer bg-transparent border-0 text-left"
            onClick={() => setSidebarOpen(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Funnel size={13} weight="duotone" className="text-slate-400" />
              <span className="text-[11px] font-bold text-[#1B2B3A] tracking-wide uppercase">
                Serien
              </span>
              <span className="ml-auto text-[11px] font-mono text-slate-400">
                {filteredSeries.length}
              </span>
              <CaretDown
                size={11}
                className="text-slate-400 transition-transform md:hidden"
                style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </div>
          </button>

          <div className={`px-3 py-3 md:block ${sidebarOpen ? 'block' : 'hidden'}`}>
            {/* Dimension filters — hidden in stacked mode (chart series are fixed) */}
            {dims.length > 0 && !isStacked && (
              <div className="flex flex-col gap-3 mb-3">
                {dims.map((d, i) => {
                  // Im Lazy-Modus: Code-IDs als Values, Labels als Anzeigetext
                  // Nach dem Load: Werte aus geladenen Daten
                  const isLazyDim = lazyMode && d.values.length > 0
                  const options = (isLazyDim
                    ? d.values.map(v => ({ id: v.id, label: v.name || v.id }))
                    : Array.from(new Set(Object.values(seriesMap).map(s => s.dimValues[i])))
                        .map(v => ({ id: v, label: applyLabelOverride(v) }))
                  ).sort((a, b) => a.label.localeCompare(b.label, 'de'))
                  if (options.length <= 1) return null
                  // Filterwert kann Code-ID (Dropdown) oder Klartextname (Preset/URL) sein —
                  // auf die Options-ID normalisieren, damit das Dropdown die Auswahl anzeigt
                  const rawSelected = filters[d.name] || filters[d.id] || ''
                  const selectedId = options.find(o => o.id === rawSelected)?.id
                    ?? options.find(o => o.label === rawSelected)?.id
                    ?? ''
                  return (
                    <div key={d.name}>
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1.5 flex items-center gap-1">
                        <MagnifyingGlass size={9} />
                        {d.name}
                      </div>
                      <div className="relative">
                        <select
                          value={selectedId}
                          onChange={(e) => setFilters(prev => ({ ...prev, [d.name]: e.target.value }))}
                          className="w-full text-[11px] py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 appearance-none focus:outline-none focus:border-slate-400 focus:bg-white transition-colors cursor-pointer"
                        >
                          <option value="">Alle</option>
                          {options.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                        </select>
                        <CaretDown size={9} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Lazy-Modus: "Laden"-Button */}
            {lazyMode && (
              <button
                onClick={() => loadFilteredData()}
                disabled={dataLoading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border-0 mb-3"
                style={{
                  background: dataLoading ? '#e2e8f0' : meta.color,
                  color: dataLoading ? '#94a3b8' : '#fff',
                  opacity: dataLoading ? 1 : undefined,
                }}
              >
                {dataLoading ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Lädt…
                  </>
                ) : (
                  <>
                    <ArrowLineRight size={13} weight="bold" />
                    {Object.values(seriesMap).length > 0 ? 'Neu laden' : 'Serien laden'}
                  </>
                )}
              </button>
            )}

            {isStacked && defaultChartConfig && (
              <div className="flex flex-col gap-1.5 pt-1">
                {defaultChartConfig.stackedSeries.map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {!isStacked && (
            <>
            {/* Select all / none */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSelectedSeries(prev => {
                  const next = new Set(prev)
                  filteredSeries.forEach(s => next.add(s.key))
                  return next
                })}
                className="flex-1 text-[10px] py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Alle
              </button>
              <button
                onClick={() => setSelectedSeries(prev => {
                  const next = new Set(prev)
                  filteredSeries.forEach(s => next.delete(s.key))
                  return next
                })}
                className="flex-1 text-[10px] py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Keine
              </button>
            </div>

            {/* Series list */}
            {filteredSeries.length > 100 && (
              <div className="text-[11px] text-slate-400 px-1 pb-2 leading-relaxed">
                {filteredSeries.length} Ergebnisse — bitte Filter nutzen.
              </div>
            )}
            <div className="max-h-[460px] overflow-y-auto flex flex-col gap-0.5 pr-0.5">
              {filteredSeries.slice(0, 100).map(({ key, label }, i) => {
                const checked = selectedSeries.has(key)
                const color = CHART_COLORS[i % CHART_COLORS.length]
                return (
                  <label
                    key={key}
                    className="flex items-start gap-2 cursor-pointer px-2 py-1.5 rounded-lg transition-colors"
                    style={{ background: checked ? `${color}0d` : 'transparent' }}
                  >
                    <div
                      className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border transition-all"
                      style={{
                        borderColor: checked ? color : '#cbd5e1',
                        background: checked ? color : 'transparent',
                      }}
                    >
                      {checked && <Check size={8} color="#fff" weight="bold" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelectedSeries(prev => {
                        const next = new Set(prev)
                        next.has(key) ? next.delete(key) : next.add(key)
                        return next
                      })}
                      className="sr-only"
                    />
                    <span
                      className="text-[11px] leading-[1.45]"
                      style={{ color: checked ? color : '#64748b', fontWeight: checked ? 500 : 400 }}
                    >
                      {label || key}
                    </span>
                  </label>
                )
              })}
            </div>
            </>
            )}
          </div>
        </motion.aside>

        {/* ── Chart area ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 110, damping: 22 }}
        >
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] px-4 py-3 mb-4 flex items-center gap-3">
            {/* Chart type toggle — hidden in stacked mode */}
            {!isStacked && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {([
                  { type: 'line' as ChartType, Icon: ChartLine, label: 'Linie' },
                  { type: 'bar' as ChartType, Icon: ChartBar, label: 'Balken' },
                ]).map(({ type, Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-0"
                    style={{
                      background: chartType === type ? '#fff' : 'transparent',
                      color: chartType === type ? '#1B2B3A' : '#94a3b8',
                      boxShadow: chartType === type ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <Icon size={13} weight={chartType === type ? 'duotone' : 'regular'} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Advanced analysis toggle (forest fires only) */}
            {isForestFire && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer border"
                style={{
                  borderColor: showAdvanced ? '#4A6741' : '#e2e8f0',
                  background: showAdvanced ? '#4A674114' : '#fff',
                  color: showAdvanced ? '#4A6741' : '#94a3b8',
                }}
              >
                <MagnifyingGlass size={12} weight={showAdvanced ? 'duotone' : 'regular'} />
                Erweiterte Analyse
              </button>
            )}

            {/* Stats + share */}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {timeValues.length} Zeitpunkte · {selectedSeries.size} aktiv
              </span>
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer"
                style={{ borderColor: '#e2e8f0', background: '#fff', color: '#64748b' }}
              >
                <DownloadSimple size={12} weight="duotone" /> Exportieren
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    setShareCopied(true)
                    setTimeout(() => setShareCopied(false), 2000)
                  })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer"
                style={{
                  borderColor: shareCopied ? '#4A6741' : '#e2e8f0',
                  background: shareCopied ? '#4A674108' : '#fff',
                  color: shareCopied ? '#4A6741' : '#64748b',
                }}
              >
                {shareCopied
                  ? <><Check size={12} weight="bold" /> Kopiert</>
                  : <><ShareNetwork size={12} weight="duotone" /> Teilen</>
                }
              </button>
            </div>
          </div>

          {/* Chart */}
          <AnimatePresence mode="wait">
            {showAdvanced && isForestFire ? (
              <motion.div
                key="advanced"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ForestFiresAnalysis timeValues={timeValues} seriesMap={seriesMap} activeSeriesKeys={selectedSeries} />
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden${lazyMode && Object.keys(seriesMap).length === 0 ? ' border-dashed' : ''}`}
              >
                {lazyMode && Object.keys(seriesMap).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `${meta.color}12` }}
                    >
                      <Funnel size={22} weight="duotone" style={{ color: meta.color }} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1B2B3A] mb-2 tracking-tight">
                      Dieser Datensatz ist sehr groß
                    </h3>
                    <p className="text-[13px] text-slate-400 max-w-[380px] leading-relaxed m-0">
                      Wähle links Filter (Bundesland, Schadstoff, Sektor) und klicke dann auf <strong className="text-slate-600">Serien laden</strong>.
                    </p>
                  </div>
                ) : !isStacked && selectedSeries.size === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `${meta.color}12` }}
                    >
                      <ChartLine size={22} weight="duotone" style={{ color: meta.color }} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1B2B3A] mb-2 tracking-tight">
                      Keine Datenreihen ausgewählt
                    </h3>
                    <p className="text-[13px] text-slate-400 max-w-[360px] leading-relaxed m-0">
                      Setze links Filter oder wähle mindestens eine Serie aus, um das Diagramm anzuzeigen.
                    </p>
                  </div>
                ) : !isStacked && chartData.length <= 2 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `${meta.color}12` }}
                    >
                      <ChartLine size={22} weight="duotone" style={{ color: meta.color }} />
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1B2B3A] mb-2 tracking-tight">
                      Nur {chartData.length === 1 ? 'ein Datenpunkt' : 'wenige Datenpunkte'} verfügbar
                    </h3>
                    <p className="text-[13px] text-slate-400 max-w-[400px] leading-relaxed m-0">
                      Die Datenquelle (UBA API) liefert für diesen Datensatz aktuell nur {chartData.length === 1 ? 'einen einzigen Zeitpunkt' : `${chartData.length} Zeitpunkte`}. Eine Zeitreihe kann daher nicht dargestellt werden.
                    </p>
                    {chartData.length > 0 && (
                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-left w-full max-w-sm">
                        <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">Verfügbare Daten</div>
                        {activeSeriesList.map(({ label }, i) => {
                          const val = chartData[chartData.length - 1]?.[label]
                          if (val == null) return null
                          return (
                            <div key={i} className="flex items-center justify-between gap-3 py-1 border-b border-slate-100 last:border-0">
                              <span className="text-[11px] text-slate-600">{label}</span>
                              <span className="text-[12px] font-semibold text-[#1B2B3A] tabular-nums">{Number(val).toLocaleString('de-DE', { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal text-slate-400">({chartData[chartData.length - 1]?.year})</span></span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2">
                    <ChartRenderer
                      flow={flow}
                      chartData={chartData}
                      activeSeriesList={activeSeriesList}
                      chartType={chartType}
                      stackedSeries={isStacked ? defaultChartConfig!.stackedSeries : undefined}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Data table */}
          {(isStacked ? chartData.length > 0 : selectedSeries.size > 0) && (
            <details className="mt-4 group">
              <summary className="list-none cursor-pointer">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 text-[12px] font-semibold text-slate-600 select-none hover:bg-slate-50 transition-colors">
                  <ChartBar size={13} weight="duotone" className="text-slate-400" />
                  Datentabelle
                  <CaretDown size={10} className="ml-auto text-slate-400 group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              <div className="overflow-x-auto bg-white border border-slate-200/80 border-t-0 rounded-b-xl">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Jahr
                      </th>
                      {(isStacked ? defaultChartConfig!.stackedSeries.map(s => ({ label: s.label })) : activeSeriesList).map(({ label }) => (
                        <th key={label} className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row) => (
                      <tr
                        key={row.year}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-2 font-semibold text-[#1B2B3A] tabular-nums">{row.year}</td>
                        {(isStacked ? defaultChartConfig!.stackedSeries.map(s => ({ label: s.label })) : activeSeriesList).map(({ label }) => (
                          <td key={label} className="px-4 py-2 text-right text-slate-500 tabular-nums">
                            {row[label] != null
                              ? Number(row[label]).toLocaleString('de-DE', { maximumFractionDigits: 3 })
                              : <span className="text-slate-300">–</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </motion.div>
      </div>

      {exportOpen && (
        <ExportModal
          flow={flow}
          content={content}
          chartData={chartData}
          activeSeriesList={activeSeriesList}
          chartType={chartType}
          stackedSeries={isStacked ? defaultChartConfig!.stackedSeries : undefined}
          onClose={() => setExportOpen(false)}
        />
      )}
    </motion.div>
  )
}
