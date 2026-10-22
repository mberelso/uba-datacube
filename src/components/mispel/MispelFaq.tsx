import React, { useState } from 'react';
import { Question, CaretDown, CaretUp, Sparkle } from '@phosphor-icons/react';

export interface FaqItem {
  question: string;
  answer: string;
}

export const MISPEL_FAQS: FaqItem[] = [
  {
    question: 'Was bedeutet die Abkürzung MiSpeL?',
    answer:
      'MiSpeL steht für „Marktintegration von Speichern und Ladepunkten“. Es handelt sich um ein offizielles Festlegungsverfahren der Bundesnetzagentur (Az. 618-25-02, Beschluss vom 01.10.2026), das die energiewirtschaftlichen und messrechtlichen Rahmenbedingungen für den Mischbetrieb von Heimspeichern und bidirektionalen Ladeeinrichtungen (V2G) bundesweit einheitlich regelt.',
  },
  {
    question: 'Darf ich meinen PV-Heimspeicher jetzt legal mit günstigem Netzstrom laden?',
    answer:
      'Ja. Bisher verhinderte das starre „Ausschließlichkeitsprinzip“ im EEG das Laden aus dem Stromnetz: Wer günstigen Winterstrom aus dem Netz einspeicherte, verlor den gesetzlichen Anspruch auf die EEG-Vergütung für den ins Netz gespeisten Solarstrom. Mit der neuen BNetzA-Pauschaloption ist der Mischbetrieb für private Photovoltaikanlagen bis 30 kWp nun ausdrücklich legalisiert.',
  },
  {
    question: 'Wie viele Kilowattstunden Einspeisung behalten garantiert die EEG-Vergütung?',
    answer:
      'Nach Formel (P1) der Anlage 2 gelten pauschal bis zu 500 kWh pro Kilowattpeak (kWp) installierter Photovoltaikleistung als förderfähiger Solarstrom ([G]). Für eine typische 10-kWp-Anlage sind somit exakt 5.000 kWh Netzeinspeisung pro Kalenderjahr geschützt und erhalten die vereinbarte Einspeisevergütung.',
  },
  {
    question: 'Was passiert mit der Netzeinspeisung oberhalb der 500-kWh/kWp-Grenze?',
    answer:
      'Einspeisemengen, die über der Fördergrenze und dem Indifferenzpuffer ([I]) liegen, werden nach § 118 Abs. 6 EnWG mit Ihrem jährlichen Netzbezug saldiert ([N]). Für diese Strommenge erhalten Sie zwar keine EEG-Vergütung, werden jedoch vollständig von Netzentgelten und gesetzlichen EnFG-Umlagen befreit (Ersparnis ca. 7,5 ct/kWh). Freie Restmengen werden an der Strombörse zum Marktwert vergütet.',
  },
  {
    question: 'Zählen Balkonkraftwerke (Steckersolargeräte) zur 30-kWp-Obergrenze?',
    answer:
      'Nein. Gemäß den Tenorziffern der Festlegung und § 8 Abs. 5a EEG werden steckerfertige Solargeräte bis 800 Watt (0,8 kWp) nicht auf die 30-kWp-Grenze für die Pauschaloption angerechnet. Eine Dachanlage mit genau 30 kWp und zusätzlichem Balkonkraftwerk bleibt uneingeschränkt berechtigt.',
  },
  {
    question: 'Welche Übergangsfristen und Bedingungen müssen beachtet werden?',
    answer:
      'Bis zum 30.09.2027 gilt eine Übergangsregelung (Tenorziffer 9 a), nach der die Pauschaloption mit Einverständnis des zuständigen Netz- und Messstellenbetreibers angewendet wird. Zudem wird die formelle Regelung nach § 19 Abs. 3c EEG ab dem Monat nach der beihilferechtlichen Genehmigung durch die EU-Kommission voll wirksam.',
  },
];

export const MispelFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
          <Sparkle size={13} weight="fill" className="text-sky-600" />
          <span>Häufige Fragen & Antworten</span>
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
        FAQ zur BNetzA-Festlegung MiSpeL für Heimspeicher
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 mb-6">
        Die wichtigsten Antworten für Solaranlagenbetreiber, Speicherbesitzer und E-Mobilisten auf einen Blick.
      </p>

      <div className="space-y-3">
        {MISPEL_FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-xl border transition-colors ${
                isOpen ? 'border-sky-300 bg-sky-50/20' : 'border-slate-200 bg-white hover:bg-slate-50/50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer gap-3"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <Question size={18} weight="bold" className={isOpen ? 'text-sky-600' : 'text-slate-400'} />
                  <span>{faq.question}</span>
                </div>
                <span className="text-slate-400 shrink-0">
                  {isOpen ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-sky-100">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
