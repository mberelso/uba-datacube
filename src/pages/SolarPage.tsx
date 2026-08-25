import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShareNetwork } from '@phosphor-icons/react'
import { SolarMap } from '../components/charts/SolarMap'
import { SEO } from '../components/SEO'
import { SocialCardModal } from '../components/social/SocialCardModal'
import type { SocialCardData } from '../components/social/types'

const NORDIC = {
  navy:  '#1B2B3A',
  amber: '#f59e0b',
  sun:   '#ea580c',
  stone: '#8C8880',
}

export default function SolarPage() {
  const [modalCard, setModalCard] = useState<SocialCardData | null>(null)

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      {modalCard && <SocialCardModal data={modalCard} onClose={() => setModalCard(null)} />}
      <SEO
        title="Solar-Ausbau in Deutschland"
        description="Animierte Karte: Wie sich die Photovoltaik in Deutschland seit 2000 ausgebreitet hat — über 4 Millionen Anlagen aus dem Marktstammdatenregister, Landkreis für Landkreis."
        path="/solar"
        image="https://www.umweltpuls.de/og-solar.png"
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
              <circle cx="128" cy="128" r="52" fill={NORDIC.amber} />
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i * Math.PI) / 4
                return (
                  <line
                    key={i}
                    x1={128 + Math.cos(a) * 74} y1={128 + Math.sin(a) * 74}
                    x2={128 + Math.cos(a) * 100} y2={128 + Math.sin(a) * 100}
                    stroke={NORDIC.sun} strokeWidth="16" strokeLinecap="round"
                  />
                )
              })}
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: NORDIC.sun }}>
              ENERGIEWENDE
            </span>
          </div>
          <button
            onClick={() =>
              setModalCard({
                category: 'energie',
                metric: '> 80 GW',
                metricLabel: 'Installierte Solarleistung in Deutschland',
                headline: 'Der Solar-Boom seit 2000',
                story: 'Über 4 Millionen Photovoltaik-Anlagen stehen auf deutschen Dächern und Feldern. Bayern ist Spitzenreiter mit über 21 GW installierter PV-Kapazität.',
                sparkline: [5, 12, 28, 45, 60, 75, 88],
                yearRange: '2000 – 2026',
                datasetId: 'mastr-solar',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-12 font-semibold transition-colors cursor-pointer border-0 shadow-sm"
          >
            <ShareNetwork size={14} weight="bold" />
            Solar-Infografik teilen
          </button>
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, color: NORDIC.navy,
          letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: 6,
        }}>
          Der Solar-Ausbau seit 2000
        </h1>
        <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400, maxWidth: 720, lineHeight: 1.6 }}>
          Über vier Millionen Photovoltaik-Anlagen stehen heute in Deutschland — auf Dächern, an
          Fassaden, auf Feldern und Balkonen. Die Einfärbung zeigt die installierte Leistung je
          Landkreis, die Punkte die großen Freiflächen-Solarparks. Drücke auf Play und sieh, wie aus
          dem EEG-Boom der frühen 2010er der explosionsartige Zubau ab 2022 wird.
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Datenstand: 23.06.2026 · Marktstammdatenregister (Bundesnetzagentur)</span>
        </div>
        <div style={{ width: 40, height: 3, background: NORDIC.amber, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 md:p-8"
      >
        <SolarMap />
      </motion.div>
    </div>
  )
}
