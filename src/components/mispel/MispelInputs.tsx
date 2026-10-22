import React from 'react';
import type { MispelKonstellation } from '../../lib/mispel/types';
import { Sun, BatteryCharging, ArrowUpRight, ArrowDownRight, Sliders } from '@phosphor-icons/react';

interface Props {
  konstellation: MispelKonstellation;
  onChange: (updated: MispelKonstellation) => void;
}

export const MispelInputs: React.FC<Props> = ({ konstellation, onChange }) => {
  const updateField = <K extends keyof MispelKonstellation>(field: K, value: MispelKonstellation[K]) => {
    onChange({ ...konstellation, [field]: value });
  };

  const handleFloatChange = (field: 'pinstKWp' | 'skInstKWh', raw: string) => {
    if (raw === '') {
      updateField(field, 0);
      return;
    }
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      updateField(field, Math.max(0, parsed));
    }
  };

  const handleIntChange = (field: 'jahresEinspeisungKWh' | 'jahresNetzbezugKWh', raw: string) => {
    if (raw === '') {
      updateField(field, 0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      updateField(field, Math.max(0, parsed));
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5 pb-3 border-b border-slate-100">
        <h3 className="text-slate-900 font-extrabold text-base flex items-center gap-2">
          <Sliders size={18} weight="bold" className="text-sky-600" />
          <span>Ihre Anlagendaten anpassen</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          Berechnung & Energiefluss aktualisieren sich live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PV-Leistung */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="pinst" className="text-slate-700 flex items-center gap-1.5 font-bold cursor-pointer">
              <Sun size={18} weight="fill" className="text-amber-500 shrink-0" />
              <span>Solarleistung (PV):</span>
            </label>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700">
              <input
                id="pinst"
                type="number"
                min="0.5"
                max="30"
                step="0.5"
                value={konstellation.pinstKWp || ''}
                onChange={(e) => handleFloatChange('pinstKWp', e.target.value)}
                className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-right text-slate-900 font-mono text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500 font-normal">kWp</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={konstellation.pinstKWp}
            onChange={(e) => updateField('pinstKWp', parseFloat(e.target.value))}
            className="w-full accent-sky-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>1 kWp</span>
            <span className="text-slate-500">BNetzA-Pauschal-Obergrenze: 30 kWp</span>
            <span>30 kWp</span>
          </div>
        </div>

        {/* Speicherkapazität */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="skinst" className="text-slate-700 flex items-center gap-1.5 font-bold cursor-pointer">
              <BatteryCharging size={18} weight="fill" className="text-purple-600 shrink-0" />
              <span>Batterie-Speicherkapazität:</span>
            </label>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700">
              <input
                id="skinst"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={konstellation.skInstKWh || ''}
                onChange={(e) => handleFloatChange('skInstKWh', e.target.value)}
                className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-right text-slate-900 font-mono text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500 font-normal">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="0.5"
            value={konstellation.skInstKWh}
            onChange={(e) => updateField('skInstKWh', parseFloat(e.target.value))}
            className="w-full accent-sky-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>0 kWh</span>
            <span>Typisch EFH: 5–15 kWh</span>
            <span>40 kWh</span>
          </div>
        </div>

        {/* Jahres-Einspeisung */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="einspeisung" className="text-slate-700 flex items-center gap-1.5 font-bold cursor-pointer">
              <ArrowUpRight size={18} className="text-emerald-600 shrink-0" />
              <span>Jahres-Netzeinspeisung:</span>
            </label>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700">
              <input
                id="einspeisung"
                type="number"
                min="0"
                max="50000"
                step="100"
                value={konstellation.jahresEinspeisungKWh || ''}
                onChange={(e) => handleIntChange('jahresEinspeisungKWh', e.target.value)}
                className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-right text-slate-900 font-mono text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500 font-normal">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="25000"
            step="250"
            value={konstellation.jahresEinspeisungKWh}
            onChange={(e) => updateField('jahresEinspeisungKWh', parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>0 kWh</span>
            <span>Überschusseinspeisung ins öffentliche Netz</span>
            <span>25.000 kWh</span>
          </div>
        </div>

        {/* Jahres-Netzbezug */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="bezug" className="text-slate-700 flex items-center gap-1.5 font-bold cursor-pointer">
              <ArrowDownRight size={18} className="text-blue-600 shrink-0" />
              <span>Jahres-Netzbezug:</span>
            </label>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700">
              <input
                id="bezug"
                type="number"
                min="0"
                max="25000"
                step="100"
                value={konstellation.jahresNetzbezugKWh || ''}
                onChange={(e) => handleIntChange('jahresNetzbezugKWh', e.target.value)}
                className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-right text-slate-900 font-mono text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-500 font-normal">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            step="200"
            value={konstellation.jahresNetzbezugKWh}
            onChange={(e) => updateField('jahresNetzbezugKWh', parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>0 kWh</span>
            <span>Gesamter Strombezug aus dem Netz</span>
            <span>15.000 kWh</span>
          </div>
        </div>
      </div>

      {/* Checkboxen & Optionen */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-700">
        <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 transition-colors">
          <input
            type="checkbox"
            checked={konstellation.hasLadepunkt}
            onChange={(e) => updateField('hasLadepunkt', e.target.checked)}
            className="w-4 h-4 accent-sky-600 rounded border-slate-300 cursor-pointer"
          />
          <span>Bidirektionaler Ladepunkt (V2G Wallbox, Faktor 0,2)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900 transition-colors">
          <input
            type="checkbox"
            checked={konstellation.hasSteckersolar}
            onChange={(e) => updateField('hasSteckersolar', e.target.checked)}
            className="w-4 h-4 accent-sky-600 rounded border-slate-300 cursor-pointer"
          />
          <span>Balkonkraftwerk zusätzlich vorhanden (wird gem. BNetzA nicht auf 30 kWp angerechnet)</span>
        </label>
      </div>
    </div>
  );
};
