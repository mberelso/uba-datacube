import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDataflows, type Dataflow } from '../api/sdmx'
import { CATEGORIES, getCategoryMeta } from '../utils/categories'
import { GuidedTip } from '../components/GuidedTip'

export default function CatalogPage() {
  const [flows, setFlows] = useState<Dataflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchDataflows()
      .then(setFlows)
      .catch(() => setError('Fehler beim Laden der Datensätze.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = flows.filter((f) => {
    const matchCat = activeCategory ? f.category === activeCategory : true
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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
        Datenkatalog
      </h1>
      <p style={{ color: '#64748b', marginBottom: 16 }}>
        {flows.length} Datensätze des Umweltbundesamts – SDMX REST API
      </p>

      <GuidedTip
        id="catalog-tip"
        text="Wähle oben eine Themenkategorie oder suche nach einem Datensatz – dann öffne ihn und nutze die Presets für einen schnellen Einstieg."
      />

      <input
        type="search"
        placeholder="Datensatz suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
          fontSize: 14, marginBottom: 20, outline: 'none', background: '#fff',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
            borderColor: activeCategory === null ? '#1e3a5f' : '#e2e8f0',
            background: activeCategory === null ? '#1e3a5f' : '#fff',
            color: activeCategory === null ? '#fff' : '#475569',
            fontSize: 13, cursor: 'pointer', fontWeight: activeCategory === null ? 600 : 400,
          }}
        >
          Alle ({flows.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = flows.filter((f) => f.category === cat.id).length
          if (!count) return null
          const active = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(active ? null : cat.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: active ? cat.color : '#e2e8f0',
                background: active ? cat.bg : '#fff',
                color: active ? cat.color : '#475569',
                fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
              }}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <div style={{ fontSize: 32 }}>⏳</div>
          <p style={{ marginTop: 12 }}>Lade Datensätze…</p>
        </div>
      )}
      {error && <div style={{ color: '#dc2626', padding: 20 }}>{error}</div>}

      {!loading && !error && Object.entries(byCategory).map(([catId, catFlows]) => {
        const meta = getCategoryMeta(catId)
        return (
          <div key={catId} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 16, fontWeight: 700, color: meta.color,
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: `2px solid ${meta.color}20`,
              paddingBottom: 8, marginBottom: 12,
            }}>
              <span>{meta.icon}</span> {meta.label}
              <span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>
                {catFlows.length} Datensätze
              </span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {catFlows.map((f) => (
                <Link
                  key={f.id}
                  to={`/dataset/${encodeURIComponent(f.id)}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
                      padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
                      borderLeft: `4px solid ${meta.color}`,
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                      el.style.borderColor = meta.color
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.boxShadow = 'none'
                      el.style.borderColor = '#e2e8f0'
                      el.style.borderLeftColor = meta.color
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4, lineHeight: 1.4 }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {f.id} · v{f.version}
                    </div>
                    {f.description && (
                      <div style={{
                        fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {f.description}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
