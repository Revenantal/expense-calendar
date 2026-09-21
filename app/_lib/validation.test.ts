import { describe, expect, it } from 'vitest'

import { validateStoredData, validateTransaction } from './validation'
import type { Transaction } from './types'

const valid: Transaction = {
  id: 'txn-1',
  seriesId: 'series-1',
  kind: 'expense',
  label: 'Rent',
  amountCents: 150_000,
  rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
  start: '2026-01-01',
  businessDayShift: 'none',
  exceptions: [],
}

/** Builds a transaction with one field replaced or removed. */
function withField(field: string, value: unknown): unknown {
  const copy: Record<string, unknown> = { ...valid }
  if (value === undefined) delete copy[field]
  else copy[field] = value
  return copy
}

describe('validateTransaction', () => {
  it('accepts a minimal valid transaction', () => {
    const result = validateTransaction(valid)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data).toEqual(valid)
  })

  it('rejects non-objects', () => {
    expect(validateTransaction(null).ok).toBe(false)
    expect(validateTransaction('txn').ok).toBe(false)
    expect(validateTransaction([]).ok).toBe(false)
  })

  it.each([
    'id',
    'seriesId',
    'label',
    'kind',
    'amountCents',
    'start',
    'businessDayShift',
    'rule',
    'exceptions',
  ])('rejects a transaction missing %s', (field) => {
    expect(validateTransaction(withField(field, undefined)).ok).toBe(false)
  })

  it('rejects an unknown kind', () => {
    expect(validateTransaction(withField('kind', 'refund')).ok).toBe(false)
  })

  it('rejects an unknown shift direction', () => {
    expect(validateTransaction(withField('businessDayShift', 'sideways')).ok).toBe(false)
  })

  it('rejects a negative or fractional amount', () => {
    expect(validateTransaction(withField('amountCents', -1)).ok).toBe(false)
    expect(validateTransaction(withField('amountCents', 10.5)).ok).toBe(false)
  })

  it('accepts a zero amount', () => {
    expect(validateTransaction(withField('amountCents', 0)).ok).toBe(true)
  })

  it('rejects dates that do not exist', () => {
    expect(validateTransaction(withField('start', '2026-02-30')).ok).toBe(false)
    expect(validateTransaction(withField('start', '15/03/2026')).ok).toBe(false)
  })

  it('rejects an end before the start', () => {
    const result = validateTransaction({ ...valid, start: '2026-06-01', end: '2026-01-01' })
    expect(result.ok).toBe(false)
  })

  it('accepts an end equal to the start', () => {
    expect(validateTransaction({ ...valid, start: '2026-06-01', end: '2026-06-01' }).ok).toBe(true)
  })
})

describe('rule validation', () => {
  function withRule(rule: unknown) {
    return validateTransaction({ ...valid, rule })
  }

  it('accepts every valid rule type', () => {
    expect(withRule({ type: 'once' }).ok).toBe(true)
    expect(withRule({ type: 'daily', interval: 1 }).ok).toBe(true)
    expect(withRule({ type: 'weekly', interval: 2, weekday: 5 }).ok).toBe(true)
    expect(withRule({ type: 'monthly', interval: 3, dayOfMonth: 'last' }).ok).toBe(true)
    expect(withRule({ type: 'semiMonthly', days: [1, 15] }).ok).toBe(true)
    expect(withRule({ type: 'yearly', month: 6, day: 20 }).ok).toBe(true)
  })

  it('rejects an unknown type', () => {
    expect(withRule({ type: 'fortnightly', interval: 2 }).ok).toBe(false)
  })

  it('rejects a rule missing its required fields', () => {
    expect(withRule({ type: 'daily' }).ok).toBe(false)
    expect(withRule({ type: 'weekly', interval: 1 }).ok).toBe(false)
    expect(withRule({ type: 'monthly', interval: 1 }).ok).toBe(false)
  })

  it('rejects a non-positive interval', () => {
    expect(withRule({ type: 'daily', interval: 0 }).ok).toBe(false)
    expect(withRule({ type: 'daily', interval: -1 }).ok).toBe(false)
  })

  it('rejects an out-of-range weekday', () => {
    expect(withRule({ type: 'weekly', interval: 1, weekday: 7 }).ok).toBe(false)
  })

  it('rejects an out-of-range day of month', () => {
    expect(withRule({ type: 'monthly', interval: 1, dayOfMonth: 0 }).ok).toBe(false)
    expect(withRule({ type: 'monthly', interval: 1, dayOfMonth: 32 }).ok).toBe(false)
  })

  it('rejects a semi-monthly rule without exactly two days', () => {
    expect(withRule({ type: 'semiMonthly', days: [1] }).ok).toBe(false)
    expect(withRule({ type: 'semiMonthly', days: [1, 15, 28] }).ok).toBe(false)
  })

  it('rejects an out-of-range yearly month', () => {
    expect(withRule({ type: 'yearly', month: 13, day: 1 }).ok).toBe(false)
  })
})

describe('exception validation', () => {
  function withExceptions(exceptions: unknown) {
    return validateTransaction({ ...valid, exceptions })
  }

  it('accepts skip and override exceptions', () => {
    expect(withExceptions([{ type: 'skip', date: '2026-03-01' }]).ok).toBe(true)
    expect(
      withExceptions([
        { type: 'override', date: '2026-03-01', amountCents: 500, movedTo: '2026-03-03' },
      ]).ok
    ).toBe(true)
  })

  it('rejects an unknown exception type', () => {
    expect(withExceptions([{ type: 'postpone', date: '2026-03-01' }]).ok).toBe(false)
  })

  it('rejects an exception with an invalid date', () => {
    expect(withExceptions([{ type: 'skip', date: 'soon' }]).ok).toBe(false)
  })

  it('rejects an invalid movedTo date', () => {
    expect(
      withExceptions([{ type: 'override', date: '2026-03-01', movedTo: '2026-13-01' }]).ok
    ).toBe(false)
  })
})

describe('validateStoredData', () => {
  const stored = { schemaVersion: 1, currency: 'CAD', transactions: [valid] }

  it('accepts well-formed data', () => {
    const result = validateStoredData(stored)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.transactions).toEqual([valid])
  })

  it('rejects a missing or non-integer schema version', () => {
    expect(validateStoredData({ ...stored, schemaVersion: undefined }).ok).toBe(false)
    expect(validateStoredData({ ...stored, schemaVersion: 1.5 }).ok).toBe(false)
  })

  it('rejects a missing currency', () => {
    expect(validateStoredData({ ...stored, currency: '' }).ok).toBe(false)
  })

  it('rejects transactions that are not a list', () => {
    expect(validateStoredData({ ...stored, transactions: {} }).ok).toBe(false)
  })

  it('reports which transaction failed', () => {
    const result = validateStoredData({
      ...stored,
      transactions: [valid, valid, { id: 'bad' }],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Transaction 3')
  })
})
