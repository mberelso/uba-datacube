import { describe, it, expect } from 'vitest';
import { berechneWirtschaftlichkeit } from '../../../src/lib/mispel/economics';
import { berechnePauschalOption } from '../../../src/lib/mispel/pauschal';

describe('berechneWirtschaftlichkeit', () => {
  it('correctly calculates status quo revenue for 6.000 kWh at 8.1 ct', () => {
    const konstellation = {
      pinstKWp: 10.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 6000,
      jahresNetzbezugKWh: 2500,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    };
    const ergebnis = berechnePauschalOption(konstellation);
    const econ = berechneWirtschaftlichkeit(konstellation, ergebnis);

    expect(econ.statusQuoErlosEuro).toBeCloseTo(486, 0); // 6000 * 0.081
    expect(econ.mispelErsparnisSaldierungEuro).toBeCloseTo(37.5, 1); // 500 kWh * 7.5 ct
  });

  it('yields positive economic advantage when saldierungsfaehige Einspeisung is high', () => {
    // 12 kWp PV with large 12.000 kWh feed-in and 4.000 kWh grid usage (e.g. heat pump / EV)
    const konstellation = {
      pinstKWp: 12.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: true,
      jahresEinspeisungKWh: 12000,
      jahresNetzbezugKWh: 4000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    };
    const ergebnis = berechnePauschalOption(konstellation);
    const econ = berechneWirtschaftlichkeit(konstellation, ergebnis);

    expect(ergebnis.p10_saldierungsfaehigKWh).toBeGreaterThan(2000);
    expect(econ.mispelErsparnisSaldierungEuro).toBeGreaterThan(150);
    expect(econ.deltaVorteilEuro).toBeGreaterThan(0);
  });
});
