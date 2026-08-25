import { describe, it, expect } from 'vitest'
import { parseSdmxCsv, splitFlowRef } from '../../src/api/sdmx'

describe('SDMX CSV Parser & Helpers (src/api/sdmx.ts)', () => {
  it('parses comma-separated SDMX CSV text', () => {
    const csv = `DATAFLOW,DIM1,TIME_PERIOD,OBS_VALUE
UBA,CODE1,2020,12.5
UBA,CODE1,2021,15.0
UBA,CODE2,2020,100`

    const parsed = parseSdmxCsv(csv)
    expect(parsed.colIds).toEqual(['DIM1'])
    expect(parsed.rows).toHaveLength(3)
    expect(parsed.byKey['CODE1'].obs['2020']).toBe(12.5)
    expect(parsed.byKey['CODE1'].obs['2021']).toBe(15.0)
    expect(parsed.byKey['CODE2'].obs['2020']).toBe(100)
  })

  it('parses semicolon-separated SDMX CSV text with CRLF', () => {
    const csv = "DATAFLOW;CAT;TIME_PERIOD;OBS_VALUE\r\nUBA;X;2022;42,5\r\nUBA;X;2023;-999"

    const parsed = parseSdmxCsv(csv)
    expect(parsed.colIds).toEqual(['CAT'])
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.byKey['X'].obs['2022']).toBe(42.5)
    expect(parsed.byKey['X'].obs['2023']).toBe(-999)
  })

  it('handles empty input gracefully', () => {
    const parsed = parseSdmxCsv('')
    expect(parsed.colIds).toEqual([])
    expect(parsed.rows).toEqual([])
    expect(parsed.byKey).toEqual({})
  })

  it('splits flow references correctly', () => {
    expect(splitFlowRef('UBA,DF_HEAT,1.0')).toEqual({ agencyID: 'UBA', id: 'DF_HEAT', version: '1.0' })
    expect(splitFlowRef('DF_HEAT')).toEqual({ agencyID: 'UBA', id: 'DF_HEAT', version: '1.0' })
    expect(splitFlowRef('DWD,DF_TEMP')).toEqual({ agencyID: 'DWD', id: 'DF_TEMP', version: '1.0' })
  })
})
