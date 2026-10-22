import { MispelKonstellation } from './types';
import { MISPEL_CONSTANTS } from './constants';

export interface EignungsPruefung {
  berechtigt: boolean;
  formelsatz?: 'P1' | 'P2' | 'P3';
  empfohlenerFormelsatz?: 'A1' | 'A2' | 'A10';
  grund?: string;
  hinweise: string[];
}

export function pruefeEignungPauschaloption(k: MispelKonstellation): EignungsPruefung {
  const hinweise: string[] = [];

  // 1. Schwellenwert 30 kWp (Steckersolar zählt gem. § 24 Abs. 1 S. 5 EEG NICHT mit)
  if (k.pinstKWp > MISPEL_CONSTANTS.MAX_KWP_PAUSCHAL) {
    return {
      berechtigt: false,
      empfohlenerFormelsatz: 'A1',
      grund: `Die installierte Solarleistung beträgt ${k.pinstKWp} kWp und überschreitet die Pauschalgrenze von 30 kWp (Anlage 2, Voraussetzung 3). Für größere Anlagen gilt die Abgrenzungsoption mit 2-Zähler-Messkonzept (Formelsatz A1).`,
      hinweise: ['Prüfung auf Abgrenzungsoption A1 erforderlich.'],
    };
  }

  // 2. Speicher- bzw. Ladepunkt-Präsenz
  if (k.skInstKWh <= 0 && !k.hasLadepunkt) {
    return {
      berechtigt: false,
      grund: 'Es ist weder ein Stromspeicher noch ein bidirektionaler Ladepunkt vorhanden. MiSpeL regelt ausschließlich Speicher- und Ladepunktkonstellationen.',
      hinweise: ['Verbleib in der Standard-EEG-Direktvermarktung oder festen Einspeisevergütung.'],
    };
  }

  // 3. Formelsatz-Bestimmung
  let formelsatz: 'P1' | 'P2' | 'P3' = 'P1';
  if (k.skInstKWh > 0 && k.hasLadepunkt) {
    formelsatz = 'P3';
  } else if (k.hasLadepunkt) {
    formelsatz = 'P2';
  } else {
    formelsatz = 'P1';
  }

  // 4. Regulatorische Hinweise
  hinweise.push(
    'Übergangsphase: Bis zum 30.09.2027 ist die Anwendung nur im Einverständnis von Netz- und Messstellenbetreiber zulässig (Tenorziffer 9 a).'
  );
  hinweise.push(
    'Beihilferechts-Vorbehalt: Die Pauschaloption wird erst ab dem Kalendermonat nach der EU-Beihilfegenehmigung wirksam (Tenorziffer 9 b).'
  );

  return {
    berechtigt: true,
    formelsatz,
    hinweise,
  };
}
