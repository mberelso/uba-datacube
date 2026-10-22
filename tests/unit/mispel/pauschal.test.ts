import { describe, it, expect } from 'vitest';
import { berechnePauschalOption } from '../../../src/lib/mispel/pauschal';

describe('berechnePauschalOption - BNetzA Golden Tests', () => {
  it('calculates official BNetzA Example: 8 kWp / 10 kWh Speicher', () => {
    const result = berechnePauschalOption({
      pinstKWp: 8.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 6000,
      jahresNetzbezugKWh: 1500,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });

    // BNetzA Anlage 2, 2.1.6
    expect(result.p1_foerdergrenzeKWh).toBe(4000); // 8 kWp * 500
    expect(result.p2_rechengroesse).toBeCloseTo(0.08, 4); // 0.1 * 8 / 10
    expect(result.p3_indifferenzKWh).toBe(320); // 0.08 * 4000
    expect(result.p4_saldierungsgrenzeKWh).toBe(4320); // 4000 + 320
    expect(result.p15_foerderfaehigKWh).toBe(4000);
    expect(result.p9_grundsaetzlichSaldierbarKWh).toBe(1680); // 6000 - 4320
    expect(result.p10_saldierungsfaehigKWh).toBe(1500); // min(1680, 1500)
    expect(result.p11_umlagebelasteterBezugKWh).toBe(0); // 1500 - 1500
  });

  it('calculates official Example 1 (3.000 kWh Einspeisung)', () => {
    const result = berechnePauschalOption({
      pinstKWp: 8.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 3000,
      jahresNetzbezugKWh: 2000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });

    expect(result.p15_foerderfaehigKWh).toBe(3000);
    expect(result.p10_saldierungsfaehigKWh).toBe(0);
  });

  it('calculates Table 1 reference points: 10 kWp / 10 kWh => P4 = 5.500 kWh', () => {
    const result = berechnePauschalOption({
      pinstKWp: 10.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 8000,
      jahresNetzbezugKWh: 2500,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });

    expect(result.p1_foerdergrenzeKWh).toBe(5000);
    expect(result.p2_rechengroesse).toBeCloseTo(0.1, 4);
    expect(result.p3_indifferenzKWh).toBe(500);
    expect(result.p4_saldierungsgrenzeKWh).toBe(5500);
  });

  it('calculates Table 1 reference point: 30 kWp / 4 kWh => P4 = 26.250 kWh', () => {
    const result = berechnePauschalOption({
      pinstKWp: 30.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 4.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 28000,
      jahresNetzbezugKWh: 4000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });

    expect(result.p1_foerdergrenzeKWh).toBe(15000);
    expect(result.p2_rechengroesse).toBeCloseTo(0.75, 4);
    expect(result.p3_indifferenzKWh).toBe(11250);
    expect(result.p4_saldierungsgrenzeKWh).toBe(26250);
  });

  it('correctly includes Steckersolar in Pinst for P1 without breaking', () => {
    const result = berechnePauschalOption({
      pinstKWp: 10.0,
      hasSteckersolar: true,
      pinstSteckersolarKWp: 0.8,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 6500,
      jahresNetzbezugKWh: 2500,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });

    // Pinst = 10.8 kWp => P1 = 10.8 * 500 = 5400
    expect(result.p1_foerdergrenzeKWh).toBeCloseTo(5400, 1);
  });
});
