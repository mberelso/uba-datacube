import React from 'react';
import type { MispelKonstellation } from '../../lib/mispel/types';
import { Sun, BatteryCharging, ArrowUpRight, ArrowDownRight } from '@phosphor-icons/react';

interface Props {
  konstellation: MispelKonstellation;
  onChange: (updated: MispelKonstellation) => void;
}

export const MispelInputs: React.FC<Props> = ({ konstellation, onChange }) => {
  const updateField = <K extends keyof MispelKonstellation>(field: K, value: MispelKonstellation[K]) => {
    onChange({ ...konstellation, [field]: value });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-5 mb-6">
      <h3 className="text-slate-200 font-semibold mb-4 text-base flex items-center justify-between">
        <span>Anlagenparameter anpassen</span>
        <span className="text-xs font-normal text-slate-400">Automatische Live-Neuberechnung</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PV-Leistung */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="pinst" className="text-slate-300 flex items-center gap-1.5 font-medium cursor-pointer">
              <Sun size={18} weight="fill" className="text-amber-400" />
              <span>Solarleistung gesamt:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="pinst"
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={konstellation.pinstKWp}
                onChange={(e) => updateField('pinstKWp', Math.max(0.5, parseFloat(e.target.value) || 0))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono text-sm"
              />
              <span className="text-xs text-slate-400">kWp</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={konstellation.pinstKWp}
            onChange={(e) => updateField('pinstKWp', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Speicherkapazität */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="skinst" className="text-slate-300 flex items-center gap-1.5 font-medium cursor-pointer">
              <BatteryCharging size={18} weight="fill" className="text-emerald-400" />
              <span>Speicherkapazität:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="skinst"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={konstellation.skInstKWh}
                onChange={(e) => updateField('skInstKWh', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono text-sm"
              />
              <span className="text-xs text-slate-400">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="0.5"
            value={konstellation.skInstKWh}
            onChange={(e) => updateField('skInstKWh', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Jahres-Einspeisung */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="einspeisung" className="text-slate-300 flex items-center gap-1.5 font-medium cursor-pointer">
              <ArrowUpRight size={18} className="text-emerald-400" />
              <span>Jahres-Netzeinspeisung:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="einspeisung"
                type="number"
                min="0"
                max="50000"
                step="100"
                value={konstellation.jahresEinspeisungKWh}
                onChange={(e) => updateField('jahresEinspeisungKWh', Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono text-sm"
              />
              <span className="text-xs text-slate-400">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="25000"
            step="250"
            value={konstellation.jahresEinspeisungKWh}
            onChange={(e) => updateField('jahresEinspeisungKWh', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Jahres-Netzbezug */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="bezug" className="text-slate-300 flex items-center gap-1.5 font-medium cursor-pointer">
              <ArrowDownRight size={18} className="text-amber-400" />
              <span>Jahres-Netzbezug:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="bezug"
                type="number"
                min="0"
                max="25000"
                step="100"
                value={konstellation.jahresNetzbezugKWh}
                onChange={(e) => updateField('jahresNetzbezugKWh', Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono text-sm"
              />
              <span className="text-xs text-slate-400">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            step="200"
            value={konstellation.jahresNetzbezugKWh}
            onChange={(e) => updateField('jahresNetzbezugKWh', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Checkboxen & Optionen */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-6 text-sm text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={konstellation.hasLadepunkt}
            onChange={(e) => updateField('hasLadepunkt', e.target.checked)}
            className="w-4 h-4 accent-sky-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
          />
          <span>Bidirektionaler Ladepunkt (V2G Wallbox, Faktor 0,2)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={konstellation.hasSteckersolar}
            onChange={(e) => updateField('hasSteckersolar', e.target.checked)}
            className="w-4 h-4 accent-sky-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
          />
          <span>Balkonkraftwerk zusätzlich vorhanden (0,8 kWp)</span>
        </label>
      </div>
    </div>
  );
};
