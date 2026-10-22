import React, { useState } from 'react';
import type {
  MispelFormelSchritt,
  MispelKonstellation,
  MispelPauschalErgebnis,
  MispelWirtschaftlichkeit,
} from '../../lib/mispel/types';
import {
  FileText,
  CaretDown,
  CaretUp,
  BookOpen,
  Sun,
  ShieldCheck,
  Lightning,
  Coins,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  Info,
} from '@phosphor-icons/react';

interface Props {
  schritte: MispelFormelSchritt[];
  konstellation: MispelKonstellation;
  ergebnis: MispelPauschalErgebnis;
  wirtschaftlichkeit: MispelWirtschaftlichkeit;
}

export const MispelFormulaAudit: React.FC<Props> = ({
  schritte,
  konstellation,
  ergebnis,
  wirtschaftlichkeit,
}) => {
  const [activeStage, setActiveStage] = useState<1 | 2 | 3 | 4>(1);
  const [isTableOpen, setIsTableOpen] = useState(false);

  const isVorteil = wirtschaftlichkeit.deltaVorteilEuro >= 0;
  const p1 = ergebnis.p1_foerdergrenzeKWh;
  const p3 = ergebnis.p3_indifferenzKWh;
  const p9 = ergebnis.p9_grundsaetzlichSaldierbarKWh;
  const p10 = ergebnis.p10_saldierungsfaehigKWh;
  const einspeisung = konstellation.jahresEinspeisungKWh;
  const bezug = konstellation.jahresNetzbezugKWh;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden mb-6 shadow-sm">
      {/* Kopfbereich */}
      <div className="p-6 pb-4 border-b border-slate-100">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-2">
          <FileText size={14} weight="bold" />
          <span>Interaktiver Rechenweg nach BNetzA-Vorgabe</span>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Wie berechnet sich Ihr Ergebnis? (Schritt-für-Schritt)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Klicken Sie durch die 4 amtlichen Berechnungsstufen der Bundesnetzagentur, um zu sehen, wie jede Zahl aus Ihren Anlagendaten entsteht.
        </p>

        {/* 4 Stufen Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          <button
            type="button"
            onClick={() => setActiveStage(1)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStage === 1
                ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Sun size={16} weight="fill" className={activeStage === 1 ? 'text-amber-500' : 'text-slate-400'} />
              <span>Stufe 1</span>
            </div>
            <div className="text-xs font-semibold text-slate-900">Fördergrenze (P1)</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{p1.toLocaleString('de-DE')} kWh</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage(2)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStage === 2
                ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <ShieldCheck size={16} weight="fill" className={activeStage === 2 ? 'text-amber-600' : 'text-slate-400'} />
              <span>Stufe 2</span>
            </div>
            <div className="text-xs font-semibold text-slate-900">Pufferbereich (P3)</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{p3.toLocaleString('de-DE')} kWh</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage(3)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStage === 3
                ? 'bg-sky-50/80 border-sky-400 text-sky-950 shadow-xs ring-1 ring-sky-400/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Lightning size={16} weight="fill" className={activeStage === 3 ? 'text-sky-600' : 'text-slate-400'} />
              <span>Stufe 3</span>
            </div>
            <div className="text-xs font-semibold text-slate-900">Saldierung (P10)</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{p10.toLocaleString('de-DE')} kWh</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage(4)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeStage === 4
                ? isVorteil
                  ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-xs ring-1 ring-emerald-400/30'
                  : 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
              <Coins size={16} weight="fill" className={activeStage === 4 ? (isVorteil ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-400'} />
              <span>Stufe 4</span>
            </div>
            <div className="text-xs font-semibold text-slate-900">Saldo & Ertrag</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              {isVorteil ? '+' : ''}{wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
            </div>
          </button>
        </div>
      </div>

      {/* Interaktiver Inhalt der gewählten Stufe */}
      <div className="p-6 bg-slate-50/40">
        {/* STUFE 1: Fördergrenze */}
        {activeStage === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sun size={18} weight="fill" className="text-amber-500" />
                <span>Stufe 1: BNetzA-Pauschalgrenze der EEG-Förderung (Formel P1)</span>
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Topf [G]
              </span>
            </div>

            {/* Interaktive Formel-Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Formel & Live-Werte</div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base font-mono font-extrabold text-slate-800">
                <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200" title="Ihre installierte Solarleistung">
                  {konstellation.pinstKWp.toLocaleString('de-DE')} kWp
                </span>
                <span className="text-slate-400">×</span>
                <span className="px-2.5 py-1 rounded bg-sky-50 text-sky-900 border border-sky-200" title="Gesetzlicher BNetzA-Pauschalfaktor">
                  500 kWh/kWp
                </span>
                <span className="text-slate-400">=</span>
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white shadow-xs">
                  {p1.toLocaleString('de-DE')} kWh Fördergrenze
                </span>
              </div>
            </div>

            {/* Abgleich mit der Einspeisung */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800">Was bedeutet das für Ihre Einspeisung?</div>
              <p className="text-slate-600 leading-relaxed">
                Sie speisen jährlich <strong>{einspeisung.toLocaleString('de-DE')} kWh</strong> ins öffentliche Netz ein.
                Die Bundesnetzagentur garantiert: Bis zu <strong>{p1.toLocaleString('de-DE')} kWh</strong> gelten zu 100 % als förderfähiger Solarstrom mit voller EEG-Vergütung ({konstellation.anzulegenderWertCt.toLocaleString('de-DE')} ct/kWh = <strong>{((p1 * konstellation.anzulegenderWertCt) / 100).toLocaleString('de-DE', { maximumFractionDigits: 0 })} € Erlös</strong>).
              </p>
              {einspeisung > p1 ? (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Ihre Einspeisung übersteigt die Grenze um <strong>{(einspeisung - p1).toLocaleString('de-DE')} kWh</strong>. Dieser Überschuss geht nicht verloren, sondern wird in Stufe 2 (Puffer) und Stufe 3 (Saldierung) geprüft!
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Ihre gesamte Einspeisung liegt innerhalb der Fördergrenze! 100 % Ihrer Solareinspeisung erhalten die volle Einspeisevergütung.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STUFE 2: Indifferenzbereich */}
        {activeStage === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} weight="fill" className="text-amber-600" />
                <span>Stufe 2: Gesetzlicher Pufferbereich (Formeln P2 & P3)</span>
              </h4>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Topf [I]
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Formel & Maximum-Vergleich</div>
              <div className="text-xs text-slate-600 mb-2">
                Die BNetzA vergleicht zwei Pufferwerte und wählt den größeren:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 font-sans mb-1 font-semibold">Option A (10 % der PV-Fördergrenze):</div>
                  <div className="font-bold text-slate-800">
                    {p1.toLocaleString('de-DE')} kWh × 10 % = {(p1 * 0.1).toLocaleString('de-DE')} kWh
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 font-sans mb-1 font-semibold">Option B ({konstellation.hasLadepunkt ? '20 %' : '10 %'} Speicherkapazität):</div>
                  <div className="font-bold text-slate-800">
                    {konstellation.skInstKWh.toLocaleString('de-DE')} kWh × {konstellation.hasLadepunkt ? '0,2' : '0,1'} = {(konstellation.skInstKWh * (konstellation.hasLadepunkt ? 0.2 : 0.1)).toLocaleString('de-DE')} kWh
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Gewählter BNetzA-Pufferwert (P3):</span>
                <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded border border-amber-200">
                  {p3.toLocaleString('de-DE')} kWh
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800">Wofür dient der Indifferenzbereich [I]?</div>
              <p className="text-slate-600 leading-relaxed">
                Der Puffer fängt Messtoleranzen und wetterbedingte Ertragsschwankungen ab. Damit wird sichergestellt, dass Sie nicht wegen weniger Kilowattstunden geringfügiger Netzstromeinspeicherung Ihren Förderstatus gefährden.
              </p>
            </div>
          </div>
        )}

        {/* STUFE 3: Saldierung */}
        {activeStage === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Lightning size={18} weight="fill" className="text-sky-600" />
                <span>Stufe 3: Saldierung mit Netzbezug gem. § 118 Abs. 6 EnWG (Formeln P4 bis P10)</span>
              </h4>
              <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Topf [N]
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rechenschritte der Saldierung</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="font-sans text-slate-600">Grundsätzlich saldierbare Einspeisung (P9):</span>
                  <span className="font-bold text-slate-900">{p9.toLocaleString('de-DE')} kWh</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="font-sans text-slate-600">Ihr tatsächlicher Jahres-Netzbezug:</span>
                  <span className="font-bold text-blue-700">{bezug.toLocaleString('de-DE')} kWh</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded bg-sky-50 border border-sky-300">
                  <span className="font-sans font-bold text-sky-950">Saldierungsfähig = min(P9, Netzbezug) (P10):</span>
                  <span className="font-bold text-sky-900 text-sm">{p10.toLocaleString('de-DE')} kWh</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800">Ihre finanzielle Ersparnis durch Saldierung</div>
              <p className="text-slate-600 leading-relaxed">
                Auf <strong>{p10.toLocaleString('de-DE')} kWh</strong> Ihrer Netzeinspeisung entfallen die Netzentgelte und gesetzlichen Umlagen (durchschnittlich 7,5 ct/kWh).
                Das bringt Ihnen eine direkte Ersparnis von{' '}
                <strong className="text-sky-800 font-bold font-mono">
                  +{wirtschaftlichkeit.mispelErsparnisSaldierungEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € pro Jahr
                </strong>
                !
              </p>
            </div>
          </div>
        )}

        {/* STUFE 4: Wirtschaftlichkeit & Fazit */}
        {activeStage === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Coins size={18} weight="fill" className={isVorteil ? 'text-emerald-600' : 'text-amber-600'} />
                <span>Stufe 4: Warum ergibt sich dieser finanzielle Vor- oder Mindererlös?</span>
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                isVorteil ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                {isVorteil ? 'Mehrwert' : 'Wirtschaftliche Differenz'}
              </span>
            </div>

            {/* Gegenüberstellung Status Quo vs MiSpeL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Bisher: Reine Einspeisevergütung
                </div>
                <div className="text-2xl font-mono font-extrabold text-slate-800">
                  {wirtschaftlichkeit.statusQuoErlosEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                </div>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  Alle {einspeisung.toLocaleString('de-DE')} kWh werden mit {konstellation.anzulegenderWertCt.toLocaleString('de-DE')} ct/kWh EEG-Satz vergütet. Speicher durfte nicht aus dem Netz geladen werden.
                </div>
              </div>

              <div className={`border rounded-xl p-4 shadow-2xs space-y-2 ${
                isVorteil ? 'bg-emerald-50/60 border-emerald-300' : 'bg-amber-50/60 border-amber-300'
              }`}>
                <div className={`font-bold uppercase tracking-wider text-[11px] ${
                  isVorteil ? 'text-emerald-900' : 'text-amber-900'
                }`}>
                  Neu: MiSpeL-Pauschaloption
                </div>
                <div className={`text-2xl font-mono font-extrabold ${
                  isVorteil ? 'text-emerald-800' : 'text-amber-900'
                }`}>
                  {(wirtschaftlichkeit.mispelErlosEuro + wirtschaftlichkeit.mispelErsparnisSaldierungEuro).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  Inkl. {wirtschaftlichkeit.mispelErsparnisSaldierungEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € Netzentgelt-Ersparnis. Günstiges Laden aus dem Netz ist nun legal möglich!
                </div>
              </div>
            </div>

            {/* Warum positiv oder negativ */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              isVorteil
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1.5">
                {isVorteil ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                ) : (
                  <WarningCircle size={18} weight="fill" className="text-amber-600" />
                )}
                <span>
                  {isVorteil
                    ? `Wirtschaftlicher Mehrwert: +${wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € pro Jahr`
                    : `Wirtschaftliche Differenz: ${wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € pro Jahr (Reine EEG-Vergütung rentabler)`}
                </span>
              </div>
              <p>
                {isVorteil ? (
                  'Bei Ihrer Anlagengröße und Ihrem Strombezug lohnt sich die MiSpeL-Option. Die Ersparnisse bei Netzentgelten und Umlagen übersteigen die Kosten und Sie können zusätzlich billigen Winterstrom puffern.'
                ) : (
                  <>
                    Warum ist das Ergebnis negativ? Wenn Sie bei einer kleineren PV-Leistung ({konstellation.pinstKWp} kWp) eine sehr hohe Netzeinspeisung ({einspeisung.toLocaleString('de-DE')} kWh) angeben, übersteigt diese die 500 kWh/kWp-Grenze ({p1.toLocaleString('de-DE')} kWh) massiv. Der Überschuss wird dann an der Strombörse nur zum aktuellen Marktwert vergütet. Bei zu geringem Netzbezug ({bezug.toLocaleString('de-DE')} kWh) kann die Netzentgelt-Saldierung diesen Unterschied nicht ausgleichen.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Vor- / Zurück-Knöpfe */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200/80 text-xs">
          <button
            type="button"
            disabled={activeStage === 1}
            onClick={() => setActiveStage((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Vorherige Stufe</span>
          </button>
          <div className="text-slate-400 font-medium">Stufe {activeStage} von 4</div>
          <button
            type="button"
            disabled={activeStage === 4}
            onClick={() => setActiveStage((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Nächste Stufe</span>
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Aufklappbare amtliche Gesamt-Tabelle (P1 bis P15) für Gutachter & Netzbetreiber */}
      <div className="border-t border-slate-200">
        <button
          onClick={() => setIsTableOpen(!isTableOpen)}
          type="button"
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs sm:text-sm">
            <BookOpen size={16} className="text-slate-500 shrink-0" />
            <span>Vollständiges BNetzA-Prüfprotokoll anzeigen (Formelzeilen P1 bis P15 für Netzbetreiber)</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-sky-700 font-semibold">
            <span>{isTableOpen ? 'Tabelle einklappen' : 'Tabelle aufklappen'}</span>
            {isTableOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
          </div>
        </button>

        {isTableOpen && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                    <th className="py-2.5 px-3 font-bold">Formel</th>
                    <th className="py-2.5 px-3 font-bold">Bezeichnung</th>
                    <th className="py-2.5 px-3 font-bold">Rechenweg</th>
                    <th className="py-2.5 px-3 font-bold text-right">Ergebnis</th>
                    <th className="py-2.5 px-3 font-bold text-slate-500">Fundstelle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {schritte.map((s) => (
                    <tr key={s.nummer} className="hover:bg-slate-50/70 text-slate-700">
                      <td className="py-2.5 px-3 font-bold text-sky-700">{s.nummer}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{s.titel}</td>
                      <td className="py-2.5 px-3 text-slate-500">{s.rechenweg}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {s.ergebnis.toLocaleString('de-DE', { maximumFractionDigits: 3 })} {s.einheit}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{s.fundstelle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
