import { describe, expect, it } from 'vitest'

import { buildForecast } from './forecast'
import { expandAll } from './recurrence'
import type { Transaction } from './types'

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

function income(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'inc',
    seriesId: 'inc-series',
    kind: 'income',
    label: 'Salary',
    amountCents: 100_000,
    rule: { type: 'once' },
    start: '2026-03-01',
    businessDayShift: 'none',
    exceptions: [],
    ...overrides,
  }
}

describe('buildForecast', () => {
  it('reports clear when there is no activity at all', () => {
    const forecast = buildForecast([], '2026-03-01')
    expect(forecast).toEqual({ outlook: 'clear', horizonEnd: '2026-05-30', horizonDays: 90 })
  })

  it('reports clear when income keeps the balance non-negative throughout', () => {
    const transactions = [
      income({ start: '2026-03-01' }),
      expense({ start: '2026-03-05', amountCents: 20_000 }),
    ]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-05-30')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast.outlook).toBe('clear')
  })

  it('reports a shortfall the day the balance first goes negative', () => {
    const transactions = [expense({ start: '2026-03-05', amountCents: 20_000 })]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-05-30')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast).toMatchObject({ outlook: 'shortfall', lastPositiveDay: '2026-03-04' })
  })

  it('counts days ahead inclusive of today', () => {
    const transactions = [expense({ start: '2026-03-05', amountCents: 20_000 })]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-05-30')

    // Today the 1st through the 4th is clear: 4 days.
    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast).toMatchObject({ daysAhead: 4 })
  })

  it('reports zero days ahead when the shortfall lands on today', () => {
    const transactions = [expense({ start: '2026-03-01', amountCents: 20_000 })]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-05-30')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast).toMatchObject({ daysAhead: 0, lastPositiveDay: '2026-02-28' })
  })

  it('names the single largest expense up to the shortfall as the driver', () => {
    const transactions = [
      income({ start: '2026-03-01', amountCents: 50_000 }),
      expense({
        id: 'small',
        seriesId: 'small',
        label: 'Internet',
        start: '2026-03-03',
        amountCents: 10_000,
      }),
      expense({
        id: 'big',
        seriesId: 'big',
        label: 'Rent',
        start: '2026-03-06',
        amountCents: 60_000,
      }),
    ]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-05-30')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast).toMatchObject({
      outlook: 'shortfall',
      largestDraw: { label: 'Rent', amountCents: 60_000, date: '2026-03-06' },
    })
  })

  it('ignores activity outside the horizon window', () => {
    const transactions = [expense({ start: '2026-08-01', amountCents: 999_000 })]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-08-31')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast.outlook).toBe('clear')
  })

  it('ignores activity before today', () => {
    const transactions = [expense({ start: '2026-02-15', amountCents: 999_000 })]
    const occurrences = expandAll(transactions, '2026-02-01', '2026-05-30')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast.outlook).toBe('clear')
  })

  it('treats a bill due today as already counted', () => {
    const transactions = [expense({ start: '2026-03-01', amountCents: 5_000 })]
    const occurrences = expandAll(transactions, '2026-03-01', '2026-05-30')

    const forecast = buildForecast(occurrences, '2026-03-01')
    expect(forecast).toMatchObject({ outlook: 'shortfall', lastPositiveDay: '2026-02-28' })
  })

  describe('period-to-date balance', () => {
    it('seeds the balance from income already received earlier this pay period', () => {
      // Paycheck on the 1st, a small bill on the 22nd — the same shape that
      // previously read as an instant shortfall, because the simulation
      // window (today..horizon) never saw the 1st.
      const transactions = [
        income({
          id: 'pay',
          seriesId: 'pay-series',
          isPaycheck: true,
          start: '2026-03-01',
          amountCents: 274_200,
        }),
        expense({ start: '2026-03-22', amountCents: 10_000 }),
      ]
      const occurrences = expandAll(transactions, '2026-03-22', '2026-06-20')

      const forecast = buildForecast(occurrences, '2026-03-22', transactions)
      expect(forecast.outlook).toBe('clear')
    })

    it('nets out expenses already paid earlier this pay period, not just income', () => {
      const transactions = [
        income({
          id: 'pay',
          seriesId: 'pay-series',
          isPaycheck: true,
          start: '2026-03-01',
          amountCents: 100_000,
        }),
        expense({ id: 'rent', seriesId: 'rent-series', start: '2026-03-05', amountCents: 90_000 }),
        expense({ id: 'bill', seriesId: 'bill-series', start: '2026-03-22', amountCents: 20_000 }),
      ]
      const occurrences = expandAll(transactions, '2026-03-22', '2026-06-20')

      // Period to date: 100,000 - 90,000 = 10,000. Today's bill is 20,000,
      // so the balance still goes negative today.
      const forecast = buildForecast(occurrences, '2026-03-22', transactions)
      expect(forecast).toMatchObject({ outlook: 'shortfall', lastPositiveDay: '2026-03-21' })
    })

    it('starts from zero when no paycheck is set', () => {
      const transactions = [expense({ start: '2026-03-22', amountCents: 10_000 })]
      const occurrences = expandAll(transactions, '2026-03-22', '2026-06-20')

      const forecast = buildForecast(occurrences, '2026-03-22', transactions)
      expect(forecast).toMatchObject({ outlook: 'shortfall', daysAhead: 0 })
    })

    it('starts from zero when defaulted, for callers that do not pass transactions', () => {
      const transactions = [expense({ start: '2026-03-22', amountCents: 10_000 })]
      const occurrences = expandAll(transactions, '2026-03-22', '2026-06-20')

      const forecast = buildForecast(occurrences, '2026-03-22')
      expect(forecast).toMatchObject({ outlook: 'shortfall', daysAhead: 0 })
    })
  })
})
