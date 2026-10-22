import type { MispelKonstellation, MispelPauschalErgebnis, MispelWirtschaftlichkeit } from './types';
import { MISPEL_CONSTANTS } from './constants';

export function berechneWirtschaftlichkeit(
  k: MispelKonstellation,
  res: MispelPauschalErgebnis
): MispelWirtschaftlichkeit {
  // 1. Status Quo: Feste Einspeisevergütung nach EEG
  const statusQuoErlosEuro = (k.jahresEinspeisungKWh * k.anzulegenderWertCt) / 100;
  const statusQuoBezugskostenEuro = (k.jahresNetzbezugKWh * k.strompreisCt) / 100;
  const statusQuoSaldoEuro = statusQuoErlosEuro - statusQuoBezugskostenEuro;

  // 2. MiSpeL Pauschaloption in der Direktvermarktung:
  // a) Förderfähige Menge P15 erhält den vollen anzulegenden Wert (Marktwert + Marktprämie)
  const marktwertCt = MISPEL_CONSTANTS.DEFAULT_MARKTWERT_SOLAR_CT;
  const erlosFoerderfaehigEuro = (res.p15_foerderfaehigKWh * k.anzulegenderWertCt) / 100;

  // b) Nicht förderfähige Einspeisung (Indifferenz P3 + freie Überschüsse) wird an der Börse zum Marktwert vergütet
  const ueberschussEinspeisungKWh = Math.max(k.jahresEinspeisungKWh - res.p15_foerderfaehigKWh, 0);
  const erlosMarktwertUeberschussEuro = (ueberschussEinspeisungKWh * marktwertCt) / 100;

  // c) Ersparnis durch Verrechnung (Saldierung P10) auf vermiedene EnFG-Umlagen und Netzentgelte (§ 118 Abs. 6 EnWG)
  const ersparnisSatzCt = MISPEL_CONSTANTS.DEFAULT_UMLAGEN_ERSPARNIS_CT + MISPEL_CONSTANTS.DEFAULT_NETZENTGELT_ERSPARNIS_CT;
  const mispelErsparnisSaldierungEuro = (res.p10_saldierungsfaehigKWh * ersparnisSatzCt) / 100;

  // d) Jährliche Direktvermarktungskosten (Dienstleister)
  const dvKostenEuro = MISPEL_CONSTANTS.DEFAULT_DV_KOSTEN_PAUSCHAL_EURO;

  const mispelErlosEuro = erlosFoerderfaehigEuro + erlosMarktwertUeberschussEuro;
  const mispelBezugskostenEuro = statusQuoBezugskostenEuro - mispelErsparnisSaldierungEuro;
  const mispelSaldoEuro = mispelErlosEuro - mispelBezugskostenEuro - dvKostenEuro;

  const deltaVorteilEuro = mispelSaldoEuro - statusQuoSaldoEuro;

  return {
    statusQuoErlosEuro,
    statusQuoBezugskostenEuro,
    statusQuoSaldoEuro,
    mispelErlosEuro,
    mispelErsparnisSaldierungEuro,
    mispelSaldoEuro,
    deltaVorteilEuro,
  };
}
