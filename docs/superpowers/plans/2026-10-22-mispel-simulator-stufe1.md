# MiSpeL-Simulator Stufe 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen interaktiven, formeltreuen MiSpeL-Pauschalrechner für Photovoltaikanlagen bis 30 kWp mit Heimspeicher und/oder bidirektionalem Ladepunkt auf Basis der BNetzA-Festlegung Az. 618-25-02 (Anlage 2) als neue Seite `/mispel` in UBA-Datacube implementieren.

**Architecture:** Strikt zweigeteilte Architektur: Eine zustandslose mathematische Berechnungsbibliothek unter `src/lib/mispel/` mit 100% Golden-Test-Abdeckung gegen die BNetzA-Referenztabellen, und ein reaktives React-19-Dashboard unter `src/components/mispel/` und `src/pages/MispelPage.tsx` mit barrierefreier BITV-2.0-Farb/Muster-Darstellung.

**Tech Stack:** React 19, TypeScript, Vitest, Lucide React Icons, TailwindCSS / CSS.

---

### Task 1: Core Types & Constants (`types.ts`, `constants.ts`)

**Files:**
- Create: `src/lib/mispel/types.ts`
- Create: `src/lib/mispel/constants.ts`
- Test: `tests/unit/mispel/constants.test.ts`

- [x] **Step 1: Write the failing test for constants and defaults**

```typescript
// tests/unit/mispel/constants.test.ts
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/mispel/constants.test.ts`  
Expected: FAIL (Cannot find module `constants`)

- [x] **Step 3: Implement `types.ts` and `constants.ts`**

```typescript
// src/lib/mispel/types.ts
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
  p1_foerdergrenzeKWh: number;        // (P1)
  p2_rechengroesse: number;           // (P2)
  p3_indifferenzKWh: number;          // (P3)
  p4_saldierungsgrenzeKWh: number;    // (P4)
  p9_grundsaetzlichSaldierbarKWh: number; // (P9)
  p10_saldierungsfaehigKWh: number;   // (P10)
  p11_umlagebelasteterBezugKWh: number; // (P11)
  p15_foerderfaehigKWh: number;       // (P15)
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
```

```typescript
// src/lib/mispel/constants.ts
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
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/mispel/constants.test.ts`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/mispel/ types.ts constants.ts tests/unit/mispel/constants.test.ts
git commit -m "feat(mispel): add domain types and constants for BNetzA MiSpeL"
```

---

### Task 2: Pure Calculation Engine & Golden Tests (`pauschal.ts`)

**Files:**
- Create: `tests/unit/mispel/pauschal.test.ts`
- Create: `src/lib/mispel/pauschal.ts`

- [x] **Step 1: Write the failing Golden Tests from BNetzA documentation**

```typescript
// tests/unit/mispel/pauschal.test.ts
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

    // Pinst = 10.8 kWp
    expect(result.p1_foerdergrenzeKWh).toBeCloseTo(5400, 1);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/mispel/pauschal.test.ts`  
Expected: FAIL (Cannot find module `pauschal`)

- [x] **Step 3: Implement `src/lib/mispel/pauschal.ts`**

```typescript
// src/lib/mispel/pauschal.ts
import { MispelKonstellation, MispelPauschalErgebnis, MispelFormelSchritt } from './types';
import { MISPEL_CONSTANTS } from './constants';

export function berechnePauschalOption(k: MispelKonstellation): MispelPauschalErgebnis {
  const protokoll: MispelFormelSchritt[] = [];

  // Effektive installierte Leistung für P1 (inkl. ggf. Steckersolar)
  const pinstEffektiv = k.pinstKWp + (k.hasSteckersolar ? (k.pinstSteckersolarKWp || 0) : 0);

  // (P1) Pauschalgrenze der Förderfähigkeit
  const p1 = pinstEffektiv * MISPEL_CONSTANTS.PAUSCHALGRENZE_KWH_JE_KWP;
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
    p2 = Math.min(p2_speicher, MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL);
    p2Formel = 'MIN[(P2)P1; (P2)P2]';
    p2Weg = `MIN[${p2_speicher.toFixed(3)}; ${MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL}] = ${p2.toFixed(3)}`;
  } else if (k.hasLadepunkt) {
    p2 = MISPEL_CONSTANTS.FAKTOR_LADEPUNKT_FINAL;
    p2Formel = '0,2 (Ladepunkt)';
    p2Weg = '0,200';
  } else {
    p2 = p2_speicher;
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
  const p3 = p2 * p1;
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
  const p4 = p1 + p3;
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
  const p9 = Math.max(k.jahresEinspeisungKWh - p4, 0);
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
  const p10 = Math.min(p9, k.jahresNetzbezugKWh);
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
  const p11 = Math.max(k.jahresNetzbezugKWh - p10, 0);
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
  const p15 = Math.min(k.jahresEinspeisungKWh, p1);
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
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/mispel/pauschal.test.ts`  
Expected: PASS (all 5 Golden Tests pass)

- [x] **Step 5: Commit**

```bash
git add src/lib/mispel/pauschal.ts tests/unit/mispel/pauschal.test.ts
git commit -m "feat(mispel): implement BNetzA Pauschaloption formula engine with Golden Tests"
```

---

### Task 3: Decision Tree & Eligibility Logic (`decisionTree.ts`)

**Files:**
- Create: `tests/unit/mispel/decisionTree.test.ts`
- Create: `src/lib/mispel/decisionTree.ts`

- [x] **Step 1: Write test for eligibility rules**

```typescript
// tests/unit/mispel/decisionTree.test.ts
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/mispel/decisionTree.test.ts`  
Expected: FAIL

- [x] **Step 3: Implement `src/lib/mispel/decisionTree.ts`**

```typescript
// src/lib/mispel/decisionTree.ts
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
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/mispel/decisionTree.test.ts`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/mispel/decisionTree.ts tests/unit/mispel/decisionTree.test.ts
git commit -m "feat(mispel): add eligibility and decision tree rules"
```

---

### Task 4: Economic Model (`economics.ts`)

**Files:**
- Create: `tests/unit/mispel/economics.test.ts`
- Create: `src/lib/mispel/economics.ts`

- [x] **Step 1: Write test for economic calculation**

```typescript
// tests/unit/mispel/economics.test.ts
import { describe, it, expect } from 'vitest';
import { berechneWirtschaftlichkeit } from '../../../src/lib/mispel/economics';
import { berechnePauschalOption } from '../../../src/lib/mispel/pauschal';

describe('berechneWirtschaftlichkeit', () => {
  it('calculates positive delta for EFH with significant saldierung', () => {
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
    expect(econ.mispelErsparnisSaldierungEuro).toBeGreaterThan(0);
    expect(econ.deltaVorteilEuro).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/mispel/economics.test.ts`  
Expected: FAIL

- [x] **Step 3: Implement `src/lib/mispel/economics.ts`**

```typescript
// src/lib/mispel/economics.ts
import { MispelKonstellation, MispelPauschalErgebnis, MispelWirtschaftlichkeit } from './types';
import { MISPEL_CONSTANTS } from './constants';

export function berechneWirtschaftlichkeit(
  k: MispelKonstellation,
  res: MispelPauschalErgebnis
): MispelWirtschaftlichkeit {
  // 1. Status Quo: Feste Einspeisevergütung
  const statusQuoErlosEuro = (k.jahresEinspeisungKWh * k.anzulegenderWertCt) / 100;
  const statusQuoBezugskostenEuro = (k.jahresNetzbezugKWh * k.strompreisCt) / 100;
  const statusQuoSaldoEuro = statusQuoErlosEuro - statusQuoBezugskostenEuro;

  // 2. MiSpeL Pauschaloption:
  // a) Erlös für förderfähige Einspeisung P15 (mit Marktprämie / anzulegender Wert)
  const erlosFoerderfaehigEuro = (res.p15_foerderfaehigKWh * k.anzulegenderWertCt) / 100;

  // b) Erlös für Überschusseinspeisung oberhalb P4 (Verkauf zum Marktwert)
  const restEinspeisungKWh = Math.max(res.p9_grundsaetzlichSaldierbarKWh - res.p10_saldierungsfaehigKWh, 0);
  const erlosRestMarktEuro = (restEinspeisungKWh * MISPEL_CONSTANTS.DEFAULT_MARKTWERT_SOLAR_CT) / 100;

  // c) Ersparnis durch Saldierung P10 (Umlagen + Netzentgelte)
  const ersparnisSatzCt = MISPEL_CONSTANTS.DEFAULT_UMLAGEN_ERSPARNIS_CT + MISPEL_CONSTANTS.DEFAULT_NETZENTGELT_ERSPARNIS_CT;
  const mispelErsparnisSaldierungEuro = (res.p10_saldierungsfaehigKWh * ersparnisSatzCt) / 100;

  // d) Jährliche Direktvermarktungskosten
  const dvKostenEuro = MISPEL_CONSTANTS.DEFAULT_DV_KOSTEN_PAUSCHAL_EURO;

  const mispelErlosEuro = erlosFoerderfaehigEuro + erlosRestMarktEuro;
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
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/mispel/economics.test.ts`  
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/mispel/economics.ts tests/unit/mispel/economics.test.ts
git commit -m "feat(mispel): add economic comparison engine"
```

---

### Task 5: UI Inputs & Preset Selector (`MispelPresetSelector.tsx`, `MispelInputs.tsx`)

**Files:**
- Create: `src/components/mispel/MispelPresetSelector.tsx`
- Create: `src/components/mispel/MispelInputs.tsx`

- [x] **Step 1: Implement `MispelPresetSelector.tsx`**

```tsx
// src/components/mispel/MispelPresetSelector.tsx
import React from 'react';
import { DEFAULT_PRESETS } from '../../lib/mispel/constants';
import { MispelKonstellation } from '../../lib/mispel/types';
import { Home, Zap, Sparkles } from 'lucide-react';

interface Props {
  selectedId: string;
  onSelect: (preset: typeof DEFAULT_PRESETS[0]) => void;
  onCustom: () => void;
  isCustom: boolean;
}

export const MispelPresetSelector: React.FC<Props> = ({ selectedId, onSelect, onCustom, isCustom }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold text-sm">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <span>1-Klick-Vorlagen für typische Anlagengrößen:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEFAULT_PRESETS.map((preset) => {
          const active = !isCustom && selectedId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              type="button"
              className={`p-3 rounded-lg text-left transition-all border ${
                active
                  ? 'bg-sky-950/50 border-sky-500 text-sky-100 shadow-sm shadow-sky-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-sm mb-1 text-slate-200">
                {preset.id.includes('wallbox') ? (
                  <Zap className="w-4 h-4 text-amber-400" />
                ) : (
                  <Home className="w-4 h-4 text-emerald-400" />
                )}
                <span>{preset.name}</span>
              </div>
              <div className="text-xs text-slate-400">{preset.beschreibung}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

- [x] **Step 2: Implement `MispelInputs.tsx`**

```tsx
// src/components/mispel/MispelInputs.tsx
import React from 'react';
import { MispelKonstellation } from '../../lib/mispel/types';
import { Sun, Battery, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  konstellation: MispelKonstellation;
  onChange: (updated: MispelKonstellation) => void;
}

export const MispelInputs: React.FC<Props> = ({ konstellation, onChange }) => {
  const updateField = <K extends keyof MispelKonstellation>(field: K, value: MispelKonstellation[K]) => {
    onChange({ ...konstellation, [field]: value });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-5 mb-6">
      <h3 className="text-slate-200 font-semibold mb-4 text-base flex items-center justify-between">
        <span>Anlagenparameter anpassen</span>
        <span className="text-xs font-normal text-slate-400">Automatische Live-Neuberechnung</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PV-Leistung */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="pinst" className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Solarleistung gesamt:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="pinst"
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={konstellation.pinstKWp}
                onChange={(e) => updateField('pinstKWp', Math.max(0.5, parseFloat(e.target.value) || 0))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">kWp</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={konstellation.pinstKWp}
            onChange={(e) => updateField('pinstKWp', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Speicherkapazität */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="skinst" className="text-slate-300 flex items-center gap-1.5 font-medium">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span>Speicherkapazität:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="skinst"
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={konstellation.skInstKWh}
                onChange={(e) => updateField('skInstKWh', Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            step="0.5"
            value={konstellation.skInstKWh}
            onChange={(e) => updateField('skInstKWh', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Jahres-Einspeisung */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="einspeisung" className="text-slate-300 flex items-center gap-1.5 font-medium">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Jahres-Netzeinspeisung:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="einspeisung"
                type="number"
                min="0"
                max="50000"
                step="100"
                value={konstellation.jahresEinspeisungKWh}
                onChange={(e) => updateField('jahresEinspeisungKWh', Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="25000"
            step="250"
            value={konstellation.jahresEinspeisungKWh}
            onChange={(e) => updateField('jahresEinspeisungKWh', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Jahres-Netzbezug */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="bezug" className="text-slate-300 flex items-center gap-1.5 font-medium">
              <ArrowDownRight className="w-4 h-4 text-amber-400" />
              <span>Jahres-Netzbezug:</span>
            </label>
            <div className="flex items-center gap-1 font-mono font-bold text-sky-400">
              <input
                id="bezug"
                type="number"
                min="0"
                max="25000"
                step="100"
                value={konstellation.jahresNetzbezugKWh}
                onChange={(e) => updateField('jahresNetzbezugKWh', Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-20 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right text-slate-100 font-mono"
              />
              <span className="text-xs text-slate-400">kWh</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            step="200"
            value={konstellation.jahresNetzbezugKWh}
            onChange={(e) => updateField('jahresNetzbezugKWh', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Checkboxen & Optionen */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-6 text-sm text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={konstellation.hasLadepunkt}
            onChange={(e) => updateField('hasLadepunkt', e.target.checked)}
            className="w-4 h-4 accent-sky-500 rounded bg-slate-800 border-slate-700"
          />
          <span>Bidirektionaler Ladepunkt (V2G Wallbox, Faktor 0,2)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={konstellation.hasSteckersolar}
            onChange={(e) => updateField('hasSteckersolar', e.target.checked)}
            className="w-4 h-4 accent-sky-500 rounded bg-slate-800 border-slate-700"
          />
          <span>Balkonkraftwerk zusätzlich vorhanden (0,8 kWp)</span>
        </label>
      </div>
    </div>
  );
};
```

- [x] **Step 3: Run typecheck to verify component types**

Run: `npx tsc --noEmit`  
Expected: 0 errors

- [x] **Step 4: Commit**

```bash
git add src/components/mispel/MispelPresetSelector.tsx src/components/mispel/MispelInputs.tsx
git commit -m "feat(mispel): add preset selector and interactive input controls"
```

---

### Task 6: Result Cards, Energy Bar & Formula Audit (`MispelResultCards.tsx`, `MispelEnergyBar.tsx`, `MispelFormulaAudit.tsx`, `MispelStatusAlert.tsx`)

**Files:**
- Create: `src/components/mispel/MispelResultCards.tsx`
- Create: `src/components/mispel/MispelEnergyBar.tsx`
- Create: `src/components/mispel/MispelFormulaAudit.tsx`
- Create: `src/components/mispel/MispelStatusAlert.tsx`

- [x] **Step 1: Implement `MispelResultCards.tsx`**

```tsx
// src/components/mispel/MispelResultCards.tsx
import React from 'react';
import { MispelWirtschaftlichkeit } from '../../lib/mispel/types';
import { TrendingUp, Scale, CheckCircle2 } from 'lucide-react';

interface Props {
  wirtschaftlichkeit: MispelWirtschaftlichkeit;
}

export const MispelResultCards: React.FC<Props> = ({ wirtschaftlichkeit }) => {
  const isVorteil = wirtschaftlichkeit.deltaVorteilEuro >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Status Quo */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Status Quo (EEG Fest)
        </div>
        <div className="text-2xl font-bold font-mono text-slate-200">
          {wirtschaftlichkeit.statusQuoErlosEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          <span className="text-xs font-normal text-slate-400 ml-1">/ Jahr Erlös</span>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Reine Einspeisevergütung ohne Speicherprivilegien.
        </div>
      </div>

      {/* MiSpeL Pauschaloption */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="text-xs uppercase tracking-wider text-sky-400 font-semibold mb-1">
          MiSpeL Pauschaloption P1
        </div>
        <div className="text-2xl font-bold font-mono text-sky-300">
          {(wirtschaftlichkeit.mispelErlosEuro + wirtschaftlichkeit.mispelErsparnisSaldierungEuro).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          <span className="text-xs font-normal text-slate-400 ml-1">/ Jahr Gesamtnutzen</span>
        </div>
        <div className="text-xs text-slate-400 mt-2">
          Inkl. {wirtschaftlichkeit.mispelErsparnisSaldierungEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € Netzentgelt- & Umlagensparnis.
        </div>
      </div>

      {/* Finanzieller Mehrwert (Delta) */}
      <div className={`border rounded-xl p-4 ${
        isVorteil
          ? 'bg-emerald-950/30 border-emerald-500/40'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Finanzieller Mehrwert</span>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-300">
          {isVorteil ? '+' : ''}{wirtschaftlichkeit.deltaVorteilEuro.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          <span className="text-xs font-normal text-slate-300 ml-1">/ Jahr Vorteil</span>
        </div>
        <div className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>MiSpeL-Nutzung wirtschaftlich empfohlen</span>
        </div>
      </div>
    </div>
  );
};
```

- [x] **Step 2: Implement `MispelEnergyBar.tsx` (BITV 2.0 konformer Stapelbalken)**

```tsx
// src/components/mispel/MispelEnergyBar.tsx
import React from 'react';
import { MispelPauschalErgebnis } from '../../lib/mispel/types';

interface Props {
  ergebnis: MispelPauschalErgebnis;
  gesamteEinspeisung: number;
}

export const MispelEnergyBar: React.FC<Props> = ({ ergebnis, gesamteEinspeisung }) => {
  const gesamt = Math.max(gesamteEinspeisung, 1);
  const foerderPct = Math.min((ergebnis.p15_foerderfaehigKWh / gesamt) * 100, 100);
  const indiffPct = Math.min((ergebnis.p3_indifferenzKWh / gesamt) * 100, 100 - foerderPct);
  const saldierPct = Math.min((ergebnis.p10_saldierungsfaehigKWh / gesamt) * 100, 100 - foerderPct - indiffPct);

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <h4 className="text-slate-200 font-semibold text-sm">
          Aufteilung der Netzeinspeisung nach BNetzA-Festlegung ({gesamt.toLocaleString('de-DE')} kWh)
        </h4>
        <span className="text-xs text-slate-400">Amtlicher Stapelbalken (BITV 2.0 Dreifachkodierung)</span>
      </div>

      {/* Stapelbalken */}
      <div
        className="w-full h-8 rounded-lg overflow-hidden flex bg-slate-800 border border-slate-700/60"
        role="img"
        aria-label={`Einspeisung aufgeteilt in ${ergebnis.p15_foerderfaehigKWh} kWh förderfähig, ${ergebnis.p3_indifferenzKWh} kWh indifferent, und ${ergebnis.p10_saldierungsfaehigKWh} kWh saldierungsfähig`}
      >
        {/* Förderfähig [G] - Grün */}
        <div
          style={{ width: `${foerderPct}%` }}
          className="bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Förderfähig [G]: ${ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh`}
        >
          {foerderPct > 12 && <span>{ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh [G]</span>}
        </div>

        {/* Indifferenzbereich [I] - Ocker / Schraffur */}
        <div
          style={{
            width: `${indiffPct}%`,
            backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 6px, #92400e 6px, #92400e 12px)',
          }}
          className="text-amber-100 font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Indifferenzbereich [I]: ${ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh`}
        >
          {indiffPct > 10 && <span>{ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh [I]</span>}
        </div>

        {/* Saldierungsfähig [N] - Blau / Gepunktet */}
        <div
          style={{
            width: `${saldierPct}%`,
            backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px)',
            backgroundColor: '#0369a1',
            backgroundSize: '6px 6px',
          }}
          className="text-sky-100 font-mono font-bold text-xs flex items-center justify-center transition-all duration-300"
          title={`Saldierungsfähig [N]: ${ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh`}
        >
          {saldierPct > 10 && <span>{ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh [N]</span>}
        </div>
      </div>

      {/* Legende */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-600 flex-shrink-0" />
          <span className="text-slate-300">
            <strong>[G] Förderfähig:</strong> {ergebnis.p15_foerderfaehigKWh.toLocaleString('de-DE')} kWh (Marktprämie nach EEG)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded flex-shrink-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #b45309, #b45309 3px, #92400e 3px, #92400e 6px)',
            }}
          />
          <span className="text-slate-300">
            <strong>[I] Indifferent:</strong> {ergebnis.p3_indifferenzKWh.toLocaleString('de-DE')} kWh (Pufferzone)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3.5 h-3.5 rounded flex-shrink-0 bg-sky-700"
            style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '4px 4px' }}
          />
          <span className="text-slate-300">
            <strong>[N] Saldierungsfähig:</strong> {ergebnis.p10_saldierungsfaehigKWh.toLocaleString('de-DE')} kWh (spart Umlagen)
          </span>
        </div>
      </div>
    </div>
  );
};
```

- [x] **Step 3: Implement `MispelFormulaAudit.tsx` (Formel-Lupe)**

```tsx
// src/components/mispel/MispelFormulaAudit.tsx
import React, { useState } from 'react';
import { MispelFormelSchritt } from '../../lib/mispel/types';
import { FileText, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface Props {
  schritte: MispelFormelSchritt[];
}

export const MispelFormulaAudit: React.FC<Props> = ({ schritte }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Formel-Lupe: Wie rechnet die Bundesnetzagentur? (Prüfprotokoll P1 bis P15)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-sky-400">
          <span>{isOpen ? 'Einklappen' : 'Rechenweg aufklappen'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Fundstelle: BNetzA Festlegung Az. 618-25-02 vom 01.10.2026, Anlage 2 (Pauschaloption)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 font-semibold">Formel</th>
                  <th className="py-2 px-3 font-semibold">Bezeichnung</th>
                  <th className="py-2 px-3 font-semibold">Rechenweg</th>
                  <th className="py-2 px-3 font-semibold text-right">Ergebnis</th>
                  <th className="py-2 px-3 font-semibold text-slate-400">Fundstelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {schritte.map((s) => (
                  <tr key={s.nummer} className="hover:bg-slate-800/30 text-slate-300">
                    <td className="py-2 px-3 font-bold text-sky-400">{s.nummer}</td>
                    <td className="py-2 px-3 font-sans text-slate-200">{s.titel}</td>
                    <td className="py-2 px-3 text-slate-400">{s.rechenweg}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {s.ergebnis.toLocaleString('de-DE', { maximumFractionDigits: 3 })} {s.einheit}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-400 text-[11px]">{s.fundstelle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [x] **Step 4: Implement `MispelStatusAlert.tsx`**

```tsx
// src/components/mispel/MispelStatusAlert.tsx
import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const MispelStatusAlert: React.FC = () => {
  return (
    <div className="bg-amber-950/20 border border-amber-600/30 rounded-xl p-4 mb-6 text-xs text-amber-200/90 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>Rechtlicher Rahmen & Übergangsstatus (Stand: Oktober 2026)</span>
      </div>
      <p className="leading-relaxed text-slate-300">
        Die MiSpeL-Festlegung (Az. 618-25-02) ist am <strong>01.10.2026</strong> beschlossen worden. Für die praktische Umsetzung gelten zwei wesentliche Fristen:
      </p>
      <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
        <li>
          <strong>Bis 30.09.2027:</strong> Die Pauschaloption ist in der Übergangszeit nur mit dem Einverständnis des jeweiligen Netz- und Messstellenbetreibers anwendbar (Tenorziffer 9 a).
        </li>
        <li>
          <strong>EU-Beihilfegenehmigung:</strong> Die Pauschal-Regelung nach § 19 Abs. 3c EEG wird formell erst ab dem Monat nach der EU-Genehmigung wirksam (Tenorziffer 9 b).
        </li>
      </ul>
      <div className="pt-2 border-t border-amber-600/20 text-slate-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>Hinweis: Dieser Simulator dient der unverbindlichen Orientierung. Verbindlich ist stets die Abrechnung Ihres Netzbetreibers.</span>
      </div>
    </div>
  );
};
```

- [x] **Step 5: Run typecheck to verify all components compile**

Run: `npx tsc --noEmit`  
Expected: 0 errors

- [x] **Step 6: Commit**

```bash
git add src/components/mispel/
git commit -m "feat(mispel): add result cards, BITV energy bar, formula audit, and legal alert"
```

---

### Task 7: Page Integration, Route & Navigation (`MispelPage.tsx`, `App.tsx`, `Navbar.tsx`, `generate-sitemap.ts`)

**Files:**
- Create: `src/pages/MispelPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `scripts/generate-sitemap.ts`

- [x] **Step 1: Create `src/pages/MispelPage.tsx`**

```tsx
// src/pages/MispelPage.tsx
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { MispelPresetSelector } from '../components/mispel/MispelPresetSelector';
import { MispelInputs } from '../components/mispel/MispelInputs';
import { MispelResultCards } from '../components/mispel/MispelResultCards';
import { MispelEnergyBar } from '../components/mispel/MispelEnergyBar';
import { MispelFormulaAudit } from '../components/mispel/MispelFormulaAudit';
import { MispelStatusAlert } from '../components/mispel/MispelStatusAlert';
import { DEFAULT_PRESETS } from '../lib/mispel/constants';
import { berechnePauschalOption } from '../lib/mispel/pauschal';
import { berechneWirtschaftlichkeit } from '../lib/mispel/economics';
import { pruefeEignungPauschaloption } from '../lib/mispel/decisionTree';
import { ShieldCheck, Cpu } from 'lucide-react';

const MispelPage: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('efh-standard');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [konstellation, setKonstellation] = useState(DEFAULT_PRESETS[0].konstellation);

  const handleSelectPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setIsCustom(false);
    setKonstellation(preset.konstellation);
  };

  const handleInputChange = (updated: typeof konstellation) => {
    setIsCustom(true);
    setKonstellation(updated);
  };

  // Berechnung
  const ergebnis = useMemo(() => berechnePauschalOption(konstellation), [konstellation]);
  const wirtschaftlichkeit = useMemo(() => berechneWirtschaftlichkeit(konstellation, ergebnis), [konstellation, ergebnis]);
  const eignung = useMemo(() => pruefeEignungPauschaloption(konstellation), [konstellation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>MiSpeL-Simulator – BNetzA Pauschalrechner für Heimspeicher | Umweltpuls</title>
        <meta
          name="description"
          content="Interaktiver Simulator zur MiSpeL-Festlegung der Bundesnetzagentur (Az. 618-25-02). Berechnen Sie Pauschaloption, Indifferenzbereich und Netzentgeltprivilegien für Heimspeicher bis 30 kWp."
        />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-400 text-xs font-medium mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Bundesnetzagentur Az. 618-25-02 (Beschluss 01.10.2026)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            MiSpeL-Simulator für Heimspeicher
          </h1>
          <p className="text-slate-400 text-base max-w-3xl leading-relaxed">
            Berechnen Sie die rechtliche Aufteilung und den wirtschaftlichen Mehrwert der neuen BNetzA-Pauschaloption für Photovoltaikanlagen bis 30 kWp mit Stromspeicher und bidirektionaler Wallbox.
          </p>
        </div>

        {/* Regulatorische Status-Warnung */}
        <MispelStatusAlert />

        {/* 1-Klick-Vorlagen */}
        <MispelPresetSelector
          selectedId={selectedPresetId}
          onSelect={handleSelectPreset}
          onCustom={() => setIsCustom(true)}
          isCustom={isCustom}
        />

        {/* Schieberegler & Smart-Defaults */}
        <MispelInputs
          konstellation={konstellation}
          onChange={handleInputChange}
        />

        {/* Eignungs-Hinweis falls über 30 kWp */}
        {!eignung.berechtigt && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 mb-6 text-sm text-red-200">
            <strong>Hinweis zur Berechtigung:</strong> {eignung.grund}
          </div>
        )}

        {/* Ergebnis-Karten */}
        <MispelResultCards wirtschaftlichkeit={wirtschaftlichkeit} />

        {/* BNetzA-Stapelbalken */}
        <MispelEnergyBar
          ergebnis={ergebnis}
          gesamteEinspeisung={konstellation.jahresEinspeisungKWh}
        />

        {/* Formel-Lupe */}
        <MispelFormulaAudit schritte={ergebnis.formelProtokoll} />
      </div>
    </div>
  );
};

export default MispelPage;
```

- [x] **Step 2: Add Route to `src/App.tsx`**

Lazy-load `MispelPage` in `src/App.tsx` and register `<Route path="/mispel" element={<MispelPage />} />`.

- [x] **Step 3: Add Navigation item to `src/components/Navbar.tsx`**

Add link to `/mispel` with a badge "MiSpeL" next to "Solar", "Wind", etc.

- [x] **Step 4: Add `/mispel` to `scripts/generate-sitemap.ts`**

Ensure `/mispel` is included in static routes.

- [x] **Step 5: Run tests and typecheck**

Run: `npx tsc --noEmit && npm test`  
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add src/pages/MispelPage.tsx src/App.tsx src/components/Navbar.tsx scripts/generate-sitemap.ts
git commit -m "feat(mispel): integrate MiSpeL simulator route and navigation link"
```

---

### Task 8: End-to-End Build & Verification

**Files:**
- Test: Full build, lint, and test suite

- [x] **Step 1: Run complete test suite**

Run: `npm test`  
Expected: All tests pass (including all MiSpeL Golden Tests).

- [x] **Step 2: Run linter and typechecker**

Run: `npm run lint` and `npx tsc --noEmit`  
Expected: 0 errors, 0 warnings.

- [x] **Step 3: Run production build and prerender check**

Run: `npm run build`  
Expected: Successful build, bundle created, sitemap includes `/mispel`.

- [x] **Step 4: Commit and finalize**

```bash
git commit -m "chore: verify and finalize MiSpeL simulator stage 1"
```
