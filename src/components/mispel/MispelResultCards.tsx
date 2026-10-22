import React from 'react';
import type { MispelWirtschaftlichkeit, MispelKonstellation } from '../../lib/mispel/types';
import { TrendUp, TrendDown, CheckCircle, WarningCircle } from '@phosphor-icons/react';

interface Props {
  wirtschaftlichkeit: MispelWirtschaftlichkeit;
  konstellation?: MispelKonstellation;
}

export const MispelResultCards: React.FC<Props> = ({ wirtschaftlichkeit, konstellation }) => {
  const isVorteil = wirtschaftlichkeit.deltaVorteilEuro >= 0;
  const deltaFormatted = Math.abs(wirtschaftlichkeit.deltaVorteilEuro).toLocaleString('de-DE', {
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Status Quo */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">
            Status Quo (Reine EEG-Vergütung)
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-800 my-1">
            {wirtschaftlichkeit.statusQuoErlosEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
            <span className="text-xs font-normal text-slate-500 ml-1">/ Jahr</span>
          </div>
          <div className="text-xs text-slate-500 leading-relaxed mt-2">
            Vergütung bei bisheriger fixer EEG-Einspeisung ohne Nutzung von Netzstrom-Privilegien.
          </div>
        </div>
      </div>

      {/* MiSpeL Pauschaloption */}
      <div className="bg-white border-2 border-sky-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-sky-800 font-bold mb-1 flex items-center justify-between">
            <span>MiSpeL Gesamtnutzen</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
              Pauschal P1
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-sky-700 my-1">
            {(wirtschaftlichkeit.mispelErlosEuro + wirtschaftlichkeit.mispelErsparnisSaldierungEuro).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
            <span className="text-xs font-normal text-slate-500 ml-1">/ Jahr</span>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed mt-2">
            Inkl. <strong className="text-sky-800">{wirtschaftlichkeit.mispelErsparnisSaldierungEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</strong> Netzentgelt- & Umlagensparnis nach § 118 Abs. 6 EnWG.
          </div>
        </div>
      </div>

      {/* Finanzielles Delta (Mehrwert oder Mindererlös) */}
      <div className={`rounded-2xl p-5 shadow-sm flex flex-col justify-between border-2 ${
        isVorteil
          ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border-emerald-400'
          : 'bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-400'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className={`text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 ${
              isVorteil ? 'text-emerald-800' : 'text-amber-900'
            }`}>
              {isVorteil ? (
                <TrendUp size={18} weight="bold" className="text-emerald-600" />
              ) : (
                <TrendDown size={18} weight="bold" className="text-amber-600" />
              )}
              <span>{isVorteil ? 'Finanzieller Mehrwert' : 'Wirtschaftliche Differenz'}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isVorteil ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {isVorteil ? 'Vorteil' : 'Mindererlös'}
            </span>
          </div>

          <div className={`text-3xl font-extrabold font-mono my-1 ${
            isVorteil ? 'text-emerald-800' : 'text-amber-900'
          }`}>
            {isVorteil ? `+${deltaFormatted}` : `-${deltaFormatted}`} €
            <span className={`text-xs font-normal ml-1 ${
              isVorteil ? 'text-emerald-900/70' : 'text-amber-900/70'
            }`}>
              {isVorteil ? '/ Jahr Mehrwert' : '/ Jahr Differenz'}
            </span>
          </div>

          <div className={`text-xs mt-2 flex items-start gap-1.5 leading-relaxed ${
            isVorteil ? 'text-emerald-900 font-medium' : 'text-amber-950 font-normal'
          }`}>
            {isVorteil ? (
              <>
                <CheckCircle size={16} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  MiSpeL ist für Ihre Anlage wirtschaftlich vorteilhaft. Sie erzielen zusätzlichen Ertrag durch vermiedene Umlagen und Netzentgelte.
                </span>
              </>
            ) : (
              <>
                <WarningCircle size={16} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Reine EEG-Vergütung ist hier lukrativer:</strong> Da die Netzeinspeisung {konstellation ? `(${konstellation.jahresEinspeisungKWh.toLocaleString('de-DE')} kWh)` : ''} die 500 kWh/kWp-Fördergrenze stark übersteigt, wird der Überschuss nur zum Börsenmarktwert vergütet, während der Netzbezug zu gering ist, um dies durch Saldierungsersparnis aufzuwiegen.
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
