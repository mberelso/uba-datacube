import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { MispelExplainer } from '../components/mispel/MispelExplainer';
import { MispelFlowDiagram } from '../components/mispel/MispelFlowDiagram';
import { MispelPresetSelector } from '../components/mispel/MispelPresetSelector';
import { MispelInputs } from '../components/mispel/MispelInputs';
import { MispelResultCards } from '../components/mispel/MispelResultCards';
import { MispelEnergyBar } from '../components/mispel/MispelEnergyBar';
import { MispelFormulaAudit } from '../components/mispel/MispelFormulaAudit';
import { MispelStatusAlert } from '../components/mispel/MispelStatusAlert';
import { MispelFaq } from '../components/mispel/MispelFaq';
import { DEFAULT_PRESETS, MISPEL_FAQS } from '../lib/mispel/constants';
import { berechnePauschalOption } from '../lib/mispel/pauschal';
import { berechneWirtschaftlichkeit } from '../lib/mispel/economics';
import { pruefeEignungPauschaloption } from '../lib/mispel/decisionTree';
import { ShieldCheck, Sparkle, WarningCircle, ShareNetwork, Check } from '@phosphor-icons/react';

const NORDIC = {
  navy: '#1B2B3A',
  amber: '#f59e0b',
  green: '#16a34a',
  stone: '#8C8880',
};

// Rich Structured Data für Google Rich Snippets (FAQPage & WebApplication)
const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: MISPEL_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

const APP_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MiSpeL-Simulator für Heimspeicher',
  url: 'https://www.umweltpuls.de/mispel/',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  description:
    'Kostenloser Simulator zur BNetzA-Festlegung MiSpeL (Az. 618-25-02). Berechnen Sie Pauschaloption, Indifferenzbereich und Netzentgeltprivilegien für Heimspeicher bis 30 kWp.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
};

const MispelPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedLink, setCopiedLink] = useState(false);

  const initialFromUrl = useMemo(() => {
    const kwp = Number(searchParams.get('kwp'));
    const speicher = Number(searchParams.get('speicher'));
    const einspeisung = Number(searchParams.get('einspeisung'));
    const netzbezug = Number(searchParams.get('netzbezug'));
    const verg = Number(searchParams.get('verg'));
    const strompreis = Number(searchParams.get('strompreis'));
    const wallbox = searchParams.get('wallbox');
    const bkw = Number(searchParams.get('bkw'));

    if (!searchParams.has('kwp') && !searchParams.has('speicher')) return null;
    const base = DEFAULT_PRESETS[0].konstellation;
    return {
      pinstKWp: !Number.isNaN(kwp) && kwp > 0 ? kwp : base.pinstKWp,
      hasSteckersolar: !Number.isNaN(bkw) && bkw > 0,
      pinstSteckersolarKWp: !Number.isNaN(bkw) && bkw > 0 ? bkw : base.pinstSteckersolarKWp,
      skInstKWh: !Number.isNaN(speicher) && speicher >= 0 ? speicher : base.skInstKWh,
      hasLadepunkt: wallbox === '1' || wallbox === 'true',
      jahresEinspeisungKWh: !Number.isNaN(einspeisung) && einspeisung >= 0 ? einspeisung : base.jahresEinspeisungKWh,
      jahresNetzbezugKWh: !Number.isNaN(netzbezug) && netzbezug >= 0 ? netzbezug : base.jahresNetzbezugKWh,
      anzulegenderWertCt: !Number.isNaN(verg) && verg > 0 ? verg : base.anzulegenderWertCt,
      strompreisCt: !Number.isNaN(strompreis) && strompreis > 0 ? strompreis : base.strompreisCt,
    };
  }, [searchParams]);

  const [selectedPresetId, setSelectedPresetId] = useState<string>('efh-standard');
  const [isCustom, setIsCustom] = useState<boolean>(() => Boolean(initialFromUrl));
  const [konstellation, setKonstellation] = useState(() => initialFromUrl || DEFAULT_PRESETS[0].konstellation);

  const handleSelectPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setIsCustom(false);
    setKonstellation(preset.konstellation);
  };

  const handleInputChange = (updated: typeof konstellation) => {
    setIsCustom(true);
    setKonstellation(updated);
  };

  const handleShareCalculation = () => {
    const params = new URLSearchParams({
      kwp: String(konstellation.pinstKWp),
      speicher: String(konstellation.skInstKWh),
      einspeisung: String(konstellation.jahresEinspeisungKWh),
      netzbezug: String(konstellation.jahresNetzbezugKWh),
      verg: String(konstellation.anzulegenderWertCt),
      strompreis: String(konstellation.strompreisCt),
      wallbox: konstellation.hasLadepunkt ? '1' : '0',
    });
    if (konstellation.hasSteckersolar) {
      params.set('bkw', String(konstellation.pinstSteckersolarKWp));
    }
    setSearchParams(params, { replace: true });
    const shareUrl = `${window.location.origin}/mispel/?${params.toString()}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Berechnung des mathematischen Modells (P1 bis P15)
  const ergebnis = useMemo(() => berechnePauschalOption(konstellation), [konstellation]);
  const wirtschaftlichkeit = useMemo(
    () => berechneWirtschaftlichkeit(konstellation, ergebnis),
    [konstellation, ergebnis]
  );
  const eignung = useMemo(() => pruefeEignungPauschaloption(konstellation), [konstellation]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-8">
      <SEO
        title="MiSpeL-Simulator: BNetzA-Pauschalrechner für Heimspeicher"
        description="Kostenloser MiSpeL-Simulator nach BNetzA-Festlegung Az. 618-25-02 (01.10.2026): Berechnen Sie EEG-Pauschaloption, Indifferenzbereich & Netzentgeltersparnis für Heimspeicher bis 30 kWp."
        path="/mispel"
        image="https://www.umweltpuls.de/og-mispel.png"
        jsonLd={[FAQ_JSON_LD, APP_JSON_LD]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: NORDIC.amber,
            }}
          >
            ENERGIEWENDE & NETZE
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            <Sparkle size={13} weight="fill" className="text-sky-600" />
            <span>Bundesnetzagentur Az. 618-25-02 (Beschluss 01.10.2026)</span>
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              style={{ color: NORDIC.navy }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2"
            >
              MiSpeL-Simulator für Heimspeicher
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
              Berechnen und visualisieren Sie die neue BNetzA-Pauschaloption für Photovoltaikanlagen bis 30&nbsp;kWp:
              Nutzen Sie legalen Mischbetrieb mit dynamischen Stromtarifen, ohne Ihre EEG-Einspeisevergütung zu gefährden.
            </p>
          </div>
          <button
            type="button"
            onClick={handleShareCalculation}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 border-0"
          >
            {copiedLink ? (
              <>
                <Check size={15} weight="bold" className="text-emerald-400" />
                <span>Berechnungs-Link kopiert!</span>
              </>
            ) : (
              <>
                <ShareNetwork size={15} weight="bold" />
                <span>Berechnung als Link teilen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status-Hinweis zur Übergangsfrist */}
      <MispelStatusAlert />

      {/* Laienverständliche Erklärung: Was ist MiSpeL? */}
      <MispelExplainer />

      {/* Interaktives Flussdiagramm / Visualisierung */}
      <MispelFlowDiagram
        konstellation={konstellation}
        ergebnis={ergebnis}
        wirtschaftlichkeit={wirtschaftlichkeit}
      />

      {/* 1-Klick-Vorlagen */}
      <MispelPresetSelector
        selectedId={selectedPresetId}
        onSelect={handleSelectPreset}
        onCustom={() => setIsCustom(true)}
        isCustom={isCustom}
      />

      {/* Schieberegler & Smart-Defaults */}
      <MispelInputs konstellation={konstellation} onChange={handleInputChange} />

      {/* Eignungs-Hinweis falls über 30 kWp */}
      {!eignung.berechtigt ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-xs sm:text-sm text-rose-900 flex items-start gap-2.5">
          <WarningCircle size={20} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Hinweis zur Berechtigung:</strong> {eignung.grund}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 mb-6 text-xs text-emerald-950 flex items-center gap-2.5">
          <ShieldCheck size={20} weight="fill" className="text-emerald-600 shrink-0" />
          <span>
            <strong>Berechtigt für Pauschaloption {eignung.formelsatz}:</strong> Ihre Anlage erfüllt die Bedingungen nach Anlage 2 der BNetzA (bis 30 kWp ohne zweites Zählwerk).
          </span>
        </div>
      )}

      {/* Ergebnis-Karten */}
      <MispelResultCards
        wirtschaftlichkeit={wirtschaftlichkeit}
        konstellation={konstellation}
      />

      {/* BNetzA-Stapelbalken */}
      <MispelEnergyBar
        ergebnis={ergebnis}
        gesamteEinspeisung={konstellation.jahresEinspeisungKWh}
      />

      {/* Interaktiver Rechenweg & Formel-Lupe mit allen Schritten */}
      <MispelFormulaAudit
        schritte={ergebnis.formelProtokoll}
        konstellation={konstellation}
        ergebnis={ergebnis}
        wirtschaftlichkeit={wirtschaftlichkeit}
      />

      {/* SEO-Optimierte FAQ-Sektion mit Google Rich Snippets */}
      <MispelFaq />
    </div>
  );
};

export default MispelPage;
