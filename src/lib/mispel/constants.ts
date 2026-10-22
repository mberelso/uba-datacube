import { MispelPreset } from './types';

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
