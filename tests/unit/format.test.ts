import { describe, it, expect } from 'vitest'
import { fmtNum, fmtInt, fmtPct, fmtCompact, fmtSigned, fmtYear, aggregateByYear } from '../../src/lib/format'

describe('Format Library (src/lib/format.ts)', () => {
  it('formats numbers with German locale', () => {
    expect(fmtNum(1234.5)).toBe('1.234,5')
    expect(fmtNum(0)).toBe('0')
    expect(fmtNum(null)).toBe('—')
    expect(fmtNum(NaN)).toBe('—')
  })

  it('formats integers with thousands separators', () => {
    expect(fmtInt(1234567)).toBe('1.234.567')
    expect(fmtInt(null)).toBe('—')
  })

  it('formats percentage values', () => {
    expect(fmtPct(0.153)).toBe('15,3 %')
    expect(fmtPct(15.3, 1, true)).toBe('15,3 %')
    expect(fmtPct(null)).toBe('—')
  })

  it('formats compact values', () => {
    expect(fmtCompact(4_200_000)).toBe('4,2 Mio.')
    expect(fmtCompact(1_500_000_000)).toBe('1,5 Mrd.')
    expect(fmtCompact(250_000)).toBe('250 Tsd.')
    expect(fmtCompact(123)).toBe('123')
    expect(fmtCompact(null)).toBe('—')
  })

  it('formats signed values', () => {
    expect(fmtSigned(12.3)).toBe('+12,3')
    expect(fmtSigned(-4.5)).toBe('−4,5')
    expect(fmtSigned(0)).toBe('0')
    expect(fmtSigned(null)).toBe('—')
  })

  it('formats years and sub-year periods safely', () => {
    expect(fmtYear(2026)).toBe('2026')
    expect(fmtYear(' 2024 ')).toBe('2024')
    expect(fmtYear('2022-Q4')).toBe('Q4 2022')
    expect(fmtYear('2002-04')).toBe('04/2002')
    expect(fmtYear(null)).toBe('—')
  })

  it('aggregates sub-year data to yearly averages or sums', () => {
    const monthly = [
      { year: '2022-01', value: 10 },
      { year: '2022-02', value: 20 },
      { year: '2023-01', value: 30 },
    ]
    const avg = aggregateByYear(monthly, 'avg')
    expect(avg).toEqual([
      { year: '2022', value: 15 },
      { year: '2023', value: 30 },
    ])

    const sum = aggregateByYear(monthly, 'sum')
    expect(sum).toEqual([
      { year: '2022', value: 30 },
      { year: '2023', value: 30 },
    ])
  })
})
