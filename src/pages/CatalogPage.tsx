import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { fetchDataflows, type Dataflow } from '../api/sdmx'
import { CATEGORIES, getCategoryMeta } from '../utils/categories'
import { GuidedTip } from '../components/GuidedTip'
import { SEO } from '../components/SEO'

const NORDIC = {
  navy:  '#1B2B3A',
  slate: '#3D5A6E',
  mist:  '#7A9BAD',
  moss:  '#4A6741',
  fog:   '#A8B8C0',
  stone: '#8C8880',
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 140, damping: 22 } },
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 22 } },
}

export default function CatalogPage() {
  const [flows, setFlows]               = useState<Dataflow[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category')
  )

  const handleCategoryClick = (catId: string | null) => {
    setActiveCategory(catId)
    catId ? setSearchParams({ category: catId }) : setSearchParams({})
  }

  useEffect(() => {
    fetchDataflows()
      .then(setFlows)
      .catch(() => setError('Fehler beim Laden der Datensätze.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = flows.filter((f) => {
    const matchCat    = activeCategory ? f.category === activeCategory : true
    const matchSearch = search
      ? f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.id.toLowerCase().includes(search.toLowerCase())
      : true
    return matchCat && matchSearch
  })

  const byCategory: Record<string, Dataflow[]> = {}
  for (const f of filtered) {
    ;(byCategory[f.category] ??= []).push(f)
  }

  const activeMeta = activeCategory ? getCategoryMeta(activeCategory) : null

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="Datenkatalog"
        description="Alle Umweltdatensätze des Umweltbundesamts auf einen Blick — durchsuchen, filtern und interaktiv erkunden."
        path="/catalog"
      />

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
            <rect x="32" y="32" width="80" height="80" rx="8" fill={NORDIC.slate} opacity="0.4"/>
            <rect x="144" y="32" width="80" height="80" rx="8" fill={NORDIC.slate}/>
            <rect x="32" y="144" width="80" height="80" rx="8" fill={NORDIC.slate}/>
            <rect x="144" y="144" width="80" height="80" rx="8" fill={NORDIC.slate} opacity="0.4"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: NORDIC.mist }}>
            DATENKATALOG
          </span>
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, color: NORDIC.navy,
          letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: 6,
        }}>
          {activeMeta ? (
            <>{activeMeta.icon} {activeMeta.label}</>
          ) : (
            'Alle Datensätze'
          )}
        </h1>
        <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400 }}>
          {flows.length} Datensätze des Umweltbundesamts · SDMX REST API
        </p>

        {/* Moss accent bar */}
        <div style={{ width: 40, height: 3, background: NORDIC.moss, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative mb-5"
      >
        <svg width="16" height="16" viewBox="0 0 256 256" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="112" cy="112" r="80" stroke={NORDIC.fog} strokeWidth="20" fill="none"/>
          <line x1="168" y1="168" x2="224" y2="224" stroke={NORDIC.fog} strokeWidth="20" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Datensatz suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
            borderRadius: 10,
            border: `1.5px solid #E2E8F0`,
            fontSize: 14,
            color: NORDIC.navy,
            outline: 'none',
            background: '#fff',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = NORDIC.slate }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#E2E8F0' }}
        />
      </motion.div>

      {/* ── Category filter pills ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        <FilterPill
          label={`Alle (${flows.length})`}
          active={activeCategory === null}
          color={NORDIC.navy}
          bg="#E8ECF0"
          onClick={() => handleCategoryClick(null)}
        />
        {CATEGORIES.map((cat) => {
          const count = flows.filter((f) => f.category === cat.id).length
          if (!count) return null
          return (
            <FilterPill
              key={cat.id}
              label={`${cat.icon} ${cat.label} (${count})`}
              active={activeCategory === cat.id}
              color={cat.color}
              bg={cat.bg}
              onClick={() => handleCategoryClick(activeCategory === cat.id ? null : cat.id)}
            />
          )
        })}
      </motion.div>

      <GuidedTip
        id="catalog-tip"
        text="Wähle eine Themenkategorie oder suche nach einem Datensatz – dann öffne ihn und nutze die Presets für einen schnellen Einstieg."
      />

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `3px solid #E2E8F0`,
              borderTopColor: NORDIC.slate,
            }}
          />
          <span style={{ fontSize: 13, color: NORDIC.fog }}>Lade Datensätze…</span>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '12px 16px',
          fontSize: 13, color: '#DC2626',
        }}>
          {error}
        </div>
      )}

      {/* ── Dataset sections ────────────────────────────────────────────── */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory ?? 'all'}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {Object.entries(byCategory).map(([catId, catFlows]) => {
              const meta = getCategoryMeta(catId)
              return (
                <motion.div key={catId} variants={sectionVariants} className="mb-10">

                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-4" style={{ paddingBottom: 10, borderBottom: `1px solid ${meta.color}18` }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: meta.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {meta.icon}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: NORDIC.navy, margin: 0, lineHeight: 1.2 }}>
                        {meta.label}
                      </h2>
                      <span style={{ fontSize: 11, color: NORDIC.fog, fontWeight: 400 }}>
                        {catFlows.length} {catFlows.length === 1 ? 'Datensatz' : 'Datensätze'}
                      </span>
                    </div>
                    <div style={{ flex: 1, height: 1, background: `${meta.color}14`, marginLeft: 8 }} />
                  </div>

                  {/* Cards grid */}
                  <motion.div
                    variants={containerVariants}
                    className="grid gap-3"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}
                  >
                    {catFlows.map((f) => (
                      <motion.div key={f.id} variants={itemVariants}>
                        <DatasetCard flow={f} color={meta.color} />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )
            })}

            {/* Empty state */}
            {Object.keys(byCategory).length === 0 && (
              <motion.div
                variants={sectionVariants}
                className="flex flex-col items-center justify-center py-20 gap-2"
              >
                <svg width="32" height="32" viewBox="0 0 256 256">
                  <path d="M32 64h192M80 128h96M112 192h32" stroke={NORDIC.fog} strokeWidth="20" strokeLinecap="round"/>
                </svg>
                <p style={{ fontSize: 14, color: NORDIC.stone }}>
                  Keine Datensätze gefunden.
                </p>
                <button
                  onClick={() => { setSearch(''); handleCategoryClick(null) }}
                  style={{
                    marginTop: 8, fontSize: 13, color: NORDIC.slate,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Filter zurücksetzen
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FilterPill({ label, active, color, bg, onClick }: {
  label: string
  active: boolean
  color: string
  bg: string
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '5px 13px',
        borderRadius: 20,
        border: `1.5px solid ${active ? color : '#E2E8F0'}`,
        background: active ? bg : '#fff',
        color: active ? color : '#64748b',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        letterSpacing: active ? '0.01em' : 0,
      }}
    >
      {label}
    </motion.button>
  )
}

function DatasetCard({ flow, color }: { flow: Dataflow; color: string }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link to={`/dataset/${encodeURIComponent(flow.id)}`} style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{
          boxShadow: hovered
            ? '0 6px 20px -4px rgba(0,0,0,0.10)'
            : '0 1px 4px -2px rgba(0,0,0,0.05)',
          y: hovered ? -2 : 0,
        }}
        transition={{ duration: 0.18 }}
        style={{
          background: '#fff',
          border: `1px solid ${hovered ? color + '50' : '#E2E8F0'}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 10,
          padding: '14px 16px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          height: '100%',
        }}
      >
        <div style={{
          fontSize: 13, fontWeight: 600, color: NORDIC.navy,
          marginBottom: 5, lineHeight: 1.4,
        }}>
          {flow.name}
        </div>
        <div style={{ fontSize: 10, color: NORDIC.fog, fontFamily: 'monospace', letterSpacing: '0.03em', marginBottom: flow.description ? 6 : 0 }}>
          {flow.id} · v{flow.version}
        </div>
        {flow.description && (
          <div style={{
            fontSize: 12, color: '#64748b', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {flow.description}
          </div>
        )}
      </motion.div>
    </Link>
  )
}
