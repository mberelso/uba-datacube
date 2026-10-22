import { describe, it, expect } from 'vitest'
import { BUNDESLAENDER } from '../../src/utils/bundeslaender'

describe('Bundesländer Regional Data (src/utils/bundeslaender.ts)', () => {
  it('contains exactly 16 German federal states', () => {
    const keys = Object.keys(BUNDESLAENDER)
    expect(keys).toHaveLength(16)
  })

  it('validates state properties and data consistency', () => {
    for (const [code, state] of Object.entries(BUNDESLAENDER)) {
      expect(state.code).toBe(code)
      expect(state.name).toBeDefined()
      expect(state.capital).toBeDefined()
      expect(state.hotDaysAvg).toBeGreaterThanOrEqual(0)
      expect(state.windCapacityMw).toBeGreaterThanOrEqual(0)
      expect(state.solarCapacityMw).toBeGreaterThanOrEqual(0)
      expect(state.prtrEmissionsKt).toBeGreaterThanOrEqual(0)
      expect(state.highlights).toBeInstanceOf(Array)
      expect(state.highlights.length).toBeGreaterThan(0)
    }
  })
})
