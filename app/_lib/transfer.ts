/**
 * Export and import of app data as JSON.
 *
 * Browser storage is the only copy and is cleared by ordinary things — cleanup
 * tools, privacy settings, some extensions. Export is the only recovery path,
 * and doubles as the way to move data between devices.
 */

import { SCHEMA_VERSION } from './storage'
import { validateStoredData } from './validation'
import type { Goal, StoredData, Transaction } from './types'
import { CURRENCY } from './money'

/** Marks a file as ours, so an unrelated JSON file is rejected early. */
export const EXPORT_FORMAT = 'expense-calendar-export'

/** Shape written to an export file. */
export type ExportFile = StoredData & {
  format: typeof EXPORT_FORMAT
  exportedAt: string
}

/** Result of reading an import file. */
export type ImportResult = { ok: true; data: StoredData } | { ok: false; error: string }

/**
 * Builds the JSON text for an export file.
 *
 * @param transactions - Transactions to export.
 * @param goals - Goals to export.
 * @param exportedAt - Timestamp to record. Defaults to now.
 * @returns Pretty-printed JSON, readable if it is ever opened by hand.
 */
export function exportToJson(
  transactions: Transaction[],
  goals: Goal[],
  exportedAt: Date = new Date()
): string {
  const file: ExportFile = {
    format: EXPORT_FORMAT,
    exportedAt: exportedAt.toISOString(),
    schemaVersion: SCHEMA_VERSION,
    transactions,
    goals,
    currency: CURRENCY,
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Suggests a filename for an export.
 *
 * @param exportedAt - Timestamp to name it after. Defaults to now.
 * @returns A dated filename.
 */
export function exportFilename(exportedAt: Date = new Date()): string {
  const iso = exportedAt.toISOString().slice(0, 10)
  return `expense-calendar-${iso}.json`
}

/**
 * Reads and fully validates an import file.
 *
 * Every transaction is checked, not just the envelope, because import replaces
 * all existing data. Any problem rejects the whole file.
 *
 * @param text - Raw file contents.
 * @returns The data when the file is usable, or the problem found.
 */
export function importFromJson(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'This file does not contain expense calendar data.' }
  }

  const format = (parsed as Record<string, unknown>).format
  if (format !== EXPORT_FORMAT) {
    return {
      ok: false,
      error: 'This file was not exported from the expense calendar.',
    }
  }

  const result = validateStoredData(parsed)
  if (!result.ok) {
    return { ok: false, error: `This file is damaged. ${result.error}` }
  }

  if (result.data.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'This file was saved by a newer version of the app.',
    }
  }

  return { ok: true, data: result.data }
}
