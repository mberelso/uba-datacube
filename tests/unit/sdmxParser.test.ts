import { describe, it, expect } from 'vitest'
import { parseSdmxCsv, splitFlowRef, detectTimeGranularity, aggregateSeriesToYears } from '../../src/api/sdmx'

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

  it('detects time granularity and aggregates sub-yearly series to annual values', () => {
    expect(detectTimeGranularity(['2020', '2021'])).toBe('yearly')
    expect(detectTimeGranularity(['2022-Q1', '2022-Q2'])).toBe('quarterly')
    expect(detectTimeGranularity(['2022-01', '2022-02'])).toBe('monthly')
    expect(detectTimeGranularity(['2021-02-01T22:00:00'])).toBe('subdaily')

    const seriesMap = {
      s1: {
        dimValues: ['Bahn'],
        observations: {
          '2022-Q1': 10,
          '2022-Q2': 20,
          '2023-Q1': 30,
          '2023-Q2': 50,
        },
      },
    }
    const meanAgg = aggregateSeriesToYears(seriesMap, 'mean')
    expect(meanAgg.timeValues).toEqual(['2022', '2023'])
    expect(meanAgg.seriesMap.s1.observations['2022']).toBe(15)
    expect(meanAgg.seriesMap.s1.observations['2023']).toBe(40)

    const sumAgg = aggregateSeriesToYears(seriesMap, 'sum')
    expect(sumAgg.seriesMap.s1.observations['2022']).toBe(30)
    expect(sumAgg.seriesMap.s1.observations['2023']).toBe(80)
  })
})
