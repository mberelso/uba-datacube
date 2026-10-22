import React from 'react';
import { Warning, Info } from '@phosphor-icons/react';

export const MispelStatusAlert: React.FC = () => {
  return (
    <div className="bg-amber-950/20 border border-amber-600/30 rounded-xl p-4 mb-6 text-xs text-amber-200/90 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
        <Warning size={18} weight="fill" className="text-amber-400 flex-shrink-0" />
        <span>Rechtlicher Rahmen & Übergangsstatus (Stand: Oktober 2026)</span>
      </div>
      <p className="leading-relaxed text-slate-300">
        Die MiSpeL-Festlegung (Az. 618-25-02) ist am <strong>01.10.2026</strong> beschlossen worden. Für die praktische Umsetzung gelten zwei wesentliche Fristen:
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
        <li>
          <strong>Bis 30.09.2027:</strong> Die Pauschaloption ist in der Übergangszeit nur mit dem Einverständnis des jeweiligen Netz- und Messstellenbetreibers anwendbar (Tenorziffer 9 a).
        </li>
        <li>
          <strong>EU-Beihilfegenehmigung:</strong> Die Pauschal-Regelung nach § 19 Abs. 3c EEG wird formell erst ab dem Monat nach der EU-Genehmigung wirksam (Tenorziffer 9 b).
        </li>
      </ul>
      <div className="pt-2 border-t border-amber-600/20 text-slate-400 flex items-center gap-1.5">
        <Info size={16} className="text-slate-400 flex-shrink-0" />
        <span>Hinweis: Dieser Simulator dient der unverbindlichen Orientierung. Verbindlich ist stets die Abrechnung Ihres Netzbetreibers.</span>
      </div>
    </div>
  );
};
