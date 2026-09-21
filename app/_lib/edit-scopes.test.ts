import { describe, expect, it } from 'vitest'

import { applyDelete, applyEdit, applyMove } from './edit-scopes'
import { expandAll, expandTransaction } from './recurrence'
import type { Transaction } from './types'

/** Monthly rent on the 1st, running from January. */
const rent: Transaction = {
  id: 'rent',
  seriesId: 'rent-series',
  kind: 'expense',
  label: 'Rent',
  amountCents: 150_000,
  rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
  start: '2026-01-01',
  businessDayShift: 'none',
  exceptions: [],
}

const edit = {
  kind: 'expense' as const,
  label: 'Rent (increased)',
  amountCents: 165_000,
  rule: rent.rule,
  businessDayShift: 'none' as const,
  isPaycheck: undefined,
}

describe('applyDelete', () => {
  it('skips one occurrence and leaves the rest', () => {
    const [updated] = applyDelete(rent, '2026-03-01', 'this')
    const dates = expandTransaction(updated, '2026-01-01', '2026-05-31').map((o) => o.date)

    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-04-01', '2026-05-01'])
  })

  it('ends the series from an occurrence forward', () => {
    const [updated] = applyDelete(rent, '2026-03-01', 'future')

    expect(updated.end).toBe('2026-02-28')
    const dates = expandTransaction(updated, '2026-01-01', '2026-05-31').map((o) => o.date)
    expect(dates).toEqual(['2026-01-01', '2026-02-01'])
  })

  it('removes the series entirely when ending at its first occurrence', () => {
    // Nothing would remain, so there is no series left to keep.
    expect(applyDelete(rent, '2026-01-01', 'future')).toEqual([])
  })

  it('removes everything for the all scope', () => {
    expect(applyDelete(rent, '2026-03-01', 'all')).toEqual([])
  })

  it('replaces an existing exception on the same date', () => {
    const withException = applyDelete(rent, '2026-03-01', 'this')[0]
    const again = applyDelete(withException, '2026-03-01', 'this')[0]

    expect(again.exceptions).toHaveLength(1)
  })
})

describe('applyEdit', () => {
  it('overrides a single occurrence without touching the rest', () => {
    const [updated] = applyEdit(rent, '2026-03-01', 'this', edit, 'new-id')
    const occurrences = expandTransaction(updated, '2026-02-01', '2026-04-30')

    const march = occurrences.find((o) => o.date === '2026-03-01')
    const april = occurrences.find((o) => o.date === '2026-04-01')

    expect(march?.amountCents).toBe(165_000)
    expect(march?.label).toBe('Rent (increased)')
    expect(april?.amountCents).toBe(150_000)
    expect(april?.label).toBe('Rent')
  })

  it('changes every occurrence for the all scope', () => {
    const [updated] = applyEdit(rent, '2026-03-01', 'all', edit, 'new-id')
    const occurrences = expandTransaction(updated, '2026-01-01', '2026-04-30')

    expect(occurrences.every((o) => o.amountCents === 165_000)).toBe(true)
  })

  it('splits the series for the future scope', () => {
    const result = applyEdit(rent, '2026-03-01', 'future', edit, 'new-id')

    expect(result).toHaveLength(2)
    expect(result[0].end).toBe('2026-02-28')
    expect(result[1].start).toBe('2026-03-01')
    expect(result[1].id).toBe('new-id')
  })

  it('keeps both segments in one logical series', () => {
    const result = applyEdit(rent, '2026-03-01', 'future', edit, 'new-id')
    expect(result[1].seriesId).toBe(rent.seriesId)
  })

  it('leaves past occurrences on their old values after a split', () => {
    const result = applyEdit(rent, '2026-03-01', 'future', edit, 'new-id')
    const occurrences = expandAll(result, '2026-01-01', '2026-05-31')

    const byDate = new Map(occurrences.map((o) => [o.date, o]))
    expect(byDate.get('2026-01-01')?.amountCents).toBe(150_000)
    expect(byDate.get('2026-02-01')?.amountCents).toBe(150_000)
    expect(byDate.get('2026-03-01')?.amountCents).toBe(165_000)
    expect(byDate.get('2026-04-01')?.amountCents).toBe(165_000)
  })

  it('produces no gap or overlap across the split', () => {
    const result = applyEdit(rent, '2026-03-01', 'future', edit, 'new-id')
    const dates = expandAll(result, '2026-01-01', '2026-05-31').map((o) => o.date)

    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01'])
  })

  it('edits in place when the split would be at the first occurrence', () => {
    // There are no earlier occurrences to preserve, so a split would leave an
    // empty segment behind.
    const result = applyEdit(rent, '2026-01-01', 'future', edit, 'new-id')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(rent.id)
    expect(result[0].amountCents).toBe(165_000)
  })

  it('carries a series end onto the new segment', () => {
    const bounded: Transaction = { ...rent, end: '2026-06-01' }
    const result = applyEdit(bounded, '2026-03-01', 'future', edit, 'new-id')

    expect(result[1].end).toBe('2026-06-01')
  })

  it('splits exceptions between the segments by date', () => {
    const withExceptions: Transaction = {
      ...rent,
      exceptions: [
        { type: 'skip', date: '2026-02-01' },
        { type: 'skip', date: '2026-04-01' },
      ],
    }
    const result = applyEdit(withExceptions, '2026-03-01', 'future', edit, 'new-id')

    expect(result[0].exceptions.map((e) => e.date)).toEqual(['2026-02-01'])
    expect(result[1].exceptions.map((e) => e.date)).toEqual(['2026-04-01'])
  })

  it('keeps a split series expanding correctly with exceptions', () => {
    const withExceptions: Transaction = {
      ...rent,
      exceptions: [{ type: 'skip', date: '2026-04-01' }],
    }
    const result = applyEdit(withExceptions, '2026-03-01', 'future', edit, 'new-id')
    const dates = expandAll(result, '2026-01-01', '2026-05-31').map((o) => o.date)

    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01', '2026-05-01'])
  })

  it('applies a rule change from a point forward', () => {
    const toFifteenth = {
      ...edit,
      rule: { type: 'monthly' as const, interval: 1, dayOfMonth: 15 },
    }
    const result = applyEdit(rent, '2026-03-01', 'future', toFifteenth, 'new-id')
    const dates = expandAll(result, '2026-01-01', '2026-05-31').map((o) => o.date)

    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-15', '2026-04-15', '2026-05-15'])
  })
})

describe('applyMove', () => {
  it('moves one occurrence and marks it moved', () => {
    const updated = applyMove(rent, '2026-03-01', '2026-03-05')
    const occurrences = expandTransaction(updated, '2026-03-01', '2026-03-31')

    expect(occurrences[0].date).toBe('2026-03-05')
    expect(occurrences[0].scheduledDate).toBe('2026-03-01')
    expect(occurrences[0].displacement).toBe('moved')
  })

  it('does not business-day shift a moved occurrence', () => {
    // 2026-03-07 is a Saturday; the deliberate move wins over the rule.
    const shifting: Transaction = { ...rent, businessDayShift: 'previous' }
    const updated = applyMove(shifting, '2026-03-01', '2026-03-07')
    const occurrences = expandTransaction(updated, '2026-03-01', '2026-03-31')

    expect(occurrences[0].date).toBe('2026-03-07')
  })

  it('leaves other occurrences alone', () => {
    const updated = applyMove(rent, '2026-03-01', '2026-03-05')
    const dates = expandTransaction(updated, '2026-01-01', '2026-04-30').map((o) => o.date)

    expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-05', '2026-04-01'])
  })
})
