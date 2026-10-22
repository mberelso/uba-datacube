import React from 'react';
import { Warning, Info } from '@phosphor-icons/react';

export const MispelStatusAlert: React.FC = () => {
  return (
    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 mb-6 text-xs text-amber-950 space-y-2.5 shadow-xs">
      <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
        <Warning size={18} weight="fill" className="text-amber-600 shrink-0" />
        <span>Rechtlicher Rahmen & Übergangsstatus (Stand: Oktober 2026)</span>
      </div>
      <p className="leading-relaxed text-slate-700">
        Die MiSpeL-Festlegung (Az. 618-25-02) ist am <strong>01.10.2026</strong> beschlossen worden. Für die praktische Umsetzung gelten zwei wesentliche Fristen:
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
        <li>
          <strong>Bis 30.09.2027:</strong> Die Pauschaloption ist in der Übergangszeit mit dem Einverständnis des jeweiligen Netz- und Messstellenbetreibers anwendbar (Tenorziffer 9 a).
        </li>
        <li>
          <strong>EU-Beihilfegenehmigung:</strong> Die Pauschal-Regelung nach § 19 Abs. 3c EEG wird formell ab dem Monat nach der EU-Genehmigung voll wirksam (Tenorziffer 9 b).
        </li>
      </ul>
      <div className="pt-2 border-t border-amber-200 text-slate-500 flex items-center gap-1.5 text-[11px]">
        <Info size={15} className="text-slate-400 shrink-0" />
        <span>Hinweis: Dieser Simulator dient der unverbindlichen Orientierung. Verbindlich ist stets die Abrechnung Ihres Netzbetreibers.</span>
      </div>
    </div>
  );
};
