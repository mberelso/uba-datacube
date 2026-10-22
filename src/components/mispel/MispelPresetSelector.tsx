import React from 'react';
import { DEFAULT_PRESETS } from '../../lib/mispel/constants';
import { MispelPreset } from '../../lib/mispel/types';
import { House, Lightning, Sparkle } from '@phosphor-icons/react';

interface Props {
  selectedId: string;
  onSelect: (preset: MispelPreset) => void;
  onCustom: () => void;
  isCustom: boolean;
}

export const MispelPresetSelector: React.FC<Props> = ({ selectedId, onSelect, isCustom }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold text-sm">
        <Sparkle size={18} weight="fill" className="text-sky-400" />
        <span>1-Klick-Vorlagen für typische Anlagengrößen:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEFAULT_PRESETS.map((preset) => {
          const active = !isCustom && selectedId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              type="button"
              className={`p-3 rounded-lg text-left transition-all border cursor-pointer ${
                active
                  ? 'bg-sky-950/50 border-sky-500 text-sky-100 shadow-sm shadow-sky-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-sm mb-1 text-slate-200">
                {preset.id.includes('wallbox') ? (
                  <Lightning size={16} weight="fill" className="text-amber-400" />
                ) : (
                  <House size={16} weight="fill" className="text-emerald-400" />
                )}
                <span>{preset.name}</span>
              </div>
              <div className="text-xs text-slate-400">{preset.beschreibung}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
