import React from 'react';
import type { MispelPauschalErgebnis } from '../../lib/mispel/types';

interface Props {
  ergebnis: MispelPauschalErgebnis;
  gesamteEinspeisung: number;
}

export const MispelEnergyBar: React.FC<Props> = ({ ergebnis, gesamteEinspeisung }) => {
  const gesamt = Math.max(gesamteEinspeisung, 1);
  const foerderPct = Math.min((ergebnis.p15_foerderfaehigKWh / gesamt) * 100, 100);
  const indiffPct = Math.min((ergebnis.p3_indifferenzKWh / gesamt) * 100, 100 - foerderPct);
  const saldierPct = Math.min((ergebnis.p10_saldierungsfaehigKWh / gesamt) * 100, 100 - foerderPct - indiffPct);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div>
          <h4 className="text-slate-900 font-extrabold text-sm sm:text-base">
            Aufteilung der Netzeinspeisung nach BNetzA-Festlegung ({gesamt.toLocaleString('de-DE')} kWh)
          </h4>
          <p className="text-xs text-slate-500">
            Gesetzliche Zonenaufteilung gem. Anlage 2 (P1 bis P15)
          </p>
        </div>
      </div>

      {/* Stapelbalken */}
      <div
        className="w-full h-10 rounded-xl overflow-hidden flex bg-slate-100 border border-slate-300 shadow-inner my-3"
        role="img"
        aria-label={`Einspeisung aufgeteilt in ${ergebnis.p15_foerderfaehigKWh} kWh förderfähig, ${ergebnis.p3_indifferenzKWh} kWh indifferent, und ${ergebnis.p10_saldierungsfaehigKWh} kWh saldierungsfähig`}
      >
        {/* Förderfähig [G] - Grün */}
        <div
          style={{ width: `${foerderPct}%` }}
          className="bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Förderfähig [G]: ${ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh`}
        >
          {foerderPct > 12 && <span>{ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh [G]</span>}
        </div>

        {/* Indifferenzbereich [I] - Ocker / Schraffur */}
        <div
          style={{
            width: `${indiffPct}%`,
            backgroundImage: 'repeating-linear-gradient(45deg, #d97706, #d97706 6px, #b45309 6px, #b45309 12px)',
          }}
          className="text-amber-50 font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Indifferenzbereich [I]: ${ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh`}
        >
          {indiffPct > 10 && <span>{ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh [I]</span>}
        </div>

        {/* Saldierungsfähig [N] - Blau / Gepunktet */}
        <div
          style={{
            width: `${saldierPct}%`,
            backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
            backgroundColor: '#0284c7',
            backgroundSize: '6px 6px',
          }}
          className="text-sky-50 font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Saldierungsfähig [N]: ${ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh`}
        >
          {saldierPct > 10 && <span>{ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh [N]</span>}
        </div>
      </div>

      {/* Legende */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/70">
          <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0 mt-0.5" />
          <div className="text-slate-700">
            <strong className="block text-emerald-950 font-bold">[G] Förderfähig: {ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh</strong>
            Garantierte EEG-Einspeisevergütung bis 500 kWh/kWp.
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-50/60 border border-amber-200/70">
          <span
            className="w-3.5 h-3.5 rounded shrink-0 mt-0.5"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #d97706, #d97706 3px, #b45309 3px, #b45309 6px)',
            }}
          />
          <div className="text-slate-700">
            <strong className="block text-amber-950 font-bold">[I] Indifferent: {ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh</strong>
            Amtliche Pufferzone für Messtoleranzen und Schwankungen.
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-sky-50/60 border border-sky-200/70">
          <span
            className="w-3.5 h-3.5 rounded shrink-0 mt-0.5 bg-sky-600"
            style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '4px 4px' }}
          />
          <div className="text-slate-700">
            <strong className="block text-sky-950 font-bold">[N] Saldierungsfähig: {ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh</strong>
            Spart Netzentgelte und gesetzliche Umlagen nach § 118 EnWG.
          </div>
        </div>
      </div>
    </div>
  );
};
