import { describe, expect, it } from 'vitest'

import {
  easterMonday,
  easterSunday,
  goodFriday,
  holidayOn,
  holidaysBetween,
  holidaysForYear,
  isPaymentHoliday,
} from './holidays'

describe('easterSunday', () => {
  // Known Easter dates. The algorithm is opaque enough that spot values are
  // the only practical check.
  it.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2030, '2030-04-21'],
    [2038, '2038-04-25'],
  ])('is correct for %i', (year, expected) => {
    expect(easterSunday(year)).toBe(expected)
  })

  it('handles the earliest and latest possible dates', () => {
    // Easter never falls outside March 22 - April 25.
    for (let year = 2020; year <= 2060; year += 1) {
      const date = easterSunday(year)
      expect(date >= `${year}-03-22`).toBe(true)
      expect(date <= `${year}-04-25`).toBe(true)
    }
  })

  it('always falls on a Sunday', () => {
    for (let year = 2020; year <= 2060; year += 1) {
      const date = easterSunday(year)
      expect(new Date(`${date}T00:00:00Z`).getUTCDay()).toBe(0)
    }
  })
})

describe('goodFriday and easterMonday', () => {
  it('bracket Easter Sunday', () => {
    expect(goodFriday(2026)).toBe('2026-04-03')
    expect(easterMonday(2026)).toBe('2026-04-06')
  })

  it('crosses a month boundary when Easter is early', () => {
    // Easter 2024 is March 31, so Easter Monday lands in April.
    expect(goodFriday(2024)).toBe('2024-03-29')
    expect(easterMonday(2024)).toBe('2024-04-01')
  })
})

describe('holidaysForYear', () => {
  it('returns the full set for 2026', () => {
    const byName = new Map(holidaysForYear(2026).map((h) => [h.name, h.date]))

    expect(byName.get("New Year's Day")).toBe('2026-01-01')
    expect(byName.get('Family Day')).toBe('2026-02-16')
    expect(byName.get('Good Friday')).toBe('2026-04-03')
    expect(byName.get('Easter Monday')).toBe('2026-04-06')
    expect(byName.get('Victoria Day')).toBe('2026-05-25')
    expect(byName.get('Canada Day')).toBe('2026-07-01')
    expect(byName.get('Civic Holiday')).toBe('2026-08-03')
    expect(byName.get('Labour Day')).toBe('2026-09-07')
    expect(byName.get('National Day for Truth and Reconciliation')).toBe('2026-09-30')
    expect(byName.get('Thanksgiving')).toBe('2026-10-12')
    expect(byName.get('Remembrance Day')).toBe('2026-11-11')
    expect(byName.get('Christmas Day')).toBe('2026-12-25')
    expect(byName.get('Boxing Day')).toBe('2026-12-26')
  })

  it('returns them in date order', () => {
    const dates = holidaysForYear(2026).map((h) => h.date)
    expect(dates).toEqual([...dates].sort())
  })

  it('marks the three informational holidays as not affecting payments', () => {
    const informational = holidaysForYear(2026)
      .filter((h) => !h.affectsPayments)
      .map((h) => h.name)

    expect(informational).toEqual([
      'Easter Monday',
      'National Day for Truth and Reconciliation',
      'Remembrance Day',
    ])
  })

  it('marks ten holidays as affecting payments', () => {
    expect(holidaysForYear(2026).filter((h) => h.affectsPayments)).toHaveLength(10)
  })

  it('works for any year without maintenance', () => {
    expect(holidaysForYear(2031)).toHaveLength(13)
    expect(holidaysForYear(2045)).toHaveLength(13)
  })

  it('places Victoria Day on May 25 itself when that is a Monday', () => {
    // May 25 is a Monday in both years, so the holiday is the 25th.
    const victoria2026 = holidaysForYear(2026).find((h) => h.name === 'Victoria Day')
    expect(victoria2026?.date).toBe('2026-05-25')

    const victoria2020 = holidaysForYear(2020).find((h) => h.name === 'Victoria Day')
    expect(victoria2020?.date).toBe('2020-05-25')
  })

  it('walks Victoria Day back when May 25 is not a Monday', () => {
    // 2027-05-25 is a Tuesday, so the holiday is the Monday before.
    const victoria = holidaysForYear(2027).find((h) => h.name === 'Victoria Day')
    expect(victoria?.date).toBe('2027-05-24')
  })
})

describe('holidayOn', () => {
  it('finds a holiday by date', () => {
    expect(holidayOn('2026-12-25')?.name).toBe('Christmas Day')
  })

  it('returns undefined for an ordinary day', () => {
    expect(holidayOn('2026-03-15')).toBeUndefined()
  })
})

describe('isPaymentHoliday', () => {
  it('is true for a banking holiday', () => {
    expect(isPaymentHoliday('2026-12-25')).toBe(true)
    expect(isPaymentHoliday('2026-07-01')).toBe(true)
  })

  it('is false for an informational holiday', () => {
    // Marked on the calendar, but Ontario banks generally process normally.
    expect(isPaymentHoliday('2026-11-11')).toBe(false)
    expect(isPaymentHoliday('2026-09-30')).toBe(false)
  })

  it('is false for an ordinary day', () => {
    expect(isPaymentHoliday('2026-03-15')).toBe(false)
  })
})

describe('holidaysBetween', () => {
  it('returns holidays inside an inclusive range', () => {
    const found = holidaysBetween('2026-12-01', '2026-12-31').map((h) => h.name)
    expect(found).toEqual(['Christmas Day', 'Boxing Day'])
  })

  it('includes holidays on the range bounds', () => {
    const found = holidaysBetween('2026-12-25', '2026-12-26')
    expect(found).toHaveLength(2)
  })

  it('spans a year boundary', () => {
    const found = holidaysBetween('2026-12-24', '2027-01-02').map((h) => h.name)
    expect(found).toEqual(['Christmas Day', 'Boxing Day', "New Year's Day"])
  })

  it('returns nothing for a quiet stretch', () => {
    expect(holidaysBetween('2026-03-01', '2026-03-31')).toEqual([])
  })
})
