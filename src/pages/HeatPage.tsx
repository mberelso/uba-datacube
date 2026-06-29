import { motion } from 'framer-motion'
import { HeatMap } from '../components/charts/HeatMap'
import { HeatRecords } from '../components/charts/HeatRecords'
import { SEO } from '../components/SEO'

const NORDIC = {
  navy:  '#1B2B3A',
  red:   '#dc2626',
  amber: '#f59e0b',
  stone: '#8C8880',
}

export default function HeatPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="Hitze in Deutschland seit 1951"
        description="Animierte Landkreis-Karte: Wie sich Heiße Tage und Sommertage in Deutschland seit 1951 vermehrt haben — aus den 1-km-Rasterdaten des Deutschen Wetterdiensts, Jahr für Jahr."
        path="/hitze"
        image="https://www.umweltpuls.de/og-hitze.png"
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
            <circle cx="128" cy="150" r="64" fill={NORDIC.red} />
            <path d="M128 96 C104 64 152 52 128 16 C168 56 160 92 144 104" fill={NORDIC.amber} />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: NORDIC.red }}>
            KLIMAWANDEL
          </span>
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
