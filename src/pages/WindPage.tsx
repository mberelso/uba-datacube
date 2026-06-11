import { motion } from 'framer-motion'
import { WindTurbineMap } from '../components/charts/WindTurbineMap'
import { SEO } from '../components/SEO'

const NORDIC = {
  navy:  '#1B2B3A',
  mist:  '#7A9BAD',
  moss:  '#4A6741',
  stone: '#8C8880',
}

export default function WindPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="Windkraft-Ausbau in Deutschland"
        description="Animierte Karte: Wie sich die Windenergieanlagen in Deutschland seit 1990 entwickelt haben — alle Anlagen aus dem Marktstammdatenregister, Jahr für Jahr."
        path="/wind"
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
            <line x1="128" y1="128" x2="128" y2="232" stroke={NORDIC.mist} strokeWidth="18" strokeLinecap="round" />
            <path d="M128 128 L128 36" stroke={NORDIC.navy} strokeWidth="18" strokeLinecap="round" />
            <path d="M128 128 L208 174" stroke={NORDIC.navy} strokeWidth="18" strokeLinecap="round" />
            <path d="M128 128 L48 174" stroke={NORDIC.navy} strokeWidth="18" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: NORDIC.mist }}>
            ENERGIEWENDE
          </span>
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800, color: NORDIC.navy,
          letterSpacing: '-0.6px', lineHeight: 1.15, marginBottom: 6,
        }}>
          Der Windkraft-Ausbau seit 1990
        </h1>
        <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400, maxWidth: 720, lineHeight: 1.6 }}>
          Jeder Punkt ist eine Windenergieanlage aus dem Marktstammdatenregister der Bundesnetzagentur.
          Drücke auf Play und sieh zu, wie der Ausbau an der Küste beginnt, sich ins Binnenland
          ausbreitet — und wie der Zubau 2018 dramatisch einbricht, bevor er wieder Fahrt aufnimmt.
        </p>
        <div style={{ width: 40, height: 3, background: NORDIC.moss, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] p-6 md:p-8"
      >
        <WindTurbineMap />
      </motion.div>
    </div>
  )
}
