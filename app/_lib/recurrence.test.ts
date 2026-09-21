import { describe, expect, it } from 'vitest'

import { expandAll, expandTransaction, resolveDayOfMonth } from './recurrence'
import type { OccurrenceException, RecurrenceRule, Transaction } from './types'

/** Builds a transaction with sensible defaults for the field under test. */
function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    seriesId: 'series-1',
    kind: 'expense',
    label: 'Rent',
    amountCents: 150_000,
    rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
    start: '2026-01-01',
    businessDayShift: 'none',
    exceptions: [],
    ...overrides,
  }
}

/** Expands a rule and returns just the resulting dates. */
function datesFor(
  rule: RecurrenceRule,
  start: IsoDateLike,
  rangeStart: IsoDateLike,
  rangeEnd: IsoDateLike,
  extra: Partial<Transaction> = {}
): string[] {
  const transaction = makeTransaction({ rule, start, ...extra })
  return expandTransaction(transaction, rangeStart, rangeEnd).map((o) => o.date)
}

type IsoDateLike = string

describe('resolveDayOfMonth', () => {
  it('returns the month end for last', () => {
    expect(resolveDayOfMonth('last', 2026, 2)).toBe(28)
    expect(resolveDayOfMonth('last', 2024, 2)).toBe(29)
    expect(resolveDayOfMonth('last', 2026, 4)).toBe(30)
    expect(resolveDayOfMonth('last', 2026, 1)).toBe(31)
  })

  it('clamps a number that does not fit', () => {
    expect(resolveDayOfMonth(31, 2026, 2)).toBe(28)
    expect(resolveDayOfMonth(31, 2026, 4)).toBe(30)
  })

  it('leaves a valid number alone', () => {
    expect(resolveDayOfMonth(15, 2026, 2)).toBe(15)
  })
})

describe('once', () => {
  it('produces a single date', () => {
    expect(datesFor({ type: 'once' }, '2026-03-15', '2026-03-01', '2026-03-31')).toEqual([
      '2026-03-15',
    ])
  })

  it('produces nothing outside the range', () => {
    expect(datesFor({ type: 'once' }, '2026-05-15', '2026-03-01', '2026-03-31')).toEqual([])
  })
})

describe('daily', () => {
  it('repeats every day', () => {
    expect(
      datesFor({ type: 'daily', interval: 1 }, '2026-03-01', '2026-03-01', '2026-03-05')
    ).toEqual(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'])
  })

  it('honours an interval', () => {
    expect(
      datesFor({ type: 'daily', interval: 3 }, '2026-03-01', '2026-03-01', '2026-03-10')
    ).toEqual(['2026-03-01', '2026-03-04', '2026-03-07', '2026-03-10'])
  })
})

describe('weekly', () => {
  it('repeats on the given weekday', () => {
    // Mondays in March 2026.
    expect(
      datesFor(
        { type: 'weekly', interval: 1, weekday: 1 },
        '2026-03-01',
        '2026-03-01',
        '2026-03-31'
      )
    ).toEqual(['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23', '2026-03-30'])
  })

  it('honours a fortnightly interval', () => {
    expect(
      datesFor(
        { type: 'weekly', interval: 2, weekday: 1 },
        '2026-03-01',
        '2026-03-01',
        '2026-03-31'
      )
    ).toEqual(['2026-03-02', '2026-03-16', '2026-03-30'])
  })
})

describe('monthly', () => {
  it('repeats on the same day each month', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 15 },
        '2026-01-15',
        '2026-01-01',
        '2026-04-30'
      )
    ).toEqual(['2026-01-15', '2026-02-15', '2026-03-15', '2026-04-15'])
  })

  it('clamps the 31st into short months', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 31 },
        '2026-01-31',
        '2026-01-01',
        '2026-04-30'
      )
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('clamps to Feb 29 in a leap year', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 31 },
        '2024-01-31',
        '2024-01-01',
        '2024-03-31'
      )
    ).toEqual(['2024-01-31', '2024-02-29', '2024-03-31'])
  })

  it('handles a quarterly interval', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 3, dayOfMonth: 10 },
        '2026-01-10',
        '2026-01-01',
        '2026-12-31'
      )
    ).toEqual(['2026-01-10', '2026-04-10', '2026-07-10', '2026-10-10'])
  })

  it('resolves last across month lengths', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 'last' },
        '2026-01-01',
        '2026-01-01',
        '2026-05-31'
      )
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31'])
  })

  it('resolves last to Feb 29 in a leap year', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 'last' },
        '2024-02-01',
        '2024-02-01',
        '2024-02-29'
      )
    ).toEqual(['2024-02-29'])
  })
})

describe('semiMonthly', () => {
  it('produces two dates a month', () => {
    expect(
      datesFor({ type: 'semiMonthly', days: [1, 15] }, '2026-01-01', '2026-01-01', '2026-03-31')
    ).toEqual(['2026-01-01', '2026-01-15', '2026-02-01', '2026-02-15', '2026-03-01', '2026-03-15'])
  })

  it('orders the pair regardless of how it is written', () => {
    expect(
      datesFor({ type: 'semiMonthly', days: [15, 1] }, '2026-01-01', '2026-01-01', '2026-02-28')
    ).toEqual(['2026-01-01', '2026-01-15', '2026-02-01', '2026-02-15'])
  })

  it('supports last as the second day', () => {
    expect(
      datesFor(
        { type: 'semiMonthly', days: [15, 'last'] },
        '2026-01-01',
        '2026-01-01',
        '2026-03-31'
      )
    ).toEqual(['2026-01-15', '2026-01-31', '2026-02-15', '2026-02-28', '2026-03-15', '2026-03-31'])
  })
})

describe('yearly', () => {
  it('repeats once a year', () => {
    expect(
      datesFor({ type: 'yearly', month: 6, day: 20 }, '2026-01-01', '2026-01-01', '2028-12-31')
    ).toEqual(['2026-06-20', '2027-06-20', '2028-06-20'])
  })

  it('clamps Feb 29 in non-leap years', () => {
    expect(
      datesFor({ type: 'yearly', month: 2, day: 29 }, '2024-01-01', '2024-01-01', '2026-12-31')
    ).toEqual(['2024-02-29', '2025-02-28', '2026-02-28'])
  })
})

describe('series bounds', () => {
  it('stops at an end date', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 1 },
        '2026-01-01',
        '2026-01-01',
        '2026-12-31',
        { end: '2026-03-01' }
      )
    ).toEqual(['2026-01-01', '2026-02-01', '2026-03-01'])
  })

  it('is bounded only by the range when open-ended', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 1 },
        '2026-01-01',
        '2026-01-01',
        '2026-04-30'
      )
    ).toEqual(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01'])
  })

  it('does not produce dates before the start', () => {
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 1 },
        '2026-03-01',
        '2026-01-01',
        '2026-04-30'
      )
    ).toEqual(['2026-03-01', '2026-04-01'])
  })
})

describe('business-day shifting', () => {
  it('shifts back off a weekend', () => {
    // 2026-03-01 is a Sunday, so the occurrence lands on Friday Feb 27.
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 1 },
        '2026-03-01',
        '2026-02-01',
        '2026-03-31',
        { businessDayShift: 'previous' }
      )
    ).toEqual(['2026-02-27'])
  })

  it('belongs to the month it lands in, not the one it was scheduled in', () => {
    // Shifted into February, so a March-only query does not include it.
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 1 },
        '2026-03-01',
        '2026-03-01',
        '2026-03-31',
        { businessDayShift: 'previous' }
      )
    ).toEqual([])
  })

  it('is visible to a query covering only the date it shifted into', () => {
    // The scheduled date is outside this range; the final date is inside it.
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 1 },
        '2026-03-01',
        '2026-02-27',
        '2026-02-27',
        { businessDayShift: 'previous' }
      )
    ).toEqual(['2026-02-27'])
  })

  it('shifts forward across a month boundary', () => {
    // May 31 2026 is a Sunday, so the occurrence lands on Monday June 1.
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 'last' },
        '2026-05-01',
        '2026-05-01',
        '2026-06-30',
        { businessDayShift: 'next' }
      )
    ).toEqual(['2026-06-01', '2026-06-30'])
  })

  it('clamps before shifting', () => {
    // Feb 2026 ends Saturday the 28th: clamp to the 28th, then shift back to
    // Friday the 27th.
    expect(
      datesFor(
        { type: 'monthly', interval: 1, dayOfMonth: 31 },
        '2026-02-01',
        '2026-02-01',
        '2026-02-28',
        { businessDayShift: 'previous' }
      )
    ).toEqual(['2026-02-27'])
  })

  it('records the displacement and the scheduled date', () => {
    const transaction = makeTransaction({
      rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
      start: '2026-03-01',
      businessDayShift: 'previous',
    })
    const [occurrence] = expandTransaction(transaction, '2026-02-01', '2026-03-31')

    expect(occurrence.date).toBe('2026-02-27')
    expect(occurrence.scheduledDate).toBe('2026-03-01')
    expect(occurrence.displacement).toBe('shifted')
  })

  it('leaves a business day undisplaced', () => {
    const transaction = makeTransaction({
      rule: { type: 'monthly', interval: 1, dayOfMonth: 16 },
      start: '2026-03-16',
      businessDayShift: 'previous',
    })
    const [occurrence] = expandTransaction(transaction, '2026-03-01', '2026-03-31')

    expect(occurrence.date).toBe('2026-03-16')
    expect(occurrence.displacement).toBeUndefined()
  })
})

describe('exceptions', () => {
  const monthlyFirst: RecurrenceRule = {
    type: 'monthly',
    interval: 1,
    dayOfMonth: 10,
  }

  it('skips an occurrence', () => {
    const exceptions: OccurrenceException[] = [{ type: 'skip', date: '2026-02-10' }]
    expect(
      datesFor(monthlyFirst, '2026-01-10', '2026-01-01', '2026-03-31', { exceptions })
    ).toEqual(['2026-01-10', '2026-03-10'])
  })

  it('overrides a value without moving the date', () => {
    const exceptions: OccurrenceException[] = [
      { type: 'override', date: '2026-02-10', amountCents: 99_900, label: 'Rent (discounted)' },
    ]
    const transaction = makeTransaction({
      rule: monthlyFirst,
      start: '2026-01-10',
      exceptions,
    })
    const occurrences = expandTransaction(transaction, '2026-02-01', '2026-02-28')

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].amountCents).toBe(99_900)
    expect(occurrences[0].label).toBe('Rent (discounted)')
    expect(occurrences[0].date).toBe('2026-02-10')
  })

  it('moves an occurrence and marks it moved', () => {
    const exceptions: OccurrenceException[] = [
      { type: 'override', date: '2026-02-10', movedTo: '2026-02-12' },
    ]
    const transaction = makeTransaction({
      rule: monthlyFirst,
      start: '2026-01-10',
      exceptions,
    })
    const [occurrence] = expandTransaction(transaction, '2026-02-01', '2026-02-28')

    expect(occurrence.date).toBe('2026-02-12')
    expect(occurrence.scheduledDate).toBe('2026-02-10')
    expect(occurrence.displacement).toBe('moved')
  })

  it('does not business-day shift a manually moved occurrence', () => {
    // Moved onto Saturday 2026-02-14 with backward shifting enabled. The
    // deliberate move wins.
    const exceptions: OccurrenceException[] = [
      { type: 'override', date: '2026-02-10', movedTo: '2026-02-14' },
    ]
    const transaction = makeTransaction({
      rule: monthlyFirst,
      start: '2026-01-10',
      businessDayShift: 'previous',
      exceptions,
    })
    const [occurrence] = expandTransaction(transaction, '2026-02-01', '2026-02-28')

    expect(occurrence.date).toBe('2026-02-14')
    expect(occurrence.displacement).toBe('moved')
  })

  it('still matches exceptions after the shift direction changes', () => {
    // The exception keys on the pre-shift date, so turning shifting on does
    // not orphan it.
    const exceptions: OccurrenceException[] = [{ type: 'skip', date: '2026-03-01' }]

    const unshifted = makeTransaction({
      rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
      start: '2026-03-01',
      exceptions,
    })
    const shifted = makeTransaction({
      rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
      start: '2026-03-01',
      businessDayShift: 'previous',
      exceptions,
    })

    expect(expandTransaction(unshifted, '2026-03-01', '2026-03-31')).toEqual([])
    expect(expandTransaction(shifted, '2026-02-01', '2026-03-31')).toEqual([])
  })
})

describe('collisions', () => {
  it('keeps two occurrences landing on the same date', () => {
    // Saturday 2026-03-07 shifts back to Friday the 6th, where a weekly
    // occurrence already sits.
    const friday = makeTransaction({
      id: 'txn-friday',
      rule: { type: 'weekly', interval: 1, weekday: 5 },
      start: '2026-03-01',
      label: 'Friday bill',
    })
    const saturday = makeTransaction({
      id: 'txn-saturday',
      rule: { type: 'weekly', interval: 1, weekday: 6 },
      start: '2026-03-01',
      label: 'Saturday bill',
      businessDayShift: 'previous',
    })

    const onSixth = expandAll([friday, saturday], '2026-03-06', '2026-03-06').filter(
      (o) => o.date === '2026-03-06'
    )

    expect(onSixth).toHaveLength(2)
    expect(onSixth.map((o) => o.label).sort()).toEqual(['Friday bill', 'Saturday bill'])
  })
})

describe('expandAll', () => {
  it('merges transactions in date order', () => {
    const rent = makeTransaction({
      id: 'rent',
      rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
      start: '2026-03-01',
      label: 'Rent',
    })
    const pay = makeTransaction({
      id: 'pay',
      kind: 'income',
      rule: { type: 'semiMonthly', days: [15, 'last'] },
      start: '2026-03-01',
      label: 'Pay',
      isPaycheck: true,
    })

    const occurrences = expandAll([rent, pay], '2026-03-01', '2026-03-31')

    expect(occurrences.map((o) => o.date)).toEqual(['2026-03-01', '2026-03-15', '2026-03-31'])
    expect(occurrences[1].isPaycheck).toBe(true)
    expect(occurrences[0].isPaycheck).toBe(false)
  })

  it('returns nothing for an empty transaction list', () => {
    expect(expandAll([], '2026-03-01', '2026-03-31')).toEqual([])
  })
})
