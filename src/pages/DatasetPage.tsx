import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ShareNetwork, ChartLine, ChartBar,
  MagnifyingGlass, Funnel, CaretDown, Check,
} from '@phosphor-icons/react'

import { fetchDataflows, fetchData, type Dataflow, type Dimension } from '../api/sdmx'
import { getCategoryMeta } from '../utils/categories'
import ForestFiresAnalysis from '../components/ForestFiresAnalysis'
import { DatasetPresets } from '../components/DatasetPresets'
import RelatedPublications from '../components/RelatedPublications'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { GuidedTip } from '../components/GuidedTip'
import { DatasetStory } from '../components/DatasetStory'
import { getDatasetContent } from '../data/datasetContent'
import { SEO } from '../components/SEO'

const CHART_COLORS = [
  '#1B2B3A', '#dc2626', '#4A6741', '#d97706', '#7c3aed',
  '#3D5A6E', '#be185d', '#65a30d', '#0284c7', '#92400e',
]

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

  const [flow, setFlow] = useState<Dataflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [shareCopied, setShareCopied] = useState(false)

  const [seriesMap, setSeriesMap] = useState<Record<string, { dimValues: string[]; observations: Record<string, number | null> }>>({})
  const [timeValues, setTimeValues] = useState<string[]>([])
  const [dims, setDims] = useState<Dimension[]>([])
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    fetchDataflows()
      .then((flows) => {
        const f = flows.find((fl) => fl.id === decodeURIComponent(id))
        if (!f) throw new Error('Datensatz nicht gefunden')
        setFlow(f)
        return fetchData(f)
      })
      .then(({ seriesMap, timeValues, seriesDimensions }) => {
        setSeriesMap(seriesMap)
        setTimeValues(timeValues)
        setDims(seriesDimensions)
        if (selectedSeries.size === 0) {
          const ranked = Object.entries(seriesMap).map(([key, s]) => {
            const vals = Object.values(s.observations).filter((v) => v !== null) as number[]
            const avg = vals.length ? vals.reduce((a, v) => a + Math.abs(v), 0) / vals.length : -Infinity
            return { key, avg }
          })
          ranked.sort((a, b) => b.avg - a.avg)
          setSelectedSeries(new Set(ranked.slice(0, 5).map((s) => s.key)))
        }
      })
      .catch((e) => setError(e.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false))
  }, [id])

  const chartData = useMemo(() => {
    if (!timeValues.length) return []
    return timeValues.map((year) => {
      const point: Record<string, any> = { year }
      let hasData = false
      for (const key of selectedSeries) {
        const s = seriesMap[key]
        if (s) {
          const label = s.dimValues.join(' · ') || key
          const val = s.observations[year] ?? null
          point[label] = val
          if (val !== null) hasData = true
        }
      }
      return { point, hasData }
    }).filter(d => d.hasData).map(d => d.point)
  }, [timeValues, selectedSeries, seriesMap])

  const filteredSeries = useMemo(() => {
    return Object.entries(seriesMap).filter(([_, s]) =>
      Object.entries(filters).every(([dimName, targetVal]) => {
        if (!targetVal) return true
        const dimIdx = dims.findIndex(d => d.name === dimName)
        return dimIdx === -1 || s.dimValues[dimIdx] === targetVal
      })
    ).map(([key, s]) => ({ key, label: s.dimValues.join(' · ') || key, dimValues: s.dimValues }))
  }, [seriesMap, filters, dims])

  const applyPreset = useCallback((presetFilters: Record<string, string>) => {
    setFilters(presetFilters)
    const matchingKeys = Object.entries(seriesMap).filter(([_, s]) =>
      Object.entries(presetFilters).every(([dimName, targetVal]) => {
        if (!targetVal) return true
        const dimIdx = dims.findIndex(d => d.name === dimName)
        return dimIdx === -1 || s.dimValues[dimIdx] === targetVal
      })
    ).map(([key]) => key)
    setSelectedSeries(new Set(matchingKeys))
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }, [seriesMap, dims])

  const meta = flow ? getCategoryMeta(flow.category) : getCategoryMeta('')
  const activeSeriesList = filteredSeries.filter((s) => selectedSeries.has(s.key))

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
        title={flow.name}
        description={`${flow.name} — Umweltdatensatz des Umweltbundesamts. Interaktive Zeitreihen, Trends und Rohdaten.`}
        path={`/dataset/${encodeURIComponent(flow.id)}`}
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
            {/* Dimension filters */}
            {dims.length > 0 && (
              <div className="flex flex-col gap-3 mb-3">
                {dims.map((d, i) => {
                  const uniqueVals = Array.from(new Set(Object.values(seriesMap).map(s => s.dimValues[i]))).sort()
                  if (uniqueVals.length <= 1) return null
                  return (
                    <div key={d.name}>
                      <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1.5 flex items-center gap-1">
                        <MagnifyingGlass size={9} />
                        {d.name}
                      </div>
                      <div className="relative">
                        <select
                          value={filters[d.name] || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, [d.name]: e.target.value }))}
                          className="w-full text-[11px] py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 appearance-none focus:outline-none focus:border-slate-400 focus:bg-white transition-colors cursor-pointer"
                        >
                          <option value="">Alle</option>
                          {uniqueVals.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <CaretDown size={9} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

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
            {/* Chart type toggle */}
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
                className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                {selectedSeries.size === 0 ? (
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
                ) : (
                  <div className="p-2">
                    <ChartRenderer
                      flow={flow}
                      chartData={chartData}
                      activeSeriesList={activeSeriesList}
                      chartType={chartType}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Data table */}
          {selectedSeries.size > 0 && (
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
                      {activeSeriesList.map(({ label }) => (
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
                        {activeSeriesList.map(({ label }) => (
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
    </motion.div>
  )
}
