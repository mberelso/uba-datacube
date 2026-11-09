import React, { useState } from 'react';
import { Question, CaretDown, CaretUp, Sparkle } from '@phosphor-icons/react';
import { MISPEL_FAQS } from '../../lib/mispel/constants';

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
