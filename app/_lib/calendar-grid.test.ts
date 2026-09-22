import { describe, expect, it } from 'vitest'

import {
  buildMonthGrid,
  formatFullDate,
  formatMonthDay,
  formatMonthHeading,
  formatShortDate,
  groupByDate,
  netTotal,
} from './calendar-grid'
import type { Occurrence } from './types'

function occurrence(overrides: Partial<Occurrence> = {}): Occurrence {
  return {
    transactionId: 'txn',
    seriesId: 'series',
    date: '2026-03-15',
    scheduledDate: '2026-03-15',
    kind: 'expense',
    label: 'Bill',
    amountCents: 1000,
    isPaycheck: false,
    ...overrides,
  }
}

describe('buildMonthGrid', () => {
  it('always returns six weeks', () => {
    // A fixed cell count keeps the grid from changing height month to month.
    for (const month of ['2026-01-01', '2026-02-01', '2026-03-01', '2026-11-01']) {
      expect(buildMonthGrid(month, '2026-03-15')).toHaveLength(42)
    }
  })

  it('starts on the Sunday on or before the first of the month', () => {
    // 2026-03-01 is a Sunday, so the grid starts there.
    expect(buildMonthGrid('2026-03-10', '2026-03-15')[0].date).toBe('2026-03-01')

    // 2026-04-01 is a Wednesday, so the grid starts Sunday March 29.
    expect(buildMonthGrid('2026-04-10', '2026-03-15')[0].date).toBe('2026-03-29')
  })

  it('marks days outside the month', () => {
    const grid = buildMonthGrid('2026-04-10', '2026-03-15')

    expect(grid[0].inMonth).toBe(false)
    expect(grid.find((day) => day.date === '2026-04-01')?.inMonth).toBe(true)
    expect(grid.find((day) => day.date === '2026-04-30')?.inMonth).toBe(true)
    expect(grid.find((day) => day.date === '2026-05-01')?.inMonth).toBe(false)
  })

  it('marks today', () => {
    const grid = buildMonthGrid('2026-03-10', '2026-03-15')
    const marked = grid.filter((day) => day.isToday)

    expect(marked).toHaveLength(1)
    expect(marked[0].date).toBe('2026-03-15')
  })

  it('marks past days but not today', () => {
    const grid = buildMonthGrid('2026-03-10', '2026-03-15')

    expect(grid.find((day) => day.date === '2026-03-14')?.isPast).toBe(true)
    expect(grid.find((day) => day.date === '2026-03-15')?.isPast).toBe(false)
    expect(grid.find((day) => day.date === '2026-03-16')?.isPast).toBe(false)
  })

  it('covers every day of the month', () => {
    const grid = buildMonthGrid('2026-02-10', '2026-03-15')
    const inMonth = grid.filter((day) => day.inMonth)

    expect(inMonth).toHaveLength(28)
    expect(inMonth[0].date).toBe('2026-02-01')
    expect(inMonth[27].date).toBe('2026-02-28')
  })

  it('covers a 31-day month starting late in the week', () => {
    // 2026-08-01 is a Saturday, the worst case for fitting six weeks.
    const grid = buildMonthGrid('2026-08-01', '2026-03-15')
    const inMonth = grid.filter((day) => day.inMonth)

    expect(inMonth).toHaveLength(31)
    expect(inMonth[30].date).toBe('2026-08-31')
  })

  it('returns days in consecutive order', () => {
    const dates = buildMonthGrid('2026-03-01', '2026-03-15').map((day) => day.date)
    expect(dates).toEqual([...dates].sort())
  })
})

describe('groupByDate', () => {
  it('groups occurrences by their landing date', () => {
    const grouped = groupByDate([
      occurrence({ date: '2026-03-01', label: 'A' }),
      occurrence({ date: '2026-03-01', label: 'B' }),
      occurrence({ date: '2026-03-05', label: 'C' }),
    ])

    expect(grouped.get('2026-03-01')).toHaveLength(2)
    expect(grouped.get('2026-03-05')).toHaveLength(1)
    expect(grouped.get('2026-03-02')).toBeUndefined()
  })

  it('returns an empty map for no occurrences', () => {
    expect(groupByDate([]).size).toBe(0)
  })
})

describe('netTotal', () => {
  it('subtracts expenses from income', () => {
    expect(
      netTotal([
        occurrence({ kind: 'income', amountCents: 250_000 }),
        occurrence({ kind: 'expense', amountCents: 150_000 }),
      ])
    ).toBe(100_000)
  })

  it('returns a negative total on an expense-only day', () => {
    expect(netTotal([occurrence({ kind: 'expense', amountCents: 5_000 })])).toBe(-5_000)
  })

  it('returns zero for no occurrences', () => {
    expect(netTotal([])).toBe(0)
  })
})

describe('formatting', () => {
  it('formats a month heading', () => {
    expect(formatMonthHeading('2026-03-15', 'en-CA')).toBe('March 2026')
  })

  it('formats a full date', () => {
    expect(formatFullDate('2026-03-15', 'en-GB')).toBe('Sunday, 15 March 2026')
  })

  it('formats a short date', () => {
    expect(formatShortDate('2026-03-15', 'en-GB')).toBe('Sun 15 Mar')
  })

  it('formats a date without a weekday', () => {
    expect(formatMonthDay('2026-11-03', 'en-US')).toBe('Nov 3')
  })

  it('does not shift the date into the previous day', () => {
    // Formatters build UTC instants, so without timeZone: 'UTC' these would
    // render a day earlier anywhere west of UTC.
    expect(formatFullDate('2026-03-01', 'en-GB')).toContain('1 March')
    expect(formatShortDate('2026-01-01', 'en-GB')).toContain('1 Jan')
    expect(formatMonthDay('2026-01-01', 'en-US')).toContain('1')
    expect(formatMonthHeading('2026-01-01', 'en-CA')).toBe('January 2026')
  })
})
