import { Link } from 'react-router-dom'
import { Coffee, Lightning, MapPin, ArrowsLeftRight, Flame, Wind, Sun } from '@phosphor-icons/react'

/**
 * Globaler Footer — auf jeder Seite sichtbar (außer der Render-Seite
 * /social-preview, siehe App.tsx). Hält Impressum & Datenschutz von überall
 * aus auffindbar (rechtliche Anforderung), verlinkt alle Hauptwerkzeuge
 * und bietet einen prominenten Ko-Fi-Unterstützungsbutton.
 */
export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 mt-16">
      <div className="max-w-[1200px] mx-auto px-5 py-8 flex flex-col gap-5">
        {/* Top Row: Projekt-Info + Ko-Fi Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-slate-800">
              Umweltpuls · Offene Umweltdaten für Deutschland
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl">
              Kostenlos, werbefrei und quelloffen. Kein offizielles Angebot des Umweltbundesamts — ein unabhängiges Bürger-Werkzeug.
            </p>
          </div>
          <a
            href="https://ko-fi.com/mberelso"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-800 text-xs font-semibold transition-colors shrink-0"
          >
            <Coffee size={15} weight="fill" className="text-amber-600" />
            <span>Projekt auf Ko-Fi unterstützen</span>
          </a>
        </div>

        {/* Bottom Row: Werkzeug-Links & Rechtliches */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Link to="/mispel" className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 font-semibold transition-colors">
              <Lightning size={12} weight="fill" /> MiSpeL-Simulator
            </Link>
            <span>·</span>
            <Link to="/regionen" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
              <MapPin size={12} weight="bold" /> Bundesländer-Check
            </Link>
            <span>·</span>
            <Link to="/vergleich" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowsLeftRight size={12} weight="bold" /> Datenvergleich
            </Link>
            <span>·</span>
            <Link to="/hitze" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
              <Flame size={12} weight="fill" className="text-rose-500" /> Hitze-Karte
            </Link>
            <span>·</span>
            <Link to="/wind" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
              <Wind size={12} weight="bold" className="text-sky-600" /> Wind-Karte
            </Link>
            <span>·</span>
            <Link to="/solar" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
              <Sun size={12} weight="fill" className="text-amber-500" /> Solar-Karte
            </Link>
            <span>·</span>
            <Link to="/catalog" className="text-slate-500 hover:text-slate-800 transition-colors">
              Datenkatalog
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>
              Quelle:{' '}
              <a
                href="https://datacube.uba.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                UBA Datacube
              </a>
            </span>
            <span>·</span>
            <Link to="/about#impressum" className="text-slate-500 hover:text-slate-800 transition-colors">
              Impressum
            </Link>
            <span>·</span>
            <Link to="/about#datenschutz" className="text-slate-500 hover:text-slate-800 transition-colors">
              Datenschutz
            </Link>
            <span>·</span>
            <Link to="/about" className="text-slate-400 hover:text-slate-600 transition-colors">
              Über das Projekt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
