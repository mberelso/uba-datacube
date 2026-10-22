import React from 'react';
import type { MispelKonstellation, MispelPauschalErgebnis, MispelWirtschaftlichkeit } from '../../lib/mispel/types';
import {
  Sun,
  Lightning,
  BatteryCharging,
  House,
  ArrowsSplit,
  TrendUp,
  TrendDown,
  Info,
} from '@phosphor-icons/react';

interface Props {
  konstellation: MispelKonstellation;
  ergebnis: MispelPauschalErgebnis;
  wirtschaftlichkeit: MispelWirtschaftlichkeit;
}

export const MispelFlowDiagram: React.FC<Props> = ({
  konstellation,
  ergebnis,
  wirtschaftlichkeit,
}) => {
  // Geschätzte PV-Gesamterzeugung (ca. 1000 kWh/kWp in Deutschland)
  const pvErzeugungEstKWh = Math.round(konstellation.pinstKWp * 980);
  const gesamtEinspeisung = Math.max(konstellation.jahresEinspeisungKWh, 1);

  // Prozentuale Anteile an der Einspeisung
  const pctG = Math.min(Math.round((ergebnis.p15_foerderfaehigKWh / gesamtEinspeisung) * 100), 100);
  const pctI = Math.min(Math.round((ergebnis.p3_indifferenzKWh / gesamtEinspeisung) * 100), 100 - pctG);
  const pctN = Math.max(0, 100 - pctG - pctI);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm mb-8">
      {/* Kopfzeile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-1">
            <ArrowsSplit size={14} weight="bold" />
            <span>Interaktives Energiefluss-Diagramm</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Wie fließt die Energie mit MiSpeL?
          </h3>
          <p className="text-xs text-slate-500">
            Dynamische Darstellung: Vom Dach und Stromnetz über den Mischspeicher bis zur amtlichen BNetzA-Aufteilung.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400 block">Jahres-Einspeisung gesamt</span>
          <span className="text-base font-extrabold font-mono text-slate-800">
            {konstellation.jahresEinspeisungKWh.toLocaleString('de-DE')} kWh
          </span>
        </div>
      </div>

      {/* Das 3-Spalten-Flussdiagramm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative">
        {/* SPALTE 1: QUELLEN (Links, 3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>1. Energiequellen</span>
          </div>

          {/* PV-Anlage */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-xl p-4 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sun size={20} weight="fill" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Solar
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800">Photovoltaik-Dach</div>
            <div className="text-lg font-mono font-extrabold text-amber-700">
              {konstellation.pinstKWp.toLocaleString('de-DE')} <span className="text-xs font-normal">kWp</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Erzeugung ca. ~{pvErzeugungEstKWh.toLocaleString('de-DE')} kWh/a
            </div>
          </div>

          {/* Stromnetz (Günstiger Bezug) */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200/80 rounded-xl p-4 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Lightning size={20} weight="fill" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Dynamisch
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800">Günstiger Netzstrom</div>
            <div className="text-lg font-mono font-extrabold text-blue-700">
              {konstellation.jahresNetzbezugKWh.toLocaleString('de-DE')} <span className="text-xs font-normal">kWh/a</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Winter- & Nachtstrom bei Tiefpreisen
            </div>
          </div>
        </div>

        {/* SPALTE 2: KNOTENPUNKT (Mitte, 4 Cols - Der Heimspeicher im Mischbetrieb) */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>2. Zentrale & Mischbetrieb</span>
          </div>

          <div className="bg-slate-50 border-2 border-dashed border-purple-300 rounded-2xl p-5 shadow-xs relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <BatteryCharging size={22} weight="fill" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Heimspeicher & EMS</div>
                  <div className="text-[10px] text-purple-700 font-semibold">
                    Neu: Offiziell legaler Mischbetrieb
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-white border border-purple-200 rounded-lg text-purple-900 shadow-xs">
                {konstellation.skInstKWh} kWh
              </span>
            </div>

            {/* Visualisierung der Speicher-Mischung */}
            <div className="bg-white border border-purple-100 rounded-xl p-3 mb-3">
              <div className="text-[11px] font-medium text-slate-600 mb-1.5 flex justify-between">
                <span>Speicherinhalt im Mischbetrieb:</span>
                <span className="text-purple-700 font-semibold">PV + Netz</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                <div style={{ width: '65%' }} className="bg-amber-400 flex items-center justify-center text-[9px] font-bold text-amber-950" title="Solarer Anteil">
                  Solar
                </div>
                <div style={{ width: '35%' }} className="bg-blue-400 flex items-center justify-center text-[9px] font-bold text-blue-950" title="Netz-Anteil">
                  Netz
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>☀️ Tagsüber Sonnenstrom</span>
                <span>⚡ Nachts günstiger Netzstrom</span>
              </div>
            </div>

            {/* Haus & E-Auto Verbrauch */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <House size={16} weight="fill" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Haus & E-Auto</div>
                  <div className="text-[10px] text-slate-500">Eigenverbrauch</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Prioritär bedient
              </span>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 leading-relaxed text-center">
              Überschuss wird ins Netz zurückgespeist und nach BNetzA-Pauschaloption aufgeteilt ↓
            </div>
          </div>
        </div>

        {/* SPALTE 3: ZIELE / AUFTEILUNG (Rechts, 5 Cols - BNetzA Töpfe [G], [I], [N]) */}
        <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>3. BNetzA-Aufteilung der Einspeisung (Anlage 2)</span>
          </div>

          {/* Topf 1: [G] Förderfähig */}
          <div className="bg-white border-2 border-emerald-500/80 rounded-xl p-3.5 shadow-xs relative group hover:border-emerald-600 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-xs font-extrabold text-emerald-900">[G] Förderfähige Einspeisung</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {pctG} %
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-lg font-mono font-extrabold text-slate-900">
                {ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-700">
                ~{wirtschaftlichkeit.mispelErlosEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € EEG-Erlös
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Volle garantierte Einspeisevergütung ({konstellation.anzulegenderWertCt.toLocaleString('de-DE')} ct/kWh bis 500 kWh/kWp).
            </div>
          </div>

          {/* Topf 2: [I] Indifferenzbereich */}
          <div className="bg-white border border-amber-300 rounded-xl p-3.5 shadow-xs relative group hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #d97706, #d97706 2px, #b45309 2px, #b45309 4px)',
                  }}
                />
                <span className="text-xs font-extrabold text-amber-900">[I] Indifferenzbereich (Puffer)</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {pctI} %
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-lg font-mono font-extrabold text-slate-900">
                {ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-xs font-medium text-amber-700">Toleranzpuffer</div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Gesetzlicher Sicherheitspuffer der BNetzA für Messungenauigkeiten & Schwankungen.
            </div>
          </div>

          {/* Topf 3: [N] Saldierungsfähig */}
          <div className="bg-white border border-sky-300 rounded-xl p-3.5 shadow-xs relative group hover:border-sky-400 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <span className="text-xs font-extrabold text-sky-900">[N] Saldierte Netzeinspeisung</span>
              </div>
              <span className="text-xs font-mono font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {pctN} %
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-lg font-mono font-extrabold text-slate-900">
                {ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <div className="text-xs font-mono font-bold text-sky-700">
                +{wirtschaftlichkeit.mispelErsparnisSaldierungEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € Ersparnis
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Befreiung von Netzentgelten & EnFG-Umlagen (§ 118 Abs. 6 EnWG) durch Verrechnung mit Netzbezug.
            </div>
          </div>
        </div>
      </div>

      {/* Fußzeile mit Ersparnis-Zusammenfassung */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Info size={16} className="text-sky-600 shrink-0" />
          <span>
            Verändern Sie die Schieberegler unten, um den Energiefluss für Ihre genaue Anlagengröße anzupassen.
          </span>
        </div>
        {wirtschaftlichkeit.deltaVorteilEuro >= 0 ? (
          <div className="flex items-center gap-2 font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <TrendUp size={16} weight="bold" className="text-emerald-600 shrink-0" />
            <span>
              Jährlicher Mehrwert: +{wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <TrendDown size={16} weight="bold" className="text-amber-600 shrink-0" />
            <span>
              Wirtschaftliche Differenz: {wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € (reine EEG-Vergütung rentabler)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
