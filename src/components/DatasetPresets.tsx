
export interface Preset {
  title: string
  icon: string
  description: string
  filters: Record<string, string>
  /** Code-IDs für den Lazy-Load-Modus (dim-ID → SDMX code) */
  lazyFilters?: Record<string, string>
}

const GHG_PRESETS: Preset[] = [
  {
    title: "Hauptemittent: Energiewirtschaft",
    icon: "🏭",
    description: "Gigantische Emissionen, primär aus Kohle- und Gaskraftwerken.",
    filters: { "Quellgruppen": "1 A 1, Energiewirtschaft", "Substanzen": "Treibhausgase", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "1A1", D_SUBSTANCES: "GHG", D_UNIT: "MT" },
  },
  {
    title: "Fokus: Stromerzeugung",
    icon: "⚡",
    description: "Der absolute Löwenanteil innerhalb der Energiewirtschaft.",
    filters: { "Quellgruppen": "1 A 1 a i, Stromerzeugung", "Substanzen": "Kohlendioxid" },
    lazyFilters: { D_SOURCE_CATEGORIES: "1A1ai", D_SUBSTANCES: "CO2", D_UNIT: "MT" },
  },
  {
    title: "Problem-Sektor: PKW",
    icon: "🚗",
    description: "Der eigentliche Treiber im Straßenverkehr, der extrem langsam sinkt.",
    filters: { "Quellgruppen": "1 A 3 b i, Pkw", "Substanzen": "Kohlendioxid", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "1A3bi", D_SUBSTANCES: "CO2", D_UNIT: "MT" },
  },
  {
    title: "Landwirtschaft: Rinderhaltung",
    icon: "🐄",
    description: "Der massive Einfluss der Verdauungsprozesse (Methan).",
    filters: { "Quellgruppen": "3 A 1, Rinder", "Substanzen": "Methan", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "3A1", D_SUBSTANCES: "CH4", D_UNIT: "MT" },
  },
  {
    title: "Privates Heizen",
    icon: "🏠",
    description: "Direkte Emissionen aus Öl- und Gasheizungen (reagiert auf warme/kalte Winter).",
    filters: { "Quellgruppen": "1 A 4 b i, Wohngebäude", "Substanzen": "Kohlendioxid", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "1A4bi", D_SUBSTANCES: "CO2", D_UNIT: "MT" },
  },
  {
    title: "Chemische Falle: Zementindustrie",
    icon: "🏗️",
    description: "CO2 entsteht hier chemisch beim Brennen von Kalkstein, nicht nur durch Energiebedarf.",
    filters: { "Quellgruppen": "2 A 1, Zementherstellung", "Substanzen": "Kohlendioxid", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "2A1", D_SUBSTANCES: "CO2", D_UNIT: "MT" },
  },
  {
    title: "Altlasten: Mülldeponien",
    icon: "🗑️",
    description: "Historische Deponien emittieren auch heute noch gigantische Mengen an Methan.",
    filters: { "Quellgruppen": "5 A, Deponierung von festen Abfällen", "Substanzen": "Methan", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "5A", D_SUBSTANCES: "CH4", D_UNIT: "MT" },
  },
  {
    title: "Zivile Luftfahrt (Inland)",
    icon: "✈️",
    description: "Nationale Flüge (internationale Flüge fehlen in dieser UNFCCC-Metrik).",
    filters: { "Quellgruppen": "1 A 3 a, Zivile Luftfahrt", "Substanzen": "Kohlendioxid", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "1A3aii", D_SUBSTANCES: "CO2", D_UNIT: "MT" },
  },
  {
    title: "Unsichtbare Gefahr: Kältemittel",
    icon: "❄️",
    description: "Extrem klimaschädliche Gase (HFCs) aus alten Klimaanlagen und Kühlschränken.",
    filters: { "Quellgruppen": "2 F 1, Kälte- und Klimaanlagen", "Substanzen": "HFCs" },
    lazyFilters: { D_SOURCE_CATEGORIES: "2F1", D_SUBSTANCES: "HFC" },
  },
  {
    title: "Die CO2-Senke: Wälder",
    icon: "🌲",
    description: "Der einzige Sektor mit oft negativen Werten (CO2-Speicherung), der aber unter Dürren leidet.",
    filters: { "Quellgruppen": "4 A, Waldland", "Substanzen": "Kohlendioxid", "Einheit": "Millionen Tonnen" },
    lazyFilters: { D_SOURCE_CATEGORIES: "4A", D_SUBSTANCES: "CO2", D_UNIT: "MT" },
  },
]

export function DatasetPresets({
  flowId,
  onApplyPreset,
}: {
  flowId: string
  onApplyPreset: (filters: Record<string, string>, lazyFilters?: Record<string, string>) => void
}) {
  if (flowId !== 'DF_CLIMATE_EMISSIONS_GHG_TRENDS') return null

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>✨</span> Top 10 Einblicke & Filter-Presets
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {GHG_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => onApplyPreset(preset.filters, preset.lazyFilters)}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '12px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.15)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {preset.icon} {preset.title}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
              {preset.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
