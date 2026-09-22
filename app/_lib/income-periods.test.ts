import { describe, expect, it } from 'vitest'

import {
  buildPeriods,
  dailyTotals,
  findPaycheck,
  isCurrentPeriod,
  periodContaining,
  previousPeriod,
  totalsForPeriod,
} from './income-periods'
import { expandAll } from './recurrence'
import type { Transaction } from './types'

/** Semi-monthly paycheck on the 1st and the 15th. */
const paycheck: Transaction = {
  id: 'pay',
  seriesId: 'pay-series',
  kind: 'income',
  label: 'Salary',
  amountCents: 250_000,
  rule: { type: 'semiMonthly', days: [1, 15] },
  start: '2026-01-01',
  businessDayShift: 'none',
  isPaycheck: true,
  exceptions: [],
}

function expense(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'exp',
    seriesId: 'exp-series',
    kind: 'expense',
    label: 'Bill',
    amountCents: 10_000,
    rule: { type: 'once' },
    start: '2026-03-05',
    businessDayShift: 'none',
    exceptions: [],
    ...overrides,
  }
}

describe('findPaycheck', () => {
  it('finds the marked transaction', () => {
    expect(findPaycheck([expense(), paycheck])?.id).toBe('pay')
  })

  it('returns undefined when none is marked', () => {
    expect(findPaycheck([expense()])).toBeUndefined()
  })

  it('returns undefined for an empty list', () => {
    expect(findPaycheck([])).toBeUndefined()
  })
})

describe('buildPeriods', () => {
  it('runs from a payday to the day before the next', () => {
    const periods = buildPeriods(paycheck, '2026-03-01', '2026-03-31')

    expect(periods).toContainEqual({ start: '2026-03-01', end: '2026-03-14' })
    expect(periods).toContainEqual({ start: '2026-03-15', end: '2026-03-31' })
  })

  it('makes payday the first day of its period, not the last', () => {
    const [first] = buildPeriods(paycheck, '2026-03-01', '2026-03-20')
    expect(first.start).toBe('2026-03-01')
  })

  it('produces contiguous periods with no gaps', () => {
    const periods = buildPeriods(paycheck, '2026-01-01', '2026-06-30')

    for (let i = 1; i < periods.length; i += 1) {
      const previousEnd = new Date(`${periods[i - 1].end}T00:00:00Z`)
      const currentStart = new Date(`${periods[i].start}T00:00:00Z`)
      const gapDays = (currentStart.getTime() - previousEnd.getTime()) / 86_400_000
      expect(gapDays).toBe(1)
    }
  })

  it('spans a month end', () => {
    const periods = buildPeriods(paycheck, '2026-03-20', '2026-04-05')
    // The period starting March 15 runs to March 31.
    expect(periods).toContainEqual({ start: '2026-03-15', end: '2026-03-31' })
  })

  it('moves the boundary when a paycheck shifts', () => {
    // 2026-03-15 is a Sunday. Shifting back puts payday on Friday the 13th,
    // so that period starts on the 13th and the previous ends on the 12th.
    const shifted: Transaction = { ...paycheck, businessDayShift: 'previous' }
    const periods = buildPeriods(shifted, '2026-03-01', '2026-03-31')

    expect(periods).toContainEqual({ start: '2026-03-13', end: '2026-03-31' })
    expect(periods.find((p) => p.start === '2026-02-27')?.end).toBe('2026-03-12')
  })
})

describe('periodContaining', () => {
  it('finds the period holding a date', () => {
    expect(periodContaining(paycheck, '2026-03-10')).toEqual({
      start: '2026-03-01',
      end: '2026-03-14',
    })
  })

  it('treats payday as inside its own period', () => {
    expect(periodContaining(paycheck, '2026-03-15')?.start).toBe('2026-03-15')
  })

  it('treats the day before a payday as the previous period', () => {
    expect(periodContaining(paycheck, '2026-03-14')?.start).toBe('2026-03-01')
  })
})

describe('previousPeriod', () => {
  it('finds the period immediately before another', () => {
    const period = { start: '2026-03-15', end: '2026-03-31' }
    expect(previousPeriod(paycheck, period)).toEqual({ start: '2026-03-01', end: '2026-03-14' })
  })

  it('crosses a month boundary', () => {
    const period = { start: '2026-03-01', end: '2026-03-14' }
    expect(previousPeriod(paycheck, period)).toEqual({ start: '2026-02-15', end: '2026-02-28' })
  })
})

describe('isCurrentPeriod', () => {
  const period = { start: '2026-03-01', end: '2026-03-14' }

  it('includes both bounds', () => {
    expect(isCurrentPeriod(period, '2026-03-01')).toBe(true)
    expect(isCurrentPeriod(period, '2026-03-14')).toBe(true)
  })

  it('excludes dates outside', () => {
    expect(isCurrentPeriod(period, '2026-02-28')).toBe(false)
    expect(isCurrentPeriod(period, '2026-03-15')).toBe(false)
  })
})

describe('totalsForPeriod', () => {
  const period = { start: '2026-03-01', end: '2026-03-14' }

  const transactions = [
    paycheck,
    expense({ id: 'e1', amountCents: 10_000, start: '2026-03-02' }),
    expense({ id: 'e2', amountCents: 25_000, start: '2026-03-10' }),
    expense({ id: 'e3', amountCents: 5_000, start: '2026-03-12' }),
  ]
  const occurrences = expandAll(transactions, '2026-03-01', '2026-03-14')

  it('counts the opening paycheck as income in its own period', () => {
    const totals = totalsForPeriod(occurrences, period, '2026-03-05')
    expect(totals.income).toBe(250_000)
  })

  it('totals all expenses in the period', () => {
    const totals = totalsForPeriod(occurrences, period, '2026-03-05')
    expect(totals.expenses).toBe(40_000)
  })

  it('counts only expenses from today onward as remaining', () => {
    // On the 11th, the bills on the 2nd and 10th have passed.
    const totals = totalsForPeriod(occurrences, period, '2026-03-11')
    expect(totals.thirdFigure).toBe(5_000)
    expect(totals.kind).toBe('remaining')
  })

  it('includes a bill due today as still owing', () => {
    // On the 10th, that day's 25,000 still counts.
    const totals = totalsForPeriod(occurrences, period, '2026-03-10')
    expect(totals.thirdFigure).toBe(30_000)
  })

  it('falls back to the full total on a past period', () => {
    const totals = totalsForPeriod(occurrences, period, '2026-06-01')
    expect(totals.thirdFigure).toBe(40_000)
    expect(totals.kind).toBe('fullPeriod')
  })

  it('falls back to the full total on a future period', () => {
    const totals = totalsForPeriod(occurrences, period, '2026-01-01')
    expect(totals.thirdFigure).toBe(40_000)
    expect(totals.kind).toBe('fullPeriod')
  })

  it('ignores occurrences outside the period', () => {
    const wider = expandAll(
      [...transactions, expense({ id: 'e4', amountCents: 99_000, start: '2026-03-20' })],
      '2026-03-01',
      '2026-03-31'
    )
    expect(totalsForPeriod(wider, period, '2026-03-05').expenses).toBe(40_000)
  })

  it('returns zeros for a period with no activity', () => {
    const totals = totalsForPeriod([], period, '2026-03-05')
    expect(totals).toEqual({
      income: 0,
      expenses: 0,
      thirdFigure: 0,
      kind: 'remaining',
      net: 0,
    })
  })

  it('nets income against expenses across the period', () => {
    // 250,000 in, 40,000 out.
    expect(totalsForPeriod(occurrences, period, '2026-03-05').net).toBe(210_000)
  })

  it('reports a negative net when the period spends more than it takes in', () => {
    const heavy = expandAll(
      [expense({ id: 'big', seriesId: 'big', amountCents: 300_000, start: '2026-03-03' })],
      '2026-03-01',
      '2026-03-14'
    )
    expect(totalsForPeriod(heavy, period, '2026-03-05').net).toBe(-300_000)
  })

  it('nets the full period regardless of today', () => {
    // Unlike the third figure, the net does not change meaning as the period
    // passes — it is always the whole period.
    const early = totalsForPeriod(occurrences, period, '2026-03-01')
    const late = totalsForPeriod(occurrences, period, '2026-03-14')
    const past = totalsForPeriod(occurrences, period, '2026-06-01')

    expect(early.net).toBe(late.net)
    expect(late.net).toBe(past.net)
  })
})

describe('dailyTotals', () => {
  const period = { start: '2026-03-01', end: '2026-03-05' }

  it('returns one entry per day including empty days', () => {
    const occurrences = expandAll(
      [expense({ start: '2026-03-03', amountCents: 7_500 })],
      '2026-03-01',
      '2026-03-05'
    )
    const days = dailyTotals(occurrences, period)

    expect(days).toHaveLength(5)
    expect(days.map((d) => d.date)).toEqual([
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
    ])
    expect(days[2].expenses).toBe(7_500)
    expect(days[0]).toEqual({ date: '2026-03-01', income: 0, expenses: 0 })
  })

  it('separates income from expenses on the same day', () => {
    const occurrences = expandAll(
      [paycheck, expense({ start: '2026-03-01', amountCents: 3_000 })],
      '2026-03-01',
      '2026-03-05'
    )
    const [firstDay] = dailyTotals(occurrences, period)

    expect(firstDay.income).toBe(250_000)
    expect(firstDay.expenses).toBe(3_000)
  })

  it('sums several occurrences on one day', () => {
    const occurrences = expandAll(
      [
        expense({ id: 'a', seriesId: 'a', start: '2026-03-02', amountCents: 1_000 }),
        expense({ id: 'b', seriesId: 'b', start: '2026-03-02', amountCents: 2_500 }),
      ],
      '2026-03-01',
      '2026-03-05'
    )

    expect(dailyTotals(occurrences, period)[1].expenses).toBe(3_500)
  })
})
