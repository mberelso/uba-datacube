import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShareNetwork } from '@phosphor-icons/react'
import { HeatMap } from '../components/charts/HeatMap'
import { HeatRecords } from '../components/charts/HeatRecords'
import { SEO } from '../components/SEO'
import { SocialCardModal } from '../components/social/SocialCardModal'
import type { SocialCardData } from '../components/social/types'

const NORDIC = {
  navy:  '#1B2B3A',
  red:   '#dc2626',
  amber: '#f59e0b',
  stone: '#8C8880',
}

const HEAT_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Wie hat sich die Zahl der Heißen Tage in Deutschland seit 1951 verändert?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Die durchschnittliche Anzahl der Heißen Tage (Tageshöchsttemperatur >= 30 °C) in Deutschland hat sich seit den 1950er Jahren im bundesweiten Mittel mehr als verdreifacht.',
      },
    },
    {
      '@type': 'Question',
      name: 'Wo ist der Hitze-Hotspot in Deutschland?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Der Oberrheingraben (u. a. Karlsruhe, Mannheim, Freiburg) sowie Teile Ostdeutschlands (Berlin/Brandenburg) verzeichnen regelmäßig die höchsten Anzahlen an Heißen Tagen pro Jahr.',
      },
    },
    {
      '@type': 'Question',
      name: 'Woher stammen die Hitzedaten auf Umweltpuls?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Die Hitzedaten basieren auf den amtlichen 1-km-Rastermessungen und Stationsdaten des Deutschen Wetterdienstes (DWD), die automatisch aktualisiert werden.',
      },
    },
  ],
}

export default function HeatPage() {
  const [modalCard, setModalCard] = useState<SocialCardData | null>(null)

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      {modalCard && <SocialCardModal data={modalCard} onClose={() => setModalCard(null)} />}
      <SEO
        title="Hitze in Deutschland seit 1951"
        description="Animierte Landkreis-Karte: Wie sich Heiße Tage und Sommertage in Deutschland seit 1951 vermehrt haben — aus den 1-km-Rasterdaten des Deutschen Wetterdiensts, Jahr für Jahr."
        path="/hitze"
        image="https://www.umweltpuls.de/og-hitze.png"
        jsonLd={HEAT_FAQ_JSONLD}
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
              <circle cx="128" cy="150" r="64" fill={NORDIC.red} />
              <path d="M128 96 C104 64 152 52 128 16 C168 56 160 92 144 104" fill={NORDIC.amber} />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: NORDIC.red }}>
              KLIMAWANDEL
            </span>
          </div>
          <button
            onClick={() =>
              setModalCard({
                category: 'klima',
                metric: 'Verdreifacht',
                metricLabel: 'Anzahl Heiße Tage seit 1950',
                headline: 'Hitze in Deutschland seit 1951',
                story: 'Die Zahl der Heißen Tage (≥ 30 °C) hat sich im bundesweiten Mittel mehr als verdreifacht. Der Oberrheingraben und Brandenburg verzeichnen die höchsten Werte.',
                sparkline: [5, 7, 8, 12, 11, 15, 19],
                yearRange: '1951 – 2025',
                datasetId: 'dwd-heat',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-12 font-semibold transition-colors cursor-pointer border-0 shadow-sm"
          >
            <ShareNetwork size={14} weight="bold" />
            Hitze-Infografik teilen
          </button>
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, color: NORDIC.navy,
          letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: 6,
        }}>
          Hitze in Deutschland seit 1951
        </h1>
        <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400, maxWidth: 720, lineHeight: 1.6 }}>
          Die Zahl der Heißen Tage hat sich seit den 1950ern im Mittel mehr als verdreifacht. Diese Karte
          zeigt sie Landkreis für Landkreis — aus dem 1-km-Raster des Deutschen Wetterdiensts. Drücke auf
          Play und sieh zu, wie die Karte über die Jahrzehnte nachdunkelt, mit dem Oberrhein als
          Dauer-Hotspot und dem extremen Sommer 2003 als tiefroter Ausschlag.
        </p>
        <div style={{ width: 40, height: 3, background: NORDIC.red, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 md:p-8"
      >
        <HeatMap />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 md:p-8 mt-6"
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, color: NORDIC.navy, letterSpacing: '-0.4px', marginBottom: 6 }}>
          Wann hatte es schon über 30, 35 und 40 °C?
        </h2>
        <p style={{ fontSize: 14, color: NORDIC.stone, maxWidth: 720, lineHeight: 1.6, marginBottom: 20 }}>
          Pro Bundesland: die höchste je gemessene Temperatur und der früheste Tag im Jahr, an dem die
          jeweilige Hitzemarke je geknackt wurde — aus den Tagesmessungen aller DWD-Wetterstationen.
          Klicke auf eine Spaltenüberschrift zum Sortieren.
        </p>
        <HeatRecords />
      </motion.div>
    </div>
  )
}
