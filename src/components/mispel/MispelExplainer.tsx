import React, { useState } from 'react';
import {
  Question,
  CheckCircle,
  CaretDown,
  CaretUp,
  Info,
} from '@phosphor-icons/react';

export const MispelExplainer: React.FC = () => {
  const [showDeepDive, setShowDeepDive] = useState(false);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
      {/* Kopfbereich mit Akronym */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-2">
            <Info size={15} weight="bold" />
            <span>Erklärt für Solaranlagen- & Speicherbesitzer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Was bedeutet <span className="text-sky-600">MiSpeL</span> und was ändert sich für Sie?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1.5 leading-relaxed">
            <strong className="text-slate-900">MiSpeL</strong> steht für{' '}
            <strong className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
              Marktintegration von Speichern und Ladepunkten
            </strong>
            . Es handelt sich um eine wegweisende Festlegung der Bundesnetzagentur (Az. 618-25-02) vom{' '}
            <strong>01.10.2026</strong>.
          </p>
        </div>

        {/* Kurzes Fazit-Badge */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3 lg:max-w-xs shrink-0">
          <CheckCircle size={22} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <strong className="block text-emerald-900 font-semibold mb-0.5">Das Wichtigste in Kürze:</strong>
            Sie dürfen Ihren Heimspeicher nun legal mit günstigem Netzstrom laden – <em>ohne</em> Ihre EEG-Einspeisevergütung zu verlieren!
          </div>
        </div>
      </div>

      {/* 3-Spalten-Verständnis: Gestern vs. Heute vs. Ihr Vorteil */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
        {/* Karte 1: Das Problem */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Bisheriges Dilemma</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Das starre „Ausschließlichkeitsprinzip“
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bisher galt: Ein Heimspeicher durfte <strong>nur</strong> mit eigenem Sonnenstrom beladen werden.
              Wer im trüben Winter günstigen Windstrom aus dem Netz nachladen wollte (z.&nbsp;B. nachts für 15–20&nbsp;ct/kWh mit dynamischen Tarifen von Tibber oder Rabot Charge), verlor die gesetzliche EEG-Einspeisevergütung für den ins Netz gespeisten Solarstrom.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
            Folge bisher: Speicher standen im Winter wochenlang ungenutzt leer.
          </div>
        </div>

        {/* Karte 2: Was ist neu */}
        <div className="bg-sky-50/40 border border-sky-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Neu seit 01.10.2026</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Mischbetrieb & unbürokratische Pauschale
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Die Bundesnetzagentur erlaubt nun offiziell den <strong>Mischbetrieb</strong> (Netzstrom + Solarstrom im selben Speicher).
              Für private Anlagen bis <strong>30&nbsp;kWp</strong> reicht eine einfache Pauschalabrechnung: Bis zu{' '}
              <strong className="text-slate-900">500 kWh pro kWp</strong> Leistung gelten gesetzlich geschützt als förderfähiger Solarstrom – ohne zusätzliche teure Spezialzähler!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-sky-100 text-[11px] text-sky-800 font-medium">
            Keine Zählerkaskade nötig: Funktioniert mit normalen Zweirichtungszählern.
          </div>
        </div>

        {/* Karte 3: Warum wichtig für den Nutzer */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ihr finanzieller Vorteil</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Doppelt sparen: Tarif-Arbitrage & Umlagen
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sie können günstigen Nachtstrom im Akku puffern und tagsüber teuren Strombezug vermeiden. Speisen Sie Strom ins Netz zurück, wird er mit Ihrem Netzbezug saldiert: Sie sparen dadurch nach{' '}
              <strong>§ 118 Abs. 6 EnWG</strong> Netzentgelte und gesetzliche Umlagen!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100 text-[11px] text-emerald-800 font-medium">
            Zusätzlicher Ertrag: Bis zu mehrere hundert Euro jährlicher Mehrwert.
          </div>
        </div>
      </div>

      {/* Aufklappbare Detail-Erklärung für interessierte Laien */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setShowDeepDive(!showDeepDive)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
            <Question size={18} weight="bold" className="text-sky-600" />
            <span>Wie teilt die Bundesnetzagentur meine Einspeisung auf? ([G], [I], [N] erklärt)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-sky-700 font-medium">
            <span>{showDeepDive ? 'Weniger anzeigen' : 'Aufklappen'}</span>
            {showDeepDive ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
          </div>
        </button>

        {showDeepDive && (
          <div className="px-5 pb-5 pt-2 text-xs text-slate-600 space-y-3 border-t border-slate-200 bg-white">
            <p className="leading-relaxed">
              Da bei gemischtem Laden (Solarstrom + Netzstrom) an einem einzigen Stromzähler physikalisch nicht unterschieden werden kann, welches Elektron aus der Sonne und welches aus dem Netz stammt, wendet die Bundesnetzagentur ein <strong>dreiteiliges Zonenmodell</strong> an:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="border border-emerald-200 bg-emerald-50/40 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>[G] Förderfähig (EEG)</span>
                </div>
                <p className="text-[11px] text-emerald-950 leading-relaxed">
                  Bis zur Grenze von <strong>500 kWh pro kWp</strong> installierter Photovoltaikleistung wird Ihre Netzeinspeisung als reiner Sonnenstrom gewertet. Hier erhalten Sie die vertragliche Einspeisevergütung.
                </p>
              </div>

              <div className="border border-amber-200 bg-amber-50/40 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span>[I] Indifferenzbereich</span>
                </div>
                <p className="text-[11px] text-amber-950 leading-relaxed">
                  Ein BNetzA-Sicherheitspuffer (10&nbsp;% der PV-Grenze bzw. 20&nbsp;% der Speicherkapazität). Fängt Messtoleranzen und jahreszeitliche Schwankungen ab, ohne dass Förderrechte verloren gehen.
                </p>
              </div>

              <div className="border border-sky-200 bg-sky-50/40 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 font-bold text-sky-900 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                  <span>[N] Saldierungsfähig</span>
                </div>
                <p className="text-[11px] text-sky-950 leading-relaxed">
                  Einspeisung über dem Puffer wird mit Ihrem Netzstrombezug saldiert. Dafür gibt es keine EEG-Vergütung, aber eine <strong>Befreiung von Netzentgelten und Umlagen</strong> gemäß § 118 Abs. 6 EnWG.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Mit dem folgenden interaktiven Flussdiagramm und Rechner können Sie die exakten Kilowattstunden und Euro-Werte für Ihr eigenes Haus simulieren.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
