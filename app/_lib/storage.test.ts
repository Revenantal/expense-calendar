import { beforeEach, describe, expect, it } from 'vitest'

import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  clearData,
  emptyData,
  loadData,
  saveTransactions,
  writeData,
} from './storage'
import type { StoredData, Transaction } from './types'

/** In-memory Storage stand-in, so tests never touch a real browser store. */
function makeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  }
}

/** Storage whose writes always throw, standing in for an exhausted quota. */
function makeFailingStorage(error: unknown): Storage {
  return {
    ...makeStorage(),
    setItem: () => {
      throw error
    },
    removeItem: () => {
      throw error
    },
  }
}

const transaction: Transaction = {
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

let storage: Storage

beforeEach(() => {
  storage = makeStorage()
})

describe('emptyData', () => {
  it('carries the current schema version and no transactions', () => {
    expect(emptyData()).toEqual({
      schemaVersion: SCHEMA_VERSION,
      transactions: [],
      currency: 'CAD',
    })
  })
})

describe('round trip', () => {
  it('saves and loads transactions', () => {
    expect(saveTransactions([transaction], storage)).toEqual({ ok: true })
    expect(loadData(storage).transactions).toEqual([transaction])
  })

  it('preserves optional fields', () => {
    const full: Transaction = {
      ...transaction,
      end: '2026-12-31',
      isPaycheck: true,
      businessDayShift: 'previous',
      exceptions: [
        { type: 'skip', date: '2026-03-01' },
        { type: 'override', date: '2026-04-01', amountCents: 1000, movedTo: '2026-04-03' },
      ],
    }

    saveTransactions([full], storage)
    expect(loadData(storage).transactions[0]).toEqual(full)
  })
})

describe('loadData', () => {
  it('returns empty data when nothing is stored', () => {
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('returns empty data for corrupt JSON', () => {
    storage.setItem(STORAGE_KEY, '{ not json')
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('returns empty data when the shape is wrong', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ hello: 'world' }))
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('returns empty data when a transaction is malformed', () => {
    // Valid envelope, garbage contents — the case a version check alone
    // would let through.
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        currency: 'CAD',
        transactions: [{ id: 'x' }],
      })
    )
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('returns empty data for a newer schema version', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION + 1,
        currency: 'CAD',
        transactions: [],
      })
    )
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('does not throw when storage itself is unavailable', () => {
    const blocked = {
      ...makeStorage(),
      getItem: () => {
        throw new Error('blocked')
      },
    } as Storage

    expect(loadData(blocked)).toEqual(emptyData())
  })
})

describe('writeData', () => {
  it('reports quota exhaustion with an actionable message', () => {
    const quotaError = new DOMException('full', 'QuotaExceededError')
    const failing = makeFailingStorage(quotaError)
    const data: StoredData = emptyData()

    const result = writeData(data, failing)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('full')
  })

  it('reports other write failures without claiming success', () => {
    const failing = makeFailingStorage(new Error('denied'))
    const result = writeData(emptyData(), failing)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('not stored')
  })
})

describe('clearData', () => {
  it('removes stored data', () => {
    saveTransactions([transaction], storage)
    expect(clearData(storage)).toEqual({ ok: true })
    expect(loadData(storage).transactions).toEqual([])
  })

  it('reports a failure rather than throwing', () => {
    const failing = makeFailingStorage(new Error('denied'))
    expect(clearData(failing).ok).toBe(false)
  })
})
