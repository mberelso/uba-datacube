import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { MispelPresetSelector } from '../components/mispel/MispelPresetSelector';
import { MispelInputs } from '../components/mispel/MispelInputs';
import { MispelResultCards } from '../components/mispel/MispelResultCards';
import { MispelEnergyBar } from '../components/mispel/MispelEnergyBar';
import { MispelFormulaAudit } from '../components/mispel/MispelFormulaAudit';
import { MispelStatusAlert } from '../components/mispel/MispelStatusAlert';
import { DEFAULT_PRESETS } from '../lib/mispel/constants';
import { berechnePauschalOption } from '../lib/mispel/pauschal';
import { berechneWirtschaftlichkeit } from '../lib/mispel/economics';
import { pruefeEignungPauschaloption } from '../lib/mispel/decisionTree';
import { Cpu, ShieldCheck } from '@phosphor-icons/react';

const MispelPage: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('efh-standard');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [konstellation, setKonstellation] = useState(DEFAULT_PRESETS[0].konstellation);

  const handleSelectPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setIsCustom(false);
    setKonstellation(preset.konstellation);
  };

  const handleInputChange = (updated: typeof konstellation) => {
    setIsCustom(true);
    setKonstellation(updated);
  };

  // Berechnung
  const ergebnis = useMemo(() => berechnePauschalOption(konstellation), [konstellation]);
  const wirtschaftlichkeit = useMemo(() => berechneWirtschaftlichkeit(konstellation, ergebnis), [konstellation, ergebnis]);
  const eignung = useMemo(() => pruefeEignungPauschaloption(konstellation), [konstellation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>MiSpeL-Simulator – BNetzA Pauschalrechner für Heimspeicher | Umweltpuls</title>
        <meta
          name="description"
          content="Interaktiver Simulator zur MiSpeL-Festlegung der Bundesnetzagentur (Az. 618-25-02). Berechnen Sie Pauschaloption, Indifferenzbereich und Netzentgeltprivilegien für Heimspeicher bis 30 kWp."
        />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-400 text-xs font-medium mb-3">
            <Cpu size={16} weight="bold" />
            <span>Bundesnetzagentur Az. 618-25-02 (Beschluss 01.10.2026)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            MiSpeL-Simulator für Heimspeicher
          </h1>
          <p className="text-slate-400 text-base max-w-3xl leading-relaxed">
            Berechnen Sie die rechtliche Aufteilung und den wirtschaftlichen Mehrwert der neuen BNetzA-Pauschaloption für Photovoltaikanlagen bis 30 kWp mit Stromspeicher und bidirektionaler Wallbox.
          </p>
        </div>

        {/* Regulatorische Status-Warnung */}
        <MispelStatusAlert />

        {/* 1-Klick-Vorlagen */}
        <MispelPresetSelector
          selectedId={selectedPresetId}
          onSelect={handleSelectPreset}
          onCustom={() => setIsCustom(true)}
          isCustom={isCustom}
        />

        {/* Schieberegler & Smart-Defaults */}
        <MispelInputs
          konstellation={konstellation}
          onChange={handleInputChange}
        />

        {/* Eignungs-Hinweis falls über 30 kWp */}
        {!eignung.berechtigt ? (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 mb-6 text-sm text-red-200">
            <strong>Hinweis zur Berechtigung:</strong> {eignung.grund}
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 mb-6 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck size={18} weight="fill" className="text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Berechtigt für Pauschaloption {eignung.formelsatz}:</strong> Ihre Anlage erfüllt die Bedingungen gem. Anlage 2 (bis 30 kWp ohne zweites Zählwerk).
            </span>
          </div>
        )}

        {/* Ergebnis-Karten */}
        <MispelResultCards wirtschaftlichkeit={wirtschaftlichkeit} />

        {/* BNetzA-Stapelbalken */}
        <MispelEnergyBar
          ergebnis={ergebnis}
          gesamteEinspeisung={konstellation.jahresEinspeisungKWh}
        />

        {/* Formel-Lupe */}
        <MispelFormulaAudit schritte={ergebnis.formelProtokoll} />
      </div>
    </div>
  );
};

export default MispelPage;
