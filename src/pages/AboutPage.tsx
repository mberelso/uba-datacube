import { Link } from 'react-router-dom'
import { Info, Database, Warning, ArrowSquareOut, GithubLogo } from '@phosphor-icons/react'

const FAQ = [
  {
    q: 'Ist das eine offizielle Publikation des Umweltbundesamts?',
    a: 'Nein. Dieses Projekt ist ein privates Vorhaben ohne jede Verbindung zum Umweltbundesamt (UBA) oder einer anderen Behörde. Es nutzt lediglich die öffentlich zugängliche SDMX-API des UBA, um offizielle Umweltdaten maschinenlesbar abzurufen und nutzerfreundlich darzustellen.',
  },
  {
    q: 'Woher stammen die Daten?',
    a: 'Alle Daten werden in Echtzeit direkt aus dem öffentlichen Datenkatalog des Umweltbundesamts bezogen (daten.uba.de, SDMX REST API). Es werden keine Daten lokal gespeichert oder verändert — was du siehst, ist das, was die API liefert.',
  },
  {
    q: 'Sind die Daten aktuell und vollständig?',
    a: 'Die Aktualität hängt von der jeweiligen Datenquelle und dem Aktualisierungsrhythmus des UBA ab — manche Datensätze werden jährlich aktualisiert, andere seltener. Vollständigkeit kann nicht garantiert werden. Für wissenschaftliche, journalistische oder behördliche Zwecke empfehlen wir immer den direkten Blick auf die Originalquellen.',
  },
  {
    q: 'Was bedeuten die redaktionellen Beschreibungen ("Die Geschichte hinter den Zahlen")?',
    a: 'Die Einleitungstexte und Einordnungen auf den Datensatzseiten sind redaktionelle Interpretationen — kein offizieller UBA-Text. Sie sollen Kontext geben und Zusammenhänge erklären, können aber Fehler enthalten oder veraltete Einschätzungen widerspiegeln. Wir kennzeichnen KI-generierte Entwürfe gesondert.',
  },
  {
    q: 'Wer betreibt diese Seite?',
    a: 'Dieses Projekt ist ein privates Open-Source-Vorhaben. Es verfolgt kein kommerzielles Interesse. Der Quellcode ist öffentlich einsehbar.',
  },
  {
    q: 'Darf ich die Daten weiterverwenden?',
    a: 'Die Daten des UBA stehen unter offenen Lizenzen (in der Regel Datenlizenz Deutschland – Namensnennung). Die jeweilige Lizenz ist auf der Datensatzseite vermerkt. Die redaktionellen Texte und der Code dieses Projekts stehen unter MIT-Lizenz.',
  },
  {
    q: 'Wie kann ich Fehler melden?',
    a: 'Hinweise auf fehlerhafte Darstellungen oder Interpretationen sind sehr willkommen. Am besten direkt über GitHub als Issue.',
  },
]

export default function AboutPage() {
  return (
    <div className="max-w-[800px] mx-auto px-5 py-12">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-slate-400 mb-4">
          <Info size={14} weight="bold" />
          Über dieses Projekt
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
          Kein UBA-Produkt.<br />Ein Bürger-Werkzeug.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-[60ch]">
          Der UBA-Datacube ist ein privates Projekt ohne Verbindung zum Umweltbundesamt. Ziel ist es, öffentliche Umweltdaten — die bereits existieren und frei zugänglich sind — besser lesbar zu machen.
        </p>
      </div>

      {/* Disclaimer box */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mb-10 flex gap-4">
        <Warning size={22} weight="duotone" className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-amber-800 mb-1">Wichtiger Hinweis</div>
          <p className="text-sm text-amber-700 leading-relaxed">
            Dieses Angebot ist <strong>keine offizielle Publikation des Umweltbundesamts</strong> und steht in keiner Verbindung zu einer Bundesbehörde. Für verbindliche, wissenschaftlich zitierbare Daten nutze bitte direkt{' '}
            <a href="https://www.umweltbundesamt.de" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              umweltbundesamt.de
            </a>{' '}
            oder{' '}
            <a href="https://datacube.uba.de" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              datacube.uba.de
            </a>.
          </p>
        </div>
      </div>

      {/* What this is */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          {
            Icon: Database,
            title: 'Öffentliche Daten',
            body: 'Alle Daten kommen direkt von der SDMX-API des UBA — in Echtzeit, unverändert.',
          },
          {
            Icon: Info,
            title: 'Eigene Redaktion',
            body: 'Einordnungen und Beschreibungen sind privat verfasst, kein offizieller UBA-Text.',
          },
          {
            Icon: GithubLogo,
            title: 'Open Source',
            body: 'Der Code ist offen einsehbar. Fehler und Verbesserungen können gemeldet werden.',
          },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <Icon size={20} weight="duotone" className="text-slate-500 mb-3" />
            <div className="text-sm font-semibold text-slate-800 mb-1">{title}</div>
            <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-6">Häufige Fragen</h2>
      <div className="flex flex-col gap-px rounded-2xl overflow-hidden border border-slate-200">
        {FAQ.map(({ q, a }, i) => (
          <details
            key={i}
            className="group bg-white open:bg-slate-50 transition-colors duration-150"
          >
            <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none select-none text-sm font-medium text-slate-800 hover:text-slate-900">
              {q}
              <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 text-lg leading-none">›</span>
            </summary>
            <p className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 mt-0">
              {a}
            </p>
          </details>
        ))}
      </div>

      {/* Links */}
      <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
        <a
          href="https://datacube.uba.de"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowSquareOut size={14} /> UBA Datacube (Original)
        </a>
        <a
          href="https://www.umweltbundesamt.de"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowSquareOut size={14} /> Umweltbundesamt
        </a>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
        >
          Zum Datenkatalog →
        </Link>
      </div>

    </div>
  )
}
