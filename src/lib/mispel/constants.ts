import type { MispelPreset } from './types';

export const MISPEL_CONSTANTS = {
  AZ: '618-25-02',
  DATUM: '2026-10-01',
  MAX_KWP_PAUSCHAL: 30.0,
  PAUSCHALGRENZE_KWH_JE_KWP: 500,
  FAKTOR_SPEICHER: 0.1,
  FAKTOR_LADEPUNKT_FINAL: 0.2,
  UEBERGANGSFRIST_ENDE: '2027-09-30',
  DEFAULT_UMLAGEN_ERSPARNIS_CT: 3.0,     // KWKG + Offshore + §19 StromNEV
  DEFAULT_NETZENTGELT_ERSPARNIS_CT: 4.5, // § 118 Abs. 6 EnWG
  DEFAULT_MARKTWERT_SOLAR_CT: 4.508,     // Jahresmarktwert 2025 Ref.
  DEFAULT_DV_KOSTEN_PAUSCHAL_EURO: 50,   // Jährliche DV-Gebühr
} as const;

export const DEFAULT_PRESETS: MispelPreset[] = [
  {
    id: 'efh-standard',
    name: 'Einfamilienhaus Standard',
    beschreibung: '10 kWp PV + 10 kWh Speicher',
    konstellation: {
      pinstKWp: 10.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 6000,
      jahresNetzbezugKWh: 2500,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    },
  },
  {
    id: 'efh-wallbox',
    name: 'PV + Bidirektionale Wallbox',
    beschreibung: '12 kWp PV + 10 kWh Speicher + V2G Wallbox',
    konstellation: {
      pinstKWp: 12.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: true,
      jahresEinspeisungKWh: 7000,
      jahresNetzbezugKWh: 4000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    },
  },
  {
    id: 'kleinanlage',
    name: 'Kompakte Kleinanlage',
    beschreibung: '5 kWp PV + 5 kWh Speicher',
    konstellation: {
      pinstKWp: 5.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 5.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 3200,
      jahresNetzbezugKWh: 1800,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    },
  },
];

export interface MispelFaqItem {
  question: string;
  answer: string;
}

export const MISPEL_FAQS: MispelFaqItem[] = [
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

