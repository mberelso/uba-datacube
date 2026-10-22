import React from 'react';
import { DEFAULT_PRESETS } from '../../lib/mispel/constants';
import type { MispelPreset } from '../../lib/mispel/types';
import { House, Lightning, Sparkle } from '@phosphor-icons/react';

interface Props {
  selectedId: string;
  onSelect: (preset: MispelPreset) => void;
  onCustom: () => void;
  isCustom: boolean;
}

export const MispelPresetSelector: React.FC<Props> = ({ selectedId, onSelect, isCustom }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
        <Sparkle size={18} weight="fill" className="text-amber-500" />
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
              className={`p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                active
                  ? 'bg-sky-50/80 border-sky-500 text-sky-950 shadow-xs ring-1 ring-sky-500/20'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm mb-1 text-slate-900">
                {preset.id.includes('wallbox') ? (
                  <Lightning size={16} weight="fill" className="text-amber-500 shrink-0" />
                ) : (
                  <House size={16} weight="fill" className="text-emerald-600 shrink-0" />
                )}
                <span>{preset.name}</span>
              </div>
              <div className="text-xs text-slate-500 leading-snug">{preset.beschreibung}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
