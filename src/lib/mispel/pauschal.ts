import { MispelKonstellation, MispelPauschalErgebnis, MispelFormelSchritt } from './types';
import { MISPEL_CONSTANTS } from './constants';

export function berechnePauschalOption(k: MispelKonstellation): MispelPauschalErgebnis {
  const protokoll: MispelFormelSchritt[] = [];

  // Effektive installierte Leistung für P1 (inkl. ggf. Steckersolar)
  const pinstEffektiv = k.pinstKWp + (k.hasSteckersolar ? (k.pinstSteckersolarKWp || 0) : 0);

  const round2 = (val: number) => Math.round(val * 100) / 100;
  const round4 = (val: number) => Math.round(val * 10000) / 10000;

  // (P1) Pauschalgrenze der Förderfähigkeit
  const p1 = round2(pinstEffektiv * MISPEL_CONSTANTS.PAUSCHALGRENZE_KWH_JE_KWP);
  protokoll.push({
    nummer: '(P1)',
    titel: 'Pauschalgrenze der Förderfähigkeit',
    formelText: 'Pinst × 500 kWh/kWp',
    rechenweg: `${pinstEffektiv.toFixed(1)} kWp × ${MISPEL_CONSTANTS.PAUSCHALGRENZE_KWH_JE_KWP} = ${p1.toLocaleString('de-DE')} kWh`,
    ergebnis: p1,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.2',
  });

  // (P2) Rechengröße
  let p2 = 0;
  let p2Formel = '';
  let p2Weg = '';
  const p2_speicher = k.skInstKWh > 0 ? (MISPEL_CONSTANTS.FAKTOR_SPEICHER * (pinstEffektiv / k.skInstKWh)) : 0;

  if (k.skInstKWh > 0 && k.hasLadepunkt) {
    p2 = round4(Math.min(p2_speicher, MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL));
    p2Formel = 'MIN[(P2)P1; (P2)P2]';
    p2Weg = `MIN[${p2_speicher.toFixed(3)}; ${MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL}] = ${p2.toFixed(3)}`;
  } else if (k.hasLadepunkt) {
    p2 = MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL;
    p2Formel = '0,2 (Ladepunkt)';
    p2Weg = '0,200';
  } else {
    p2 = round4(p2_speicher);
    p2Formel = '0,1 × Pinst / SKinst';
    p2Weg = `0,1 × ${pinstEffektiv.toFixed(1)} / ${k.skInstKWh.toFixed(1)} = ${p2.toFixed(3)}`;
  }

  protokoll.push({
    nummer: '(P2)',
    titel: 'Rechengröße Indifferenzbereich',
    formelText: p2Formel,
    rechenweg: p2Weg,
    ergebnis: p2,
    einheit: 'kWh/kW',
    fundstelle: 'Anlage 2, Abschnitt 4.2.2',
  });

  // (P3) Indifferenzbereich
  const p3 = round2(p2 * p1);
  protokoll.push({
    nummer: '(P3)',
    titel: 'Indifferenzbereich',
    formelText: '(P2) × (P1)',
    rechenweg: `${p2.toFixed(3)} × ${p1.toLocaleString('de-DE')} = ${p3.toLocaleString('de-DE')} kWh`,
    ergebnis: p3,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.2',
  });

  // (P4) Pauschalgrenze der Saldierungsfähigkeit
  const p4 = round2(p1 + p3);
  protokoll.push({
    nummer: '(P4)',
    titel: 'Pauschalgrenze der Saldierungsfähigkeit',
    formelText: '(P1) + (P3)',
    rechenweg: `${p1.toLocaleString('de-DE')} + ${p3.toLocaleString('de-DE')} = ${p4.toLocaleString('de-DE')} kWh`,
    ergebnis: p4,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.2',
  });

  // (P9) Grundsätzlich saldierungsfähig
  const p9 = round2(Math.max(k.jahresEinspeisungKWh - p4, 0));
  protokoll.push({
    nummer: '(P9)',
    titel: 'Grundsätzlich saldierungsfähige Menge',
    formelText: 'MAX[Einspeisung − (P4); 0]',
    rechenweg: `MAX[${k.jahresEinspeisungKWh.toLocaleString('de-DE')} − ${p4.toLocaleString('de-DE')}; 0] = ${p9.toLocaleString('de-DE')} kWh`,
    ergebnis: p9,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.3',
  });

  // (P10) Saldierungsfähige Netzeinspeisung
  const p10 = round2(Math.min(p9, k.jahresNetzbezugKWh));
  protokoll.push({
    nummer: '(P10)',
    titel: 'Saldierungsfähige Netzeinspeisung',
    formelText: 'MIN[(P9); Netzbezug]',
    rechenweg: `MIN[${p9.toLocaleString('de-DE')}; ${k.jahresNetzbezugKWh.toLocaleString('de-DE')}] = ${p10.toLocaleString('de-DE')} kWh`,
    ergebnis: p10,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.3',
  });

  // (P11) Umlagebelasteter Netzbezug
  const p11 = round2(Math.max(k.jahresNetzbezugKWh - p10, 0));
  protokoll.push({
    nummer: '(P11)',
    titel: 'Umlagebelasteter Netzbezug',
    formelText: 'Netzbezug − (P10)',
    rechenweg: `${k.jahresNetzbezugKWh.toLocaleString('de-DE')} − ${p10.toLocaleString('de-DE')} = ${p11.toLocaleString('de-DE')} kWh`,
    ergebnis: p11,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.3',
  });

  // (P15) Förderfähige Netzeinspeisung
  const p15 = round2(Math.min(k.jahresEinspeisungKWh, p1));
  protokoll.push({
    nummer: '(P15)',
    titel: 'Förderfähige Netzeinspeisung',
    formelText: 'MIN[Einspeisung; (P1)]',
    rechenweg: `MIN[${k.jahresEinspeisungKWh.toLocaleString('de-DE')}; ${p1.toLocaleString('de-DE')}] = ${p15.toLocaleString('de-DE')} kWh`,
    ergebnis: p15,
    einheit: 'kWh',
    fundstelle: 'Anlage 2, Abschnitt 4.2.5',
  });

  return {
    p1_foerdergrenzeKWh: p1,
    p2_rechengroesse: p2,
    p3_indifferenzKWh: p3,
    p4_saldierungsgrenzeKWh: p4,
    p9_grundsaetzlichSaldierbarKWh: p9,
    p10_saldierungsfaehigKWh: p10,
    p11_umlagebelasteterBezugKWh: p11,
    p15_foerderfaehigKWh: p15,
    formelProtokoll: protokoll,
  };
}
