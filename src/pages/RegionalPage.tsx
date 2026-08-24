import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Flame, Wind, Sun, Factory,
  CaretRight, CheckCircle, Scales, MagnifyingGlass
} from '@phosphor-icons/react'
import { BUNDESLAENDER, type BundeslandInfo } from '../utils/bundeslaender'
import { SEO } from '../components/SEO'

const NORDIC = {
  navy:  '#1B2B3A',
  red:   '#dc2626',
  amber: '#f59e0b',
  green: '#16a34a',
  blue:  '#0284c7',
  stone: '#8C8880',
}

const REGIONAL_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Welches Bundesland hat die meisten Heißen Tage?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Brandenburg, Berlin, Baden-Württemberg und Sachsen-Anhalt verzeichnen im Durchschnitt die meisten Heißen Tage (Tageshöchsttemperatur >= 30 °C) pro Jahr.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welches Bundesland führt beim Windkraft-Ausbau?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Niedersachsen ist mit über 12,9 GW installierter Windleistung der absolute Spitzenreiter, gefolgt von Brandenburg und Schleswig-Holstein.',
      },
    },
    {
      '@type': 'Question',
      name: 'Welches Bundesland erzeugt die meiste Solarenergie?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Bayern liegt beim Photovoltaik-Ausbau mit über 21 GW installierter Leistung mit großem Abstand auf Platz 1 in Deutschland.',
      },
    },
  ],
}

export default function RegionalPage() {
  const [selectedCode, setSelectedCode] = useState<string>('NW') // Default to NRW or user selection
  const [search, setSearch] = useState<string>('')
  const [sortKey, setSortKey] = useState<'hotDaysAvg' | 'windCapacityMw' | 'solarCapacityMw' | 'prtrEmissionsKt'>('hotDaysAvg')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  const statesList = useMemo(() => Object.values(BUNDESLAENDER), [])

  const filteredStates = useMemo(() => {
    if (!search.trim()) return statesList
    const q = search.toLowerCase()
    return statesList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.capital.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    )
  }, [statesList, search])

  const sortedStates = useMemo(() => {
    return [...statesList].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      return sortAsc ? valA - valB : valB - valA
    })
  }, [statesList, sortKey, sortAsc])

  const selectedState: BundeslandInfo = BUNDESLAENDER[selectedCode] || BUNDESLAENDER['NW']

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="Regional-Explorer — Wie grün ist dein Bundesland?"
        description="Vergleiche Klimadaten, Hitzetage, Windkraft- und Solarausbau sowie Industrie-Emissionen aller 16 deutschen Bundesländer im Detail."
        path="/regionen"
        image="https://www.umweltpuls.de/og-image.png"
        jsonLd={REGIONAL_FAQ_JSONLD}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={18} weight="bold" style={{ color: NORDIC.blue }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: NORDIC.blue }}>
            REGIONAL-DASHBOARD
          </span>
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: NORDIC.navy,
            letterSpacing: '-0.6px',
            lineHeight: 1.15,
            marginBottom: 6,
          }}
        >
          Wie grün ist dein Bundesland?
        </h1>
        <p style={{ fontSize: 14, color: NORDIC.stone, fontWeight: 400, maxWidth: 780, lineHeight: 1.6 }}>
          Hitze-Hotspots, Windräder, Solarparks und Industrie-Emissionen: Wähle ein Bundesland aus, um alle lokalen
          Klimadaten des Umweltbundesamts und des Wetterdiensts auf einen Blick zu analysieren.
        </p>
        <div style={{ width: 40, height: 3, background: NORDIC.blue, borderRadius: 2, marginTop: 14 }} />
      </motion.div>

      {/* Quick Bundesland Grid Selector */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">
            Bundesland wählen (16 Bundesländer)
          </span>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Bundesland suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {filteredStates.map((st) => {
            const isSelected = st.code === selectedCode
            return (
              <button
                key={st.code}
                onClick={() => setSelectedCode(st.code)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-18 mb-0.5">{st.icon}</span>
                <span className="text-[12px] font-bold leading-tight truncate w-full">{st.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {st.code}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected State Dashboard View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedState.code}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="mb-12"
        >
          {/* Main State Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2 bg-white/10 rounded-2xl backdrop-blur-sm">
                  {selectedState.icon}
                </span>
                <div>
                  <h2 className="text-24 font-extrabold tracking-tight flex items-center gap-2">
                    {selectedState.name}
                    <span className="text-12 font-mono px-2 py-0.5 rounded bg-white/15 text-slate-200">
                      {selectedState.code}
                    </span>
                  </h2>
                  <p className="text-13 text-slate-300">
                    Landeshauptstadt: <strong className="text-white">{selectedState.capital}</strong> · Population: {selectedState.population} · Fläche: {selectedState.areaKm2}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/hitze`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-12 font-medium transition-colors no-underline"
                >
                  <Flame size={14} className="text-rose-400" />
                  Hitze-Karte
                </Link>
                <Link
                  to={`/wind`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-12 font-medium transition-colors no-underline"
                >
                  <Wind size={14} className="text-sky-400" />
                  Wind-Karte
                </Link>
                <Link
                  to={`/solar`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-12 font-medium transition-colors no-underline"
                >
                  <Sun size={14} className="text-amber-400" />
                  Solar-Karte
                </Link>
              </div>
            </div>

            <p className="text-14 text-slate-200 leading-relaxed max-w-3xl font-light">
              {selectedState.description}
            </p>
          </div>

          {/* 4 Key Indicator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Card 1: Hitze */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-11 font-bold tracking-wider text-rose-600 uppercase flex items-center gap-1">
                  <Flame size={14} /> Heiße Tage
                </span>
                <span className="text-10 font-mono bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                  DWD Messnetz
                </span>
              </div>
              <div className="text-28 font-extrabold text-slate-900 tracking-tight mb-1">
                {selectedState.hotDaysAvg}{' '}
                <span className="text-13 font-normal text-slate-500">Tage / Jahr</span>
              </div>
              <div className="text-12 text-slate-600 mb-3">
                All-Time Rekord: <strong className="text-rose-600">{selectedState.allTimeRecord.temp} °C</strong> ({selectedState.allTimeRecord.year}, {selectedState.allTimeRecord.location})
              </div>
              <Link
                to="/hitze"
                className="text-11 font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 no-underline"
              >
                In Hitze-Karte ansehen <CaretRight size={12} />
              </Link>
            </div>

            {/* Card 2: Windkraft */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-11 font-bold tracking-wider text-sky-600 uppercase flex items-center gap-1">
                  <Wind size={14} /> Windenergie
                </span>
                <span className="text-10 font-mono bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">
                  MaStR
                </span>
              </div>
              <div className="text-28 font-extrabold text-slate-900 tracking-tight mb-1">
                {selectedState.windCapacityMw.toLocaleString('de-DE')}{' '}
                <span className="text-13 font-normal text-slate-500">MW</span>
              </div>
              <div className="text-12 text-slate-600 mb-3">
                Installierte Leistung an Land (Onshore)
              </div>
              <Link
                to="/wind"
                className="text-11 font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 no-underline"
              >
                Windpark-Karte öffnen <CaretRight size={12} />
              </Link>
            </div>

            {/* Card 3: Solarenergie */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-11 font-bold tracking-wider text-amber-600 uppercase flex items-center gap-1">
                  <Sun size={14} /> Photovoltaik
                </span>
                <span className="text-10 font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                  MaStR
                </span>
              </div>
              <div className="text-28 font-extrabold text-slate-900 tracking-tight mb-1">
                {selectedState.solarCapacityMw.toLocaleString('de-DE')}{' '}
                <span className="text-13 font-normal text-slate-500">MW</span>
              </div>
              <div className="text-12 text-slate-600 mb-3">
                Gesamte PV-Leistung (Dach & Freifläche)
              </div>
              <Link
                to="/solar"
                className="text-11 font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 no-underline"
              >
                Solar-Karte erkunden <CaretRight size={12} />
              </Link>
            </div>

            {/* Card 4: PRTR Industrie */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-11 font-bold tracking-wider text-emerald-600 uppercase flex items-center gap-1">
                  <Factory size={14} /> PRTR Emissionen
                </span>
                <span className="text-10 font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                  UBA Register
                </span>
              </div>
              <div className="text-28 font-extrabold text-slate-900 tracking-tight mb-1">
                {selectedState.prtrEmissionsKt.toLocaleString('de-DE')}{' '}
                <span className="text-13 font-normal text-slate-500">kt / Jahr</span>
              </div>
              <div className="text-12 text-slate-600 mb-3">
                Gemeldete Industrie-Schadstoffe
              </div>
              <Link
                to={`/dataset/DF_PRTR?lazy=${encodeURIComponent(JSON.stringify({ D_FEDERAL_STATES: selectedState.code }))}`}
                className="text-11 font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 no-underline"
              >
                PRTR-Register filtern <CaretRight size={12} />
              </Link>
            </div>
          </div>

          {/* Highlights & Particularities */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-15 font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              Regionale Besonderheiten & Klimafakten für {selectedState.name}
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 margin-0 padding-0 list-none">
              {selectedState.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-13 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-sky-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Comparison Table across all 16 States */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-18 font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Scales size={20} className="text-sky-600" />
              Alle 16 Bundesländer im direkten Vergleich
            </h3>
            <p className="text-12 text-slate-500">
              Klicke auf die Spaltenköpfe, um die Liste nach Hitze, Wind- oder Solarleistung zu sortieren.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-13">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-11 font-bold uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4">Bundesland</th>
                <th
                  onClick={() => {
                    if (sortKey === 'hotDaysAvg') setSortAsc(!sortAsc)
                    else { setSortKey('hotDaysAvg'); setSortAsc(false) }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-rose-500" /> Heiße Tage / Jahr {sortKey === 'hotDaysAvg' && (sortAsc ? '▲' : '▼')}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'windCapacityMw') setSortAsc(!sortAsc)
                    else { setSortKey('windCapacityMw'); setSortAsc(false) }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <Wind size={14} className="text-sky-500" /> Windkraft (MW) {sortKey === 'windCapacityMw' && (sortAsc ? '▲' : '▼')}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'solarCapacityMw') setSortAsc(!sortAsc)
                    else { setSortKey('solarCapacityMw'); setSortAsc(false) }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <Sun size={14} className="text-amber-500" /> Solar (MW) {sortKey === 'solarCapacityMw' && (sortAsc ? '▲' : '▼')}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortKey === 'prtrEmissionsKt') setSortAsc(!sortAsc)
                    else { setSortKey('prtrEmissionsKt'); setSortAsc(false) }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <Factory size={14} className="text-emerald-500" /> PRTR Emissionen {sortKey === 'prtrEmissionsKt' && (sortAsc ? '▲' : '▼')}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedStates.map((st) => {
                const isSelected = st.code === selectedCode
                return (
                  <tr
                    key={st.code}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-sky-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 flex items-center gap-2">
                      <span className="text-18">{st.icon}</span>
                      <div>
                        <div className="text-slate-900 font-bold">{st.name}</div>
                        <div className="text-11 text-slate-400 font-mono">{st.code} · {st.capital}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-bold">
                      {st.hotDaysAvg} <span className="text-11 text-slate-400 font-normal">Tage</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-700">
                      {st.windCapacityMw.toLocaleString('de-DE')} <span className="text-11 text-slate-400 font-normal">MW</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-700">
                      {st.solarCapacityMw.toLocaleString('de-DE')} <span className="text-11 text-slate-400 font-normal">MW</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700">
                      {st.prtrEmissionsKt.toLocaleString('de-DE')} <span className="text-11 text-slate-400 font-normal">kt</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCode(st.code)}
                        className="px-2.5 py-1 text-11 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border-0 cursor-pointer"
                      >
                        Auswählen
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
