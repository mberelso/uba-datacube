import { Link } from 'react-router-dom'
import { Flame, Wind, Sun, Lightning, ArrowsLeftRight, MapPin, ArrowRight } from '@phosphor-icons/react'
import { BUNDESLAENDER } from '../utils/bundeslaender'

interface ExploreFurtherSectionProps {
  currentPage?: 'hitze' | 'wind' | 'solar'
}

export function ExploreFurtherSection({ currentPage }: ExploreFurtherSectionProps) {
  const states = Object.values(BUNDESLAENDER).sort((a, b) => a.name.localeCompare(b.name, 'de'))

  const tools = [
    {
      id: 'hitze',
      to: '/hitze',
      title: 'Hitze-Karte seit 1951',
      desc: 'Heiße Tage & Sommertage für alle 400 Landkreise (DWD-Raster)',
      Icon: Flame,
      color: 'text-rose-600 bg-rose-50 border-rose-200/80',
    },
    {
      id: 'wind',
      to: '/wind',
      title: 'Windkraft-Ausbau seit 1990',
      desc: 'Über 30.000 Windenergieanlagen aus dem Marktstammdatenregister',
      Icon: Wind,
      color: 'text-sky-600 bg-sky-50 border-sky-200/80',
    },
    {
      id: 'solar',
      to: '/solar',
      title: 'Solar-Ausbau seit 2000',
      desc: 'Über 4 Mio. PV-Anlagen je Landkreis & Freiflächen-Solarparks',
      Icon: Sun,
      color: 'text-amber-600 bg-amber-50 border-amber-200/80',
    },
    {
      id: 'mispel',
      to: '/mispel',
      title: 'MiSpeL-Simulator (Heimspeicher)',
      desc: 'BNetzA-Pauschalrechner für PV-Anlagen bis 30 kWp (ab 01.10.2026)',
      Icon: Lightning,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    },
    {
      id: 'vergleich',
      to: '/vergleich',
      title: 'Interaktiver Datenvergleich',
      desc: 'Zwei Umwelt-Indikatoren frei auf einer Zeitachse kombinieren',
      Icon: ArrowsLeftRight,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
    },
  ].filter(t => t.id !== currentPage)

  return (
    <section className="mt-10 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.05)] p-6 md:p-8">
      <div className="mb-6">
        <div className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">
          Weiterführende Analysen
        </div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Weitere interaktive Karten & Bundesland-Steckbriefe
        </h2>
      </div>

      {/* Werkzeug-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        {tools.map(({ id, to, title, desc, Icon, color }) => (
          <Link
            key={id}
            to={to}
            className="group rounded-xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/50 hover:bg-white p-4 transition-all flex flex-col justify-between"
          >
            <div>
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${color}`}>
                <Icon size={17} weight="fill" />
              </div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors flex items-center justify-between gap-1">
                <span>{title}</span>
                <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* 16 Bundesländer Direkt-Links */}
      <div className="pt-5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
          <MapPin size={14} weight="fill" className="text-sky-600" />
          <span>Klima & Energie in deinem Bundesland (alle 16 Steckbriefe):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {states.map((st) => (
            <Link
              key={st.code}
              to={`/regionen/${st.slug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/80 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-transparent hover:border-sky-200 text-[11px] font-medium transition-colors"
            >
              <span>{st.icon}</span>
              <span>{st.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

