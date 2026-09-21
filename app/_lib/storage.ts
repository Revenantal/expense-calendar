/**
 * Reads and writes app data to browser storage.
 *
 * This is the only copy of the data. There is no server to fall back on, so
 * reads tolerate anything they find rather than throwing, and writes report
 * failure instead of swallowing it.
 */

import { CURRENCY } from './money'
import { validateStoredData } from './validation'
import type { StoredData, Transaction } from './types'

/** Key the data lives under. */
export const STORAGE_KEY = 'expense-calendar:data'

/**
 * Version of the stored shape.
 *
 * Written from the first release so an older file can always be recognised.
 * Retrofitting a version onto unversioned data means guessing at its shape.
 */
export const SCHEMA_VERSION = 1

/** Outcome of a write. */
export type WriteResult = { ok: true } | { ok: false; reason: string }

/** Data used when storage is empty or unreadable. */
export function emptyData(): StoredData {
  return { schemaVersion: SCHEMA_VERSION, transactions: [], currency: CURRENCY }
}

/**
 * Loads stored data.
 *
 * Returns empty data rather than throwing when storage is unavailable, empty,
 * corrupt, or holds a version this build does not understand. A planning tool
 * that refuses to start because of a bad key is worse than one that starts
 * blank.
 *
 * @param storage - Storage to read from. Defaults to `localStorage`.
 * @returns The stored data, or empty data when it cannot be used.
 */
export function loadData(storage?: Storage): StoredData {
  const store = storage ?? safeLocalStorage()
  if (!store) return emptyData()

  let raw: string | null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    // Reading can throw when storage is blocked entirely.
    return emptyData()
  }

  if (!raw) return emptyData()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptyData()
  }

  const result = validateStoredData(parsed)
  if (!result.ok) return emptyData()

  // A newer file may hold fields this build cannot interpret. Starting blank
  // is safer than rendering a half-understood schedule.
  if (result.data.schemaVersion > SCHEMA_VERSION) return emptyData()

  return result.data
}

/**
 * Writes transactions to storage.
 *
 * @param transactions - Transactions to persist.
 * @param storage - Storage to write to. Defaults to `localStorage`.
 * @returns Whether the write succeeded, with a reason when it did not.
 */
export function saveTransactions(transactions: Transaction[], storage?: Storage): WriteResult {
  return writeData({ schemaVersion: SCHEMA_VERSION, transactions, currency: CURRENCY }, storage)
}

/**
 * Writes a full data object to storage.
 *
 * Failure is returned rather than thrown. `setItem` throws when the quota is
 * exhausted, and in Safari private mode it can throw regardless of size — a
 * swallowed failure would leave the app showing data that was never saved.
 *
 * @param data - Data to persist.
 * @param storage - Storage to write to. Defaults to `localStorage`.
 * @returns Whether the write succeeded, with a reason when it did not.
 */
export function writeData(data: StoredData, storage?: Storage): WriteResult {
  const store = storage ?? safeLocalStorage()
  if (!store) {
    return { ok: false, reason: 'Browser storage is not available.' }
  }

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data))
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: describeWriteError(error) }
  }
}

/**
 * Removes all stored data.
 *
 * @param storage - Storage to clear. Defaults to `localStorage`.
 * @returns Whether the removal succeeded.
 */
export function clearData(storage?: Storage): WriteResult {
  const store = storage ?? safeLocalStorage()
  if (!store) {
    return { ok: false, reason: 'Browser storage is not available.' }
  }

  try {
    store.removeItem(STORAGE_KEY)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: describeWriteError(error) }
  }
}

/** Returns localStorage, or undefined when it cannot be reached. */
function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    // Accessing the property itself throws when storage is blocked.
    return undefined
  }
}

/** Turns a thrown write error into a message worth showing. */
function describeWriteError(error: unknown): string {
  const isQuota =
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')

  return isQuota
    ? 'Browser storage is full. Export your data, then clear space.'
    : 'Could not save to browser storage. Your latest change is not stored.'
}
