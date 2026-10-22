import React from 'react';
import type { MispelWirtschaftlichkeit } from '../../lib/mispel/types';
import { TrendUp, TrendDown, CheckCircle } from '@phosphor-icons/react';

interface Props {
  wirtschaftlichkeit: MispelWirtschaftlichkeit;
}

export const MispelResultCards: React.FC<Props> = ({ wirtschaftlichkeit }) => {
  const isVorteil = wirtschaftlichkeit.deltaVorteilEuro >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Status Quo */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Status Quo (EEG Fest)
        </div>
        <div className="text-2xl font-bold font-mono text-slate-200">
          {wirtschaftlichkeit.statusQuoErlosEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          <span className="text-xs font-normal text-slate-400 ml-1">/ Jahr Erlös</span>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Reine Einspeisevergütung ohne Speicherprivilegien.
        </div>
      </div>

      {/* MiSpeL Pauschaloption */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wider text-sky-400 font-semibold mb-1">
          MiSpeL Pauschaloption P1
        </div>
        <div className="text-2xl font-bold font-mono text-sky-300">
          {(wirtschaftlichkeit.mispelErlosEuro + wirtschaftlichkeit.mispelErsparnisSaldierungEuro).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          <span className="text-xs font-normal text-slate-400 ml-1">/ Jahr Gesamtnutzen</span>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Inkl. {wirtschaftlichkeit.mispelErsparnisSaldierungEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € Netzentgelt- & Umlagensparnis.
        </div>
      </div>

      {/* Finanzieller Mehrwert (Delta) */}
      <div className={`border rounded-xl p-4 ${
        isVorteil
          ? 'bg-emerald-950/30 border-emerald-500/40'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
          {isVorteil ? (
            <TrendUp size={16} weight="bold" className="text-emerald-400" />
          ) : (
            <TrendDown size={16} weight="bold" className="text-slate-400" />
          )}
          <span>Finanzieller Mehrwert</span>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-300">
          {isVorteil ? '+' : ''}{wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          <span className="text-xs font-normal text-slate-300 ml-1">/ Jahr Vorteil</span>
        </div>
        <div className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
          <CheckCircle size={14} weight="fill" className="flex-shrink-0" />
          <span>{isVorteil ? 'MiSpeL wirtschaftlich vorteilhaft' : 'Einspeisung liegt noch unter Saldierungsschwelle'}</span>
        </div>
      </div>
    </div>
  );
};
