export interface MispelKonstellation {
  pinstKWp: number;             // Installierte PV-Leistung in kWp
  hasSteckersolar: boolean;     // Ob ein Balkonkraftwerk vorhanden ist
  pinstSteckersolarKWp: number; // Leistung des Balkonkraftwerks in kWp (z.B. 0.8)
  skInstKWh: number;            // Installierte Speicherkapazität in kWh
  hasLadepunkt: boolean;        // Bidirektionaler Ladepunkt vorhanden
  jahresEinspeisungKWh: number; // Netzeinspeisung im Kalenderjahr
  jahresNetzbezugKWh: number;   // Netzbezug im Kalenderjahr
  anzulegenderWertCt: number;   // Anzulegender Wert / EEG in ct/kWh (z.B. 8.1)
  strompreisCt: number;         // Haushaltsstrompreis Bezug in ct/kWh (z.B. 32.0)
}

export interface MispelFormelSchritt {
  nummer: string;        // z.B. "(P1)"
  titel: string;         // z.B. "Pauschalgrenze der Förderfähigkeit"
  formelText: string;    // z.B. "Pinst × 500 kWh/kWp"
  rechenweg: string;     // z.B. "10 kWp × 500 = 5.000 kWh"
  ergebnis: number;      // Berechneter Wert
  einheit: string;       // "kWh", "kWh/kW", "ct/kWh", etc.
  fundstelle: string;    // "Anlage 2, Abschnitt 4.2.2"
}

export interface MispelPauschalErgebnis {
  p1_foerdergrenzeKWh: number;            // (P1)
  p2_rechengroesse: number;               // (P2)
  p3_indifferenzKWh: number;              // (P3)
  p4_saldierungsgrenzeKWh: number;        // (P4)
  p9_grundsaetzlichSaldierbarKWh: number; // (P9)
  p10_saldierungsfaehigKWh: number;       // (P10)
  p11_umlagebelasteterBezugKWh: number;   // (P11)
  p15_foerderfaehigKWh: number;           // (P15)
  formelProtokoll: MispelFormelSchritt[];
}

export interface MispelWirtschaftlichkeit {
  statusQuoErlosEuro: number;
  statusQuoBezugskostenEuro: number;
  statusQuoSaldoEuro: number;
  mispelErlosEuro: number;
  mispelErsparnisSaldierungEuro: number;
  mispelSaldoEuro: number;
  deltaVorteilEuro: number;
}

export interface MispelPreset {
  id: string;
  name: string;
  beschreibung: string;
  konstellation: MispelKonstellation;
}
