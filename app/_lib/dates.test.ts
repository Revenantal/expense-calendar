import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonths,
  clampToMonth,
  compareDates,
  daysBetween,
  daysInMonth,
  fromParts,
  isIsoDate,
  isLeapYear,
  isWithin,
  lastDayOfMonth,
  lastWeekdayOfMonth,
  nthWeekdayOfMonth,
  toParts,
  weekdayOf,
  weekdayOnOrBefore,
} from './dates'

describe('isIsoDate', () => {
  it('accepts a well-formed date', () => {
    expect(isIsoDate('2026-03-15')).toBe(true)
  })

  it('rejects wrong shapes', () => {
    expect(isIsoDate('2026-3-15')).toBe(false)
    expect(isIsoDate('15/03/2026')).toBe(false)
    expect(isIsoDate('')).toBe(false)
  })

  it('rejects dates that match the pattern but do not exist', () => {
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
    expect(isIsoDate('2026-00-10')).toBe(false)
  })

  it('accepts Feb 29 only in a leap year', () => {
    expect(isIsoDate('2024-02-29')).toBe(true)
    expect(isIsoDate('2026-02-29')).toBe(false)
  })
})

describe('isLeapYear', () => {
  it('follows the Gregorian rules', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2026)).toBe(false)
    // Divisible by 100 but not 400.
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
  })
})

describe('daysInMonth', () => {
  it('returns the right length for each month', () => {
    expect(daysInMonth(2026, 1)).toBe(31)
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
  })
})

describe('parts round trip', () => {
  it('splits and rebuilds a date unchanged', () => {
    expect(fromParts(toParts('2026-03-15'))).toBe('2026-03-15')
  })

  it('pads single-digit months and days', () => {
    expect(fromParts({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05')
  })
})

describe('clampToMonth', () => {
  it('pulls an impossible day back to the month end', () => {
    expect(clampToMonth(2026, 2, 31)).toBe('2026-02-28')
    expect(clampToMonth(2024, 2, 31)).toBe('2024-02-29')
    expect(clampToMonth(2026, 4, 31)).toBe('2026-04-30')
  })

  it('leaves a valid day alone', () => {
    expect(clampToMonth(2026, 3, 15)).toBe('2026-03-15')
  })
})

describe('addDays', () => {
  it('adds within a month', () => {
    expect(addDays('2026-03-15', 5)).toBe('2026-03-20')
  })

  it('rolls over a month boundary', () => {
    expect(addDays('2026-03-30', 5)).toBe('2026-04-04')
  })

  it('rolls over a year boundary', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
  })

  it('subtracts with a negative count', () => {
    expect(addDays('2026-03-02', -5)).toBe('2026-02-25')
  })

  it('crosses a leap day', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })
})

describe('addMonths', () => {
  it('keeps the day when the target month is long enough', () => {
    expect(addMonths('2026-03-15', 1)).toBe('2026-04-15')
  })

  it('clamps rather than overflowing into the next month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30')
  })

  it('crosses a year boundary', () => {
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-15')
  })

  it('subtracts across a year boundary', () => {
    expect(addMonths('2026-02-15', -3)).toBe('2025-11-15')
  })

  it('handles a quarterly stride', () => {
    expect(addMonths('2026-01-15', 3)).toBe('2026-04-15')
    expect(addMonths('2026-10-15', 3)).toBe('2027-01-15')
  })
})

describe('weekdayOf', () => {
  it('returns the correct weekday', () => {
    // 2026-03-15 is a Sunday.
    expect(weekdayOf('2026-03-15')).toBe(0)
    expect(weekdayOf('2026-03-16')).toBe(1)
    expect(weekdayOf('2026-03-21')).toBe(6)
  })
})

describe('compareDates', () => {
  it('orders dates chronologically', () => {
    expect(compareDates('2026-03-01', '2026-03-02')).toBeLessThan(0)
    expect(compareDates('2026-03-02', '2026-03-01')).toBeGreaterThan(0)
    expect(compareDates('2026-03-01', '2026-03-01')).toBe(0)
  })

  it('orders across year boundaries', () => {
    expect(compareDates('2026-12-31', '2027-01-01')).toBeLessThan(0)
  })
})

describe('isWithin', () => {
  it('includes both bounds', () => {
    expect(isWithin('2026-03-01', '2026-03-01', '2026-03-31')).toBe(true)
    expect(isWithin('2026-03-31', '2026-03-01', '2026-03-31')).toBe(true)
  })

  it('excludes dates outside the range', () => {
    expect(isWithin('2026-02-28', '2026-03-01', '2026-03-31')).toBe(false)
    expect(isWithin('2026-04-01', '2026-03-01', '2026-03-31')).toBe(false)
  })
})

describe('lastDayOfMonth', () => {
  it('returns the final date of the month', () => {
    expect(lastDayOfMonth('2026-02-10')).toBe('2026-02-28')
    expect(lastDayOfMonth('2024-02-10')).toBe('2024-02-29')
    expect(lastDayOfMonth('2026-04-01')).toBe('2026-04-30')
    expect(lastDayOfMonth('2026-12-25')).toBe('2026-12-31')
  })
})

describe('nthWeekdayOfMonth', () => {
  it('finds the third Monday of February 2026', () => {
    // Family Day.
    expect(nthWeekdayOfMonth(2026, 2, 1, 3)).toBe('2026-02-16')
  })

  it('finds the first Monday of a month', () => {
    // Labour Day 2026.
    expect(nthWeekdayOfMonth(2026, 9, 1, 1)).toBe('2026-09-07')
  })

  it('finds the second Monday of October 2026', () => {
    // Thanksgiving.
    expect(nthWeekdayOfMonth(2026, 10, 1, 2)).toBe('2026-10-12')
  })

  it('handles a month starting on the target weekday', () => {
    // 2026-06-01 is a Monday, so the first Monday is the 1st.
    expect(nthWeekdayOfMonth(2026, 6, 1, 1)).toBe('2026-06-01')
  })

  it('throws when the occurrence does not exist', () => {
    expect(() => nthWeekdayOfMonth(2026, 2, 1, 5)).toThrow(RangeError)
  })
})

describe('lastWeekdayOfMonth', () => {
  it('finds the last Monday of a month', () => {
    expect(lastWeekdayOfMonth(2026, 5, 1)).toBe('2026-05-25')
  })

  it('handles a month ending on the target weekday', () => {
    // 2026-01-31 is a Saturday.
    expect(lastWeekdayOfMonth(2026, 1, 6)).toBe('2026-01-31')
  })
})

describe('weekdayOnOrBefore', () => {
  it('returns the date itself when it already matches', () => {
    // 2026-03-16 is a Monday.
    expect(weekdayOnOrBefore('2026-03-16', 1)).toBe('2026-03-16')
  })

  it('walks back to the previous matching weekday', () => {
    // Victoria Day: the Monday on or before May 25.
    expect(weekdayOnOrBefore('2026-05-25', 1)).toBe('2026-05-25')
    expect(weekdayOnOrBefore('2027-05-25', 1)).toBe('2027-05-24')
  })

  it('crosses a month boundary when needed', () => {
    // 2026-03-01 is a Sunday; the Monday before is in February.
    expect(weekdayOnOrBefore('2026-03-01', 1)).toBe('2026-02-23')
  })
})

describe('daysBetween', () => {
  it('counts days forward', () => {
    expect(daysBetween('2026-03-01', '2026-03-15')).toBe(14)
  })

  it('returns a negative count going backward', () => {
    expect(daysBetween('2026-03-15', '2026-03-01')).toBe(-14)
  })

  it('returns zero for the same date', () => {
    expect(daysBetween('2026-03-15', '2026-03-15')).toBe(0)
  })

  it('counts across a leap day', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2)
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1)
  })
})
