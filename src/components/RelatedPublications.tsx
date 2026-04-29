import { useState } from 'react'

interface Publication {
  title: string
  url: string
  description: string
  icon: string
  tag: string
}

const PUBLICATION_MAPPINGS: Record<string, Publication[]> = {
  'DF_CLIMATE_EMISSIONS_GHG_TRENDS': [
    {
      title: 'Nationaler Inventarbericht zum Deutschen Treibhausgasinventar',
      url: 'https://www.umweltbundesamt.de/publikationen/berichterstattung-unter-der-klimarahmenkonvention-1',
      description: 'Detaillierter Bericht über die Emissionen und Senken von Treibhausgasen in Deutschland.',
      icon: '📊',
      tag: 'Studie'
    },
    {
      title: 'Projektionsbericht der Bundesregierung',
      url: 'https://www.umweltbundesamt.de/publikationen/projektionsbericht-der-bundesregierung-2023',
      description: 'Abschätzung der zukünftigen Treibhausgasemissionen und Bewertung von Klimaschutzmaßnahmen.',
      icon: '🔮',
      tag: 'Bericht'
    },
    {
      title: 'Klimaschutz in Zahlen',
      url: 'https://www.umweltbundesamt.de/themen/klima-energie/klimaschutz-energiepolitik-in-deutschland/treibhausgas-emissionen/klimaschutz-in-zahlen',
      description: 'Fakten, Trends und Impulse deutscher Klimapolitik kompakt zusammengefasst.',
      icon: '📈',
      tag: 'Faktenblatt'
    }
  ],
  'DF_AGRICULTURE_FORESTRY_FOREST_FIRE_AREA': [
    {
      title: 'Klimawirkungs- und Risikoanalyse für Deutschland',
      url: 'https://www.umweltbundesamt.de/publikationen/klimawirkungs-risikoanalyse-2021-fuer-deutschland',
      description: 'Umfassende Analyse der Risiken durch den Klimawandel, inkl. zunehmender Waldbrandgefahr.',
      icon: '🔥',
      tag: 'Analyse'
    },
    {
      title: 'Waldzustandsbericht',
      url: 'https://www.umweltbundesamt.de/daten/land-forstwirtschaft/waldzustand',
      description: 'Offizielle Daten und Berichte zum Zustand der Wälder in Deutschland und den Folgen von Dürren.',
      icon: '🌲',
      tag: 'Daten'
    }
  ]
}

export default function RelatedPublications({ flowId, flowName, color }: { flowId: string, flowName: string, color: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const publications = PUBLICATION_MAPPINGS[flowId]

  return (
    <div style={{
      background: '#fff', 
      borderRadius: 12, 
      border: `1.5px solid ${isExpanded ? color : '#e2e8f0'}`,
      marginBottom: 24,
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: isExpanded ? `${color}08` : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📚</span>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>
            Passende UBA-Publikationen & Studien
          </h3>
          {publications && (
            <span style={{ 
              background: color, 
              color: '#fff', 
              fontSize: 11, 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: 12 
            }}>
              {publications.length}
            </span>
          )}
        </div>
        <div style={{ 
          color: '#64748b', 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
          transition: 'transform 0.3s' 
        }}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div style={{ padding: '0 24px 24px', borderTop: `1px solid ${color}20` }}>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 16, marginBottom: 20 }}>
            Vertiefe deine Analyse mit offiziellen Hintergrundberichten, Studien und Pressemitteilungen des Umweltbundesamtes zu diesem Thema.
          </p>

          {publications ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {publications.map((pub, idx) => (
                <a
                  key={idx}
                  href={pub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 16,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = color
                    e.currentTarget.style.boxShadow = `0 4px 12px ${color}15`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{pub.icon}</span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5,
                      color: color,
                      background: `${color}15`,
                      padding: '3px 8px',
                      borderRadius: 4
                    }}>
                      {pub.tag}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>
                    {pub.title}
                  </h4>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    {pub.description}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: 10, 
              padding: 24, 
              textAlign: 'center',
              border: '1px dashed #cbd5e1'
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
                Entdecke mehr zum Thema
              </h4>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 400, margin: '0 auto 16px' }}>
                Suche direkt in der umfangreichen Publikationsdatenbank des UBA nach weiteren Studien, Berichten und Daten zu "{flowName}".
              </p>
              <a 
                href={`https://www.umweltbundesamt.de/publikationen?search_api_views_fulltext=${encodeURIComponent(flowName)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: color,
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  padding: '10px 20px',
                  borderRadius: 8,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                In UBA-Publikationen suchen ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
