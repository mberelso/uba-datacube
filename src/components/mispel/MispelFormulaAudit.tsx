import React, { useState } from 'react';
import type { MispelFormelSchritt } from '../../lib/mispel/types';
import { FileText, CaretDown, CaretUp, BookOpen } from '@phosphor-icons/react';

interface Props {
  schritte: MispelFormelSchritt[];
}

export const MispelFormulaAudit: React.FC<Props> = ({ schritte }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <FileText size={18} weight="fill" className="text-sky-400" />
          <span>Formel-Lupe: Wie rechnet die Bundesnetzagentur? (Prüfprotokoll P1 bis P15)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-sky-400">
          <span>{isOpen ? 'Einklappen' : 'Rechenweg aufklappen'}</span>
          {isOpen ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
            <BookOpen size={16} className="text-slate-400" />
            <span>Fundstelle: BNetzA Festlegung Az. 618-25-02 vom 01.10.2026, Anlage 2 (Pauschaloption)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 font-semibold">Formel</th>
                  <th className="py-2 px-3 font-semibold">Bezeichnung</th>
                  <th className="py-2 px-3 font-semibold">Rechenweg</th>
                  <th className="py-2 px-3 font-semibold text-right">Ergebnis</th>
                  <th className="py-2 px-3 font-semibold text-slate-400">Fundstelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {schritte.map((s) => (
                  <tr key={s.nummer} className="hover:bg-slate-800/30 text-slate-300">
                    <td className="py-2 px-3 font-bold text-sky-400">{s.nummer}</td>
                    <td className="py-2 px-3 font-sans text-slate-200">{s.titel}</td>
                    <td className="py-2 px-3 text-slate-400">{s.rechenweg}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {s.ergebnis.toLocaleString('de-DE', { maximumFractionDigits: 3 })} {s.einheit}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-400 text-[11px]">{s.fundstelle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
