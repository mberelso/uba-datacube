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
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <h4 className="text-slate-200 font-semibold text-sm">
          Aufteilung der Netzeinspeisung nach BNetzA-Festlegung ({gesamt.toLocaleString('de-DE')} kWh)
        </h4>
        <span className="text-xs text-slate-400">Amtlicher Stapelbalken (BITV 2.0 Dreifachkodierung)</span>
      </div>

      {/* Stapelbalken */}
      <div
        className="w-full h-8 rounded-lg overflow-hidden flex bg-slate-800 border border-slate-700/60"
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
            backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 6px, #92400e 6px, #92400e 12px)',
          }}
          className="text-amber-100 font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Indifferenzbereich [I]: ${ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh`}
        >
          {indiffPct > 10 && <span>{ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh [I]</span>}
        </div>

        {/* Saldierungsfähig [N] - Blau / Gepunktet */}
        <div
          style={{
            width: `${saldierPct}%`,
            backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
            backgroundColor: '#0369a1',
            backgroundSize: '6px 6px',
          }}
          className="text-sky-100 font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Saldierungsfähig [N]: ${ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh`}
        >
          {saldierPct > 10 && <span>{ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh [N]</span>}
        </div>
      </div>

      {/* Legende */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-600 flex-shrink-0" />
          <span className="text-slate-300">
            <strong>[G] Förderfähig:</strong> {ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh (EEG-Marktprämie)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded flex-shrink-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 3px, #92400e 3px, #92400e 6px)',
            }}
          />
          <span className="text-slate-300">
            <strong>[I] Indifferent:</strong> {ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh (Pufferzone)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded flex-shrink-0 bg-sky-700"
            style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '4px 4px' }}
          />
          <span className="text-slate-300">
            <strong>[N] Saldierungsfähig:</strong> {ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh (spart Umlagen)
          </span>
        </div>
      </div>
    </div>
  );
};
