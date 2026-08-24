import { useState } from 'react'
import { ArrowSquareOut, BookOpen, MagnifyingGlass, CaretDown } from '@phosphor-icons/react'
import { getDatasetContent } from '../data/datasetContent'

interface Publication {
  title: string
  url: string
  description: string
  tag: string
}

// ─── Kuratierte Publikationen pro Datensatz ───────────────────────────────────

const DATASET_PUBLICATIONS: Record<string, Publication[]> = {
  DF_CLIMATE_EMISSIONS_GHG_TRENDS: [
    {
      title: 'Daten zu Treibhausgas-Emissionen',
      url: 'https://www.umweltbundesamt.de/themen/klima-energie/treibhausgas-emissionen/daten-zu-treibhausgas-emissionen',
      description: 'Detaillierte Fakten über Emissionen und Senken von Treibhausgasen in Deutschland.',
      tag: 'Datenblatt',
    },
    {
      title: 'Projektionsbericht 2023',
      url: 'https://www.umweltbundesamt.de/publikationen/projektionsbericht-2023-fuer-deutschland',
      description: 'Abschätzung zukünftiger Treibhausgasemissionen und Bewertung von Klimaschutzmaßnahmen.',
      tag: 'Bericht',
    },
  ],
  DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA: [
    {
      title: 'Klimawirkungs- und Risikoanalyse für Deutschland',
      url: 'https://www.umweltbundesamt.de/publikationen/KWRA-Zusammenfassung',
      description: 'Umfassende Analyse der Risiken durch den Klimawandel, inkl. zunehmender Waldbrandgefahr.',
      tag: 'Analyse',
    },
    {
      title: 'Waldzustand: Kronenverlichtung',
      url: 'https://www.umweltbundesamt.de/daten/flaeche-boden-land-oekosysteme/land-oekosysteme/waldzustand-kronenverlichtung',
      description: 'Offizielle Daten zum Zustand der Wälder in Deutschland.',
      tag: 'Daten',
    },
  ],
}

// ─── Kuratierte Publikationen pro Kategorie ───────────────────────────────────

const CATEGORY_PUBLICATIONS: Record<string, Publication[]> = {
  CLIMATE: [
    {
      title: 'Klimawandel in Deutschland',
      url: 'https://www.umweltbundesamt.de/themen/klima-energie/klimawandel',
      description: 'Überblick über Ursachen, Folgen und Anpassungsstrategien des Klimawandels in Deutschland.',
      tag: 'Übersicht',
    },
    {
      title: 'Indikator: Lufttemperatur',
      url: 'https://www.umweltbundesamt.de/daten/klima/lufttemperatur',
      description: 'Entwicklung der Lufttemperatur seit 1881 — Messreihen, Trends und Jahresmittel.',
      tag: 'Indikator',
    },
  ],
  AIR: [
    {
      title: 'Luftqualität in Deutschland',
      url: 'https://www.umweltbundesamt.de/themen/luft',
      description: 'Aktuelle Daten und Berichte zur Luftqualität, Schadstoffbelastung und deren Entwicklung.',
      tag: 'Übersicht',
    },
    {
      title: 'Nationale Luftschadstoff-Emissionsdaten',
      url: 'https://www.umweltbundesamt.de/themen/luft/emissionen-von-luftschadstoffen',
      description: 'Emissionen von Stickoxiden, Feinstaub, Schwefeldioxid und anderen Schadstoffen.',
      tag: 'Daten',
    },
  ],
  ENERGY: [
    {
      title: 'Erneuerbare Energien in Deutschland',
      url: 'https://www.umweltbundesamt.de/themen/klima-energie/erneuerbare-energien',
      description: 'Anteile, Entwicklung und Perspektiven erneuerbarer Energieträger in der Energieversorgung.',
      tag: 'Übersicht',
    },
    {
      title: 'Indikator: Erneuerbare Energien',
      url: 'https://www.umweltbundesamt.de/daten/energie/erneuerbare-energien',
      description: 'Statistiken zum Ausbau erneuerbarer Energien und deren Beitrag zur Energieversorgung.',
      tag: 'Indikator',
    },
  ],
  TRANSPORT: [
    {
      title: 'Verkehr & Umwelt',
      url: 'https://www.umweltbundesamt.de/themen/verkehr',
      description: 'Emissionen, Lärm und Flächenverbrauch durch Verkehr — Trends und Maßnahmen.',
      tag: 'Übersicht',
    },
  ],
  WATER: [
    {
      title: 'Wasser in Deutschland',
      url: 'https://www.umweltbundesamt.de/themen/wasser',
      description: 'Grundwasser, Oberflächengewässer und Trinkwasser — Zustand und Trends.',
      tag: 'Übersicht',
    },
    {
      title: 'Indikator: Gewässerqualität',
      url: 'https://www.umweltbundesamt.de/daten/wasser/gewaesserqualitaet',
      description: 'Chemischer und ökologischer Zustand der Flüsse und Seen in Deutschland.',
      tag: 'Indikator',
    },
  ],
  DAS: [
    {
      title: 'Wassertemperaturen und Klimawandel',
      url: 'https://www.umweltbundesamt.de/daten/wasser/wassertemperatur',
      description: 'Entwicklung der Wassertemperaturen in deutschen Flüssen und Seen.',
      tag: 'Daten',
    },
  ],
  WASTE: [
    {
      title: 'Abfall und Kreislaufwirtschaft',
      url: 'https://www.umweltbundesamt.de/themen/abfall-ressourcen',
      description: 'Abfallmengen, Recyclingquoten und Strategien zur Kreislaufwirtschaft.',
      tag: 'Übersicht',
    },
  ],
  AGRICULTURE: [
    {
      title: 'Landwirtschaft & Umwelt',
      url: 'https://www.umweltbundesamt.de/themen/boden-landwirtschaft',
      description: 'Stickstoffüberschüsse, Pestizide und die Auswirkungen der Landwirtschaft auf Böden und Gewässer.',
      tag: 'Übersicht',
    },
  ],
  AREA: [
    {
      title: 'Flächeninanspruchnahme',
      url: 'https://www.umweltbundesamt.de/daten/flaeche-boden-land-oekosysteme/flaeche/siedlungs-verkehrsflaeche',
      description: 'Entwicklung der Siedlungs- und Verkehrsfläche sowie Bodenversiegelung.',
      tag: 'Indikator',
    },
  ],
  ENV: [
    {
      title: 'Umwelt und Wirtschaft',
      url: 'https://www.umweltbundesamt.de/themen/wirtschaft-konsum/wirtschaft-umwelt',
      description: 'Umweltbezogene Steuern, Ausgaben für Umweltschutz und ökologische Gesamtrechnung.',
      tag: 'Übersicht',
    },
  ],
  CONSUMPTION: [
    {
      title: 'Konsum und Umwelt',
      url: 'https://www.umweltbundesamt.de/themen/wirtschaft-konsum/konsum',
      description: 'Ökologischer Fußabdruck, nachhaltiger Konsum und Ressourcenverbrauch.',
      tag: 'Übersicht',
    },
  ],
  CROSS: [
    {
      title: 'Klimaschutzziele und Projektionen',
      url: 'https://www.umweltbundesamt.de/themen/klima-energie/klimaschutz-energiepolitik-in-deutschland/klimaschutzziele-deutschlands',
      description: 'Klimaschutzziele Deutschlands, aktuelle Projektionen und Lückenanalysen.',
      tag: 'Bericht',
    },
  ],
  PRTR: [
    {
      title: 'Schadstofffreisetzungs- und -verbringungsregister',
      url: 'https://www.umweltbundesamt.de/themen/luft/emissionen-von-luftschadstoffen/schadstofffreisetzungs-verbringungsregister-prtr',
      description: 'Emissionen industrieller Anlagen — Daten aus dem europäischen PRTR.',
      tag: 'Register',
    },
  ],
}

// ─── Suchbegriff-Extraktion ───────────────────────────────────────────────────

function getSearchKeyword(flowId: string, flowName: string): string {
  const content = getDatasetContent(flowId)
  if (content?.headline) {
    // Ersten 4–5 Wörter der Headline als Suchbegriff
    return content.headline.replace(/[–—.!?].*/, '').trim().split(' ').slice(0, 5).join(' ')
  }
  // Fallback: flowName bereinigen (technische Präfixe entfernen)
  return flowName.replace(/^DF_[A-Z_]+_/i, '').replace(/_/g, ' ')
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function RelatedPublications({
  flowId, flowName, color, categoryId,
}: {
  flowId: string
  flowName: string
  color: string
  categoryId?: string
}) {
  const [open, setOpen] = useState(false)

  const datasetPubs = DATASET_PUBLICATIONS[flowId] ?? []
  const categoryPubs = categoryId ? (CATEGORY_PUBLICATIONS[categoryId] ?? []) : []
  const allPubs = [...datasetPubs, ...categoryPubs]
  const keyword = getSearchKeyword(flowId, flowName)

  const searchLinks = [
    {
      label: 'UBA-Publikationen',
      url: `https://www.umweltbundesamt.de/publikationen?search_api_views_fulltext=${encodeURIComponent(keyword)}`,
    },
    {
      label: 'Tagesschau',
      url: `https://www.tagesschau.de/suche?searchText=${encodeURIComponent(keyword)}`,
    },
    {
      label: 'Google News',
      url: `https://news.google.com/search?q=${encodeURIComponent(keyword + ' Deutschland')}&hl=de`,
    },
  ]

  const totalCount = allPubs.length

  return (
    <div
      className="bg-white rounded-2xl border mb-5 overflow-hidden transition-colors"
      style={{ borderColor: open ? `${color}40` : '#e2e8f0' }}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left cursor-pointer border-0 transition-colors"
        style={{ background: open ? `${color}06` : 'transparent' }}
      >
        <BookOpen size={15} weight="duotone" style={{ color, flexShrink: 0 }} />
        <span className="text-[13px] font-semibold text-[#1B2B3A]">
          Weiterführende Quellen & Nachrichten
        </span>
        {totalCount > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: color }}
          >
            {totalCount}
          </span>
        )}
        <CaretDown
          size={12}
          className="ml-auto text-slate-400 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>

      {/* Content */}
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">

          {/* Publikationen */}
          {allPubs.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">
                UBA-Publikationen & Berichte
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPubs.map((pub, i) => (
                  <a
                    key={i}
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl border border-slate-200 bg-slate-50 p-4 no-underline hover:border-current hover:bg-white transition-all"
                    style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ color, background: `${color}15` }}
                      >
                        {pub.tag}
                      </span>
                      <ArrowSquareOut size={12} className="text-slate-400 shrink-0 mt-0.5 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <div className="text-[13px] font-semibold text-[#0f172a] leading-snug mb-1.5">
                      {pub.title}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                      {pub.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Aktuelle Suche */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2.5">
              Aktuelle Meldungen suchen
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
              <span className="text-[11px] text-slate-400">Suchbegriff: </span>
              <span className="text-[12px] font-semibold text-[#1B2B3A]">„{keyword}"</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchLinks.map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600 no-underline hover:text-[#1B2B3A] hover:border-slate-400 transition-all"
                >
                  <MagnifyingGlass size={11} />
                  {label}
                  <ArrowSquareOut size={10} className="text-slate-400" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
