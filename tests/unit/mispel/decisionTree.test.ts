import { describe, it, expect } from 'vitest';
import { pruefeEignungPauschaloption } from '../../../src/lib/mispel/decisionTree';

describe('pruefeEignungPauschaloption', () => {
  it('approves standard EFH up to 30 kWp', () => {
    const check = pruefeEignungPauschaloption({
      pinstKWp: 15.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 8000,
      jahresNetzbezugKWh: 3000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });
    expect(check.berechtigt).toBe(true);
    expect(check.formelsatz).toBe('P1');
  });

  it('rejects installations over 30 kWp and recommends Abgrenzungsoption A1', () => {
    const check = pruefeEignungPauschaloption({
      pinstKWp: 35.0,
      hasSteckersolar: false,
      pinstSteckersolarKWp: 0,
      skInstKWh: 30.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 25000,
      jahresNetzbezugKWh: 8000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });
    expect(check.berechtigt).toBe(false);
    expect(check.grund).toContain('30 kWp');
    expect(check.empfohlenerFormelsatz).toBe('A1');
  });

  it('does NOT count Steckersolar against the 30 kWp threshold', () => {
    const check = pruefeEignungPauschaloption({
      pinstKWp: 30.0,
      hasSteckersolar: true,
      pinstSteckersolarKWp: 0.8,
      skInstKWh: 10.0,
      hasLadepunkt: false,
      jahresEinspeisungKWh: 15000,
      jahresNetzbezugKWh: 3000,
      anzulegenderWertCt: 8.1,
      strompreisCt: 32.0,
    });
    expect(check.berechtigt).toBe(true);
  });
});
