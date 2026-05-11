import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Thermometer, Factory, Lightning, Fire,
  BookOpen, Translate, ChartBar, ArrowRight, Warning,
} from '@phosphor-icons/react'
import { fetchData, fetchSingleDataflow } from '../api/sdmx'
import { CubeMark } from '../components/CubeMark'
import { SEO } from '../components/SEO'
import { CATEGORIES } from '../utils/categories'
import { DATASET_CONTENT } from '../data/datasetContent'
import heroBg from '../assets/hero_background.png'

// Count datasets per category from static content (no API call needed)
const CATEGORY_COUNTS: Record<string, number> = {}
for (const id of Object.keys(DATASET_CONTENT)) {
  const cat = id.replace(/^DF_/, '').split('_')[0]
  CATEGORY_COUNTS[cat] = (CATEGORY_COUNTS[cat] ?? 0) + 1
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HighlightConfig {
  flowId: string
  key?: string
  title: string
  subtitle: string
  Icon: React.ElementType
  color: string
  chartType: 'area' | 'line' | 'bar'
  unit?: string
  invertColors?: boolean
}

interface ChartPoint { year: string; value: number | null }

// ─── Data ─────────────────────────────────────────────────────────────────────

const HIGHLIGHTS: HighlightConfig[] = [
  {
    flowId: 'DF_CLIMATE_GERMANY_TEMPERATURE_MEAN',
    key: 'DE.A.DEGC.JM.',
    title: 'Temperatur',
    subtitle: 'Jahresmittelwert Lufttemperatur 2m',
    Icon: Thermometer,
    color: '#dc2626',
    chartType: 'area',
    unit: '°C',
  },
  {
    flowId: 'DF_CLIMATE_EMISSIONS_GHG_TRENDS',
    key: 'DE.A.TOTAL.GHG.MT_CO2_EQ',
    title: 'Treibhausgase',
    subtitle: 'Gesamtemissionen nach UNFCCC',
    Icon: Factory,
    color: '#0f766e',
    chartType: 'area',
    unit: 'Mt CO₂eq',
  },
  {
    flowId: 'DF_ENERGY_AGEE_SHARE',
    key: 'DE.A.PZ.SHARE_EE_GFEC_RED.EE',
    title: 'Erneuerbare Energien',
    subtitle: 'Anteil am Bruttoendenergieverbrauch',
    Icon: Lightning,
    color: '#0369a1',
    chartType: 'bar',
    unit: '%',
  },
  {
    flowId: 'DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA',
    key: 'DE.A.HA.A.FA',
    title: 'Waldbrandfläche',
    subtitle: 'Jährliche Brandfläche in Deutschland',
    Icon: Fire,
    color: '#b45309',
    chartType: 'bar',
    unit: 'ha',
    invertColors: true,
  },
]

const FEATURES = [
  {
    Icon: BookOpen,
    title: 'Die Geschichte hinter den Zahlen',
    body: 'Jeder Datensatz startet mit den wichtigsten Erkenntnissen auf einen Blick — keine nackten Tabellen, sondern eingeordnete Fakten.',
  },
  {
    Icon: Translate,
    title: 'Integrierter Daten-Dolmetscher',
    body: 'Komplexe Einheiten und Grenzwerte übersetzt der Datacube direkt in den interaktiven Diagrammen durch kontextuelle Tooltips.',
  },
  {
    Icon: ChartBar,
    title: 'Maßgeschneiderte Analysen',
    body: 'Jahre vergleichen, nach Ursachen filtern, Trends erkennen — und aktuelle Diagrammansichten direkt herunterladen.',
  },
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useHighlightData(config: HighlightConfig) {
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchSingleDataflow(config.flowId)
      .then((flow) => fetchData(flow, config.key ?? 'all'))
      .then(({ seriesMap, timeValues }) => {
        let observations: Record<string, number | null> = {}
        if (config.key && seriesMap[config.key]) {
          observations = seriesMap[config.key].observations
        } else {
          const keys = Object.keys(seriesMap)
          for (const k of keys) {
            const obs = seriesMap[k].observations
            if (Object.values(obs).some((v) => v !== null)) { observations = obs; break }
          }
          if (Object.keys(observations).length === 0 && keys.length > 0) {
            observations = seriesMap[keys[0]].observations
          }
        }
        setData(timeValues.map((y) => ({ year: y, value: observations[y] ?? null })).filter((d) => d.value != null))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [config.flowId])

  return { data, loading, error }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 22 } },
}



function HighlightCard({ config }: { config: HighlightConfig }) {
  const { data, loading, error } = useHighlightData(config)
  const latest = data[data.length - 1]
  const previous = data[data.length - 2]
  const trend =
    latest?.value != null && previous?.value != null ? latest.value - previous.value : null
  const { Icon } = config

  const trendPositive = trend != null && (config.invertColors ? trend < 0 : trend > 0)
  const trendNegative = trend != null && (config.invertColors ? trend > 0 : trend < 0)

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-[1.5rem] border border-slate-200/60 bg-white overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] flex flex-col"
    >
      {/* Top accent line */}
      <div className="h-[3px] w-full" style={{ background: config.color }} />

      <div className="p-6 flex-1 flex flex-col">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3"
              style={{ background: `${config.color}14` }}
            >
              <Icon size={18} weight="duotone" style={{ color: config.color }} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight leading-tight">
              {config.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{config.subtitle}</p>
          </div>

          {latest?.value != null && (
            <div className="text-right shrink-0 ml-4">
              <div
                className="text-2xl font-bold tracking-tight"
                style={{ color: config.color, fontFamily: "'Geist Mono', monospace" }}
              >
                {Number(latest.value).toLocaleString('de-DE', { maximumFractionDigits: 1 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{config.unit} · {latest.year}</div>
              {trend != null && (
                <div
                  className="text-[11px] font-medium mt-1 flex items-center justify-end gap-0.5"
                  style={{ color: trendPositive ? '#16a34a' : trendNegative ? '#dc2626' : '#94a3b8' }}
                >
                  <span>{trend > 0 ? '▲' : '▼'}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace" }}>
                    {Math.abs(trend).toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[100px] mt-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full rounded-lg bg-slate-100 animate-pulse"
              />
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center text-xs text-slate-400"
              >
                Daten konnten nicht geladen werden
              </motion.div>
            ) : data.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center text-xs text-slate-400"
              >
                Keine Daten verfügbar
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {config.chartType === 'bar' ? (
                    <BarChart data={data} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                      <XAxis dataKey="year" tick={{ fontSize: 8, fill: '#94a3b8' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(v: any) => [Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }), config.unit ?? '']}
                      />
                      <Bar dataKey="value" fill={config.color} radius={[3, 3, 0, 0]} opacity={0.85} />
                    </BarChart>
                  ) : (
                    <AreaChart data={data} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`g-${config.flowId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={config.color} stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 8, fill: '#94a3b8' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        formatter={(v: any) => [Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1 }), config.unit ?? '']}
                      />
                      <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={1.5}
                        fill={`url(#g-${config.flowId})`} dot={false} connectNulls />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer link */}
      <div className="px-6 py-3 border-t border-slate-100">
        <Link
          to={`/dataset/${encodeURIComponent(config.flowId)}`}
          className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all duration-200"
          style={{ color: config.color }}
        >
          Details & alle Serien <ArrowRight size={12} weight="bold" />
        </Link>
      </div>
    </motion.div>
  )
}

function CategoryTile({ cat, count }: { cat: typeof CATEGORIES[0]; count: number }) {
  return (
    <motion.div variants={fadeUp}>
      <Link to={`/catalog?category=${cat.id}`} className="block group">
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer"
          style={{ height: 140 }}
        >
          {/* Background */}
          <div
            className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
            style={{
              backgroundImage: cat.image ? `url("${cat.image}")` : 'none',
              backgroundColor: cat.bg,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/25 to-transparent" />
          {/* Icon top-right */}
          <div
            className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/90 text-sm font-medium border border-white/20 backdrop-blur-sm"
            style={{ background: `${cat.color}55` }}
          >
            {cat.icon}
          </div>
          {/* Text bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="text-[13px] font-600 text-white leading-tight tracking-tight">{cat.label}</div>
            <div
              className="text-[11px] mt-0.5 font-mono"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {count} Datensätze
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <SEO path="/" />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="relative rounded-[2rem] overflow-hidden mb-10"
        style={{ minHeight: 360 }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Asymmetric gradient — stronger left fade */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, rgba(2,9,23,0.92) 0%, rgba(2,9,23,0.72) 45%, rgba(2,9,23,0.15) 100%)',
          }}
        />

        {/* Content — left-aligned, asymmetric */}
        <div className="relative z-10 p-10 md:p-14 max-w-[640px]">

          {/* Logo mark */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 120, damping: 24 }}
            className="flex items-center gap-3 mb-6"
          >
            <CubeMark size={28} color="rgba(255,255,255,0.95)" accent="#4A6741" />
            <span style={{
              fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.90)',
              letterSpacing: '-0.2px',
            }}>
              Umweltpuls
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 24 }}
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#4A6741', marginBottom: 16, textTransform: 'uppercase' }}
          >
            Basierend auf Daten des Umweltbundesamts
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 120, damping: 24 }}
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.08, color: 'white', marginBottom: 16 }}
          >
            Umweltdaten. <br />
            <span style={{ color: '#6B9A5E' }}>Klar gemacht.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="text-[15px] leading-relaxed text-white/75 max-w-[55ch] mb-8"
          >
            Offizielle Klimadaten, Emissionstrends und Umweltindikatoren — direkt aus dem Datacube des Umweltbundesamts, aufbereitet für Öffentlichkeit und Entscheidungsträger.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, type: 'spring', stiffness: 120, damping: 24 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl text-sm font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.22)] transition-shadow duration-200 no-underline cursor-pointer"
            >
              Datenkatalog öffnen
              <span className="text-slate-400 font-normal text-xs">
                80 Datensätze
              </span>
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              to="/analysen"
              className="inline-flex items-center gap-2 border border-white/25 text-white/90 px-5 py-3 rounded-xl text-sm font-medium backdrop-blur-sm hover:border-white/40 hover:text-white transition-all duration-200 no-underline cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' }}
            >
              Analysen entdecken
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Disclaimer ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 120, damping: 24 }}
        className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 mb-8 text-sm"
      >
        <Warning size={16} weight="duotone" className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-amber-800 leading-relaxed m-0">
          <strong className="font-semibold">Kein UBA-Angebot.</strong>{' '}
          Dieses Projekt ist ein privates Vorhaben ohne Verbindung zum Umweltbundesamt. Es stellt lediglich öffentliche Daten aus der UBA-API nutzerfreundlich dar.{' '}
          <Link to="/about" className="underline font-medium hover:text-amber-900">
            Mehr erfahren →
          </Link>
        </p>
      </motion.div>

      {/* ── Feature row ──────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12"
      >
        {FEATURES.map(({ Icon, title, body }) => (
          <motion.div
            key={title}
            variants={fadeUp}
            className="p-6 rounded-2xl border border-slate-200/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: '#4A674114' }}>
              <Icon size={18} weight="duotone" style={{ color: '#4A6741' }} />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1B2B3A', marginBottom: 6, lineHeight: 1.35, letterSpacing: '-0.2px' }}>{title}</h3>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{body}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Highlights ───────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B3A', letterSpacing: '-0.4px', margin: 0 }}>Highlights</h2>
          <div style={{ width: 28, height: 2, background: '#4A6741', borderRadius: 1, marginTop: 5 }} />
        </div>
        <Link to="/catalog" style={{ fontSize: 12, color: '#7A9BAD', textDecoration: 'none', fontWeight: 500 }}>
          Alle Datensätze →
        </Link>
      </div>

      <AnimatePresence mode="wait">
          <motion.div
            key="highlight-grid"
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          >
            {HIGHLIGHTS.map((h) => (
              <HighlightCard key={h.flowId} config={h} />
            ))}
          </motion.div>
      </AnimatePresence>

      {/* ── Category tiles ───────────────────────────────────────────────── */}
      <div className="mb-4 mt-12">
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B2B3A', letterSpacing: '-0.4px', margin: 0 }}>Themenbereiche</h2>
        <div style={{ width: 28, height: 2, background: '#4A6741', borderRadius: 1, marginTop: 5 }} />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
      >
        {CATEGORIES.map((cat) => (
          <CategoryTile key={cat.id} cat={cat} count={CATEGORY_COUNTS[cat.id] ?? 0} />
        ))}
      </motion.div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="mt-12 pt-5 border-t border-slate-200/80 text-[11px] text-slate-400 text-center">
        Datenquelle:{' '}
        <a
          href="https://datacube.uba.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          Umweltbundesamt Datacube
        </a>
        {' · '}SDMX REST API: daten.uba.de
        {' · '}
        <Link to="/about#impressum" className="text-slate-400 hover:text-slate-600 transition-colors">
          Impressum
        </Link>
        {' · '}
        <Link to="/about" className="text-slate-400 hover:text-slate-600 transition-colors">
          Kein UBA-Angebot
        </Link>
      </div>
    </div>
  )
}
