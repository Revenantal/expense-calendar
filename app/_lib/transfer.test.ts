import { describe, expect, it } from 'vitest'

import { EXPORT_FORMAT, exportFilename, exportToJson, importFromJson } from './transfer'
import { SCHEMA_VERSION } from './storage'
import type { Transaction } from './types'

const transaction: Transaction = {
  id: 'txn-1',
  seriesId: 'series-1',
  kind: 'expense',
  label: 'Rent',
  amountCents: 150_000,
  rule: { type: 'monthly', interval: 1, dayOfMonth: 'last' },
  start: '2026-01-01',
  businessDayShift: 'previous',
  exceptions: [{ type: 'skip', date: '2026-03-31' }],
}

/** Builds a valid export file with fields optionally replaced. */
function makeFile(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: EXPORT_FORMAT,
    exportedAt: '2026-03-15T12:00:00.000Z',
    schemaVersion: SCHEMA_VERSION,
    currency: 'CAD',
    transactions: [transaction],
    ...overrides,
  })
}

describe('exportToJson', () => {
  it('writes a file that identifies itself', () => {
    const parsed = JSON.parse(exportToJson([transaction]))

    expect(parsed.format).toBe(EXPORT_FORMAT)
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION)
    expect(parsed.currency).toBe('CAD')
    expect(parsed.transactions).toEqual([transaction])
  })

  it('records when it was exported', () => {
    const at = new Date('2026-03-15T12:00:00.000Z')
    expect(JSON.parse(exportToJson([], at)).exportedAt).toBe('2026-03-15T12:00:00.000Z')
  })

  it('is pretty-printed', () => {
    expect(exportToJson([transaction])).toContain('\n  ')
  })
})

describe('exportFilename', () => {
  it('names the file after the export date', () => {
    expect(exportFilename(new Date('2026-03-15T12:00:00.000Z'))).toBe(
      'expense-calendar-2026-03-15.json'
    )
  })
})

describe('importFromJson', () => {
  it('round trips an exported file', () => {
    const result = importFromJson(exportToJson([transaction]))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.transactions).toEqual([transaction])
  })

  it('rejects text that is not JSON', () => {
    const result = importFromJson('not json at all')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('not valid JSON')
  })

  it('rejects a truncated file', () => {
    const truncated = exportToJson([transaction]).slice(0, 80)
    expect(importFromJson(truncated).ok).toBe(false)
  })

  it('rejects valid JSON that is not ours', () => {
    const result = importFromJson(JSON.stringify({ some: 'other tool' }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('not exported from')
  })

  it('rejects a JSON array', () => {
    expect(importFromJson('[]').ok).toBe(false)
  })

  it('rejects a valid envelope holding malformed transactions', () => {
    // The case a format check alone would let through.
    const result = importFromJson(makeFile({ transactions: [{ id: 'only-an-id' }] }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('damaged')
  })

  it('names which transaction is at fault', () => {
    const result = importFromJson(makeFile({ transactions: [transaction, { id: 'bad' }] }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Transaction 2')
  })

  it('rejects an unknown rule type', () => {
    const result = importFromJson(
      makeFile({
        transactions: [{ ...transaction, rule: { type: 'fortnightly' } }],
      })
    )

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('unknown rule type')
  })

  it('rejects a negative amount', () => {
    const result = importFromJson(
      makeFile({ transactions: [{ ...transaction, amountCents: -100 }] })
    )

    expect(result.ok).toBe(false)
  })

  it('rejects a non-integer amount', () => {
    const result = importFromJson(
      makeFile({ transactions: [{ ...transaction, amountCents: 12.5 }] })
    )

    expect(result.ok).toBe(false)
  })

  it('rejects an invalid date', () => {
    const result = importFromJson(
      makeFile({ transactions: [{ ...transaction, start: '2026-02-30' }] })
    )

    expect(result.ok).toBe(false)
  })

  it('rejects an end before the start', () => {
    const result = importFromJson(
      makeFile({
        transactions: [{ ...transaction, start: '2026-06-01', end: '2026-01-01' }],
      })
    )

    expect(result.ok).toBe(false)
  })

  it('rejects a file from a newer app version', () => {
    const result = importFromJson(makeFile({ schemaVersion: SCHEMA_VERSION + 1 }))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('newer version')
  })

  it('accepts an empty transaction list', () => {
    const result = importFromJson(makeFile({ transactions: [] }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.transactions).toEqual([])
  })
})
