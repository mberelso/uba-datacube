import { Link } from 'react-router-dom'

/**
 * Globaler Footer — auf jeder Seite sichtbar (außer der Render-Seite
 * /social-preview, siehe App.tsx). Hält Impressum & Datenschutz von überall
 * aus auffindbar (rechtliche Anforderung) und weist auf die Datenquelle hin.
 */
export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 mt-12">
      <div className="max-w-[1200px] mx-auto px-5 py-6 text-[11px] text-slate-400 text-center leading-relaxed">
        Datenquelle:{' '}
        <a
          href="https://datacube.uba.de"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          Umweltbundesamt Datacube
        </a>
        {' · '}SDMX REST API: daten.uba.de
        {' · '}
        <Link to="/about#impressum" className="text-slate-400 hover:text-slate-600 transition-colors">
          Impressum
        </Link>
        {' · '}
        <Link to="/about#datenschutz" className="text-slate-400 hover:text-slate-600 transition-colors">
          Datenschutz
        </Link>
        {' · '}
        <a
          href="https://ko-fi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600/80 hover:text-amber-600 transition-colors font-medium"
        >
          ☕ Projekt unterstützen
        </a>
        {' · '}
        <Link to="/about" className="text-slate-400 hover:text-slate-600 transition-colors">
          Kein UBA-Angebot
        </Link>
      </div>
    </footer>
  )
}
