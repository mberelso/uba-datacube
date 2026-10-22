import { describe, it, expect } from 'vitest'
import { DATASET_CONTENT } from '../../src/data/datasetContent'

describe('Dataset Content Integrity (src/data/datasetContent.ts)', () => {
  it('contains valid reviewed or draft status for all entries', () => {
    const keys = Object.keys(DATASET_CONTENT)
    expect(keys.length).toBeGreaterThan(5)

    for (const key of keys) {
      const entry = DATASET_CONTENT[key]
      expect(['reviewed', 'draft']).toContain(entry.status)
      expect(entry.headline).toBeDefined()
      expect(entry.headline.length).toBeGreaterThan(5)
      expect(entry.lead).toBeDefined()
      expect(entry.trend).toBeDefined()
      expect(entry.context).toBeDefined()
      expect(entry.methodology).toBeDefined()
    }
  })

  it('validates key datasets exist with reviewed status', () => {
    const keyDatasets = [
      'DF_CLIMATE_EMISSIONS_GHG_TRENDS',
      'DF_CLIMATE_GERMANY_TEMPERATURE_MEAN',
      'DF_ENERGY_AGEE_SHARE',
    ]

    for (const id of keyDatasets) {
      expect(DATASET_CONTENT[id]).toBeDefined()
      expect(DATASET_CONTENT[id].status).toBe('reviewed')
    }
  })
})
