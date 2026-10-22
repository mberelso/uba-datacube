import { describe, it, expect } from 'vitest';
import { MISPEL_CONSTANTS, DEFAULT_PRESETS } from '../../../src/lib/mispel/constants';

describe('MISPEL_CONSTANTS', () => {
  it('defines official BNetzA 2026 regulatory values', () => {
    expect(MISPEL_CONSTANTS.PAUSCHALGRENZE_KWH_JE_KWP).toBe(500);
    expect(MISPEL_CONSTANTS.FAKTOR_SPEICHER).toBe(0.1);
    expect(MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL).toBe(0.2);
    expect(MISPEL_CONSTANTS.MAX_KWP_PAUSCHAL).toBe(30);
  });

  it('provides the standard EFH preset', () => {
    const efh = DEFAULT_PRESETS.find(p => p.id === 'efh-standard');
    expect(efh).toBeDefined();
    expect(efh?.konstellation.pinstKWp).toBe(10);
    expect(efh?.konstellation.skInstKWh).toBe(10);
  });
});
