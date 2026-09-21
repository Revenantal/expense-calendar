/**
 * Validates untrusted data against the app's shapes.
 *
 * Used for both stored data and imported files. Import replaces everything, so
 * accepting a bad file destroys the only copy — a file can carry a correct
 * schema version and still hold garbage, which is why every transaction is
 * checked rather than just the envelope.
 *
 * Validation is strict and all-or-nothing. A partial accept would leave the
 * app in a state neither the file nor the previous data describes.
 */

import { isIsoDate } from './dates'
import type {
  DayOfMonth,
  OccurrenceException,
  RecurrenceRule,
  StoredData,
  Transaction,
} from './types'

/** Result of validating untrusted input. */
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string }

const SHIFT_DIRECTIONS = new Set(['none', 'previous', 'next'])
const KINDS = new Set(['income', 'expense'])

/**
 * Validates a parsed JSON value as stored app data.
 *
 * @param value - Parsed JSON of unknown shape.
 * @returns The data when valid, or the first problem found.
 */
export function validateStoredData(value: unknown): ValidationResult<StoredData> {
  if (!isRecord(value)) return fail('Data is not an object.')

  if (typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion)) {
    return fail('Missing or invalid schemaVersion.')
  }
  if (typeof value.currency !== 'string' || value.currency.length === 0) {
    return fail('Missing or invalid currency.')
  }
  if (!Array.isArray(value.transactions)) {
    return fail('Missing or invalid transactions list.')
  }

  const transactions: Transaction[] = []
  for (const [index, entry] of value.transactions.entries()) {
    const result = validateTransaction(entry)
    if (!result.ok) return fail(`Transaction ${index + 1}: ${result.error}`)
    transactions.push(result.data)
  }

  return {
    ok: true,
    data: {
      schemaVersion: value.schemaVersion,
      transactions,
      currency: value.currency,
    },
  }
}

/**
 * Validates a single transaction.
 *
 * @param value - Value of unknown shape.
 * @returns The transaction when valid, or the problem found.
 */
export function validateTransaction(value: unknown): ValidationResult<Transaction> {
  if (!isRecord(value)) return fail('not an object.')

  if (!isNonEmptyString(value.id)) return fail('missing id.')
  if (!isNonEmptyString(value.seriesId)) return fail('missing seriesId.')
  if (typeof value.label !== 'string') return fail('missing label.')

  if (typeof value.kind !== 'string' || !KINDS.has(value.kind)) {
    return fail('kind must be income or expense.')
  }
  if (typeof value.businessDayShift !== 'string' || !SHIFT_DIRECTIONS.has(value.businessDayShift)) {
    return fail('businessDayShift must be none, previous, or next.')
  }

  if (
    typeof value.amountCents !== 'number' ||
    !Number.isInteger(value.amountCents) ||
    value.amountCents < 0
  ) {
    return fail('amountCents must be a whole number of cents, not negative.')
  }

  if (!isValidDate(value.start)) return fail('start is not a valid date.')
  if (value.end !== undefined && !isValidDate(value.end)) {
    return fail('end is not a valid date.')
  }
  if (typeof value.end === 'string' && value.end < value.start) {
    return fail('end is before start.')
  }

  if (value.isPaycheck !== undefined && typeof value.isPaycheck !== 'boolean') {
    return fail('isPaycheck must be true or false.')
  }

  const rule = validateRule(value.rule)
  if (!rule.ok) return fail(rule.error)

  if (!Array.isArray(value.exceptions)) return fail('missing exceptions list.')
  const exceptions: OccurrenceException[] = []
  for (const entry of value.exceptions) {
    const result = validateException(entry)
    if (!result.ok) return fail(result.error)
    exceptions.push(result.data)
  }

  return {
    ok: true,
    data: {
      id: value.id,
      seriesId: value.seriesId,
      kind: value.kind as Transaction['kind'],
      label: value.label,
      amountCents: value.amountCents,
      rule: rule.data,
      start: value.start,
      ...(typeof value.end === 'string' && { end: value.end }),
      businessDayShift: value.businessDayShift as Transaction['businessDayShift'],
      ...(typeof value.isPaycheck === 'boolean' && { isPaycheck: value.isPaycheck }),
      exceptions,
    },
  }
}

/** Validates a recurrence rule, checking the fields its type requires. */
function validateRule(value: unknown): ValidationResult<RecurrenceRule> {
  if (!isRecord(value)) return fail('rule is not an object.')

  switch (value.type) {
    case 'once':
      return { ok: true, data: { type: 'once' } }

    case 'daily':
      if (!isPositiveInteger(value.interval)) return fail('daily rule needs an interval.')
      return { ok: true, data: { type: 'daily', interval: value.interval } }

    case 'weekly':
      if (!isPositiveInteger(value.interval)) return fail('weekly rule needs an interval.')
      if (!isWeekday(value.weekday)) return fail('weekly rule needs a weekday 0-6.')
      return {
        ok: true,
        data: { type: 'weekly', interval: value.interval, weekday: value.weekday },
      }

    case 'monthly':
      if (!isPositiveInteger(value.interval)) return fail('monthly rule needs an interval.')
      if (!isDayOfMonth(value.dayOfMonth)) return fail('monthly rule needs a valid day.')
      return {
        ok: true,
        data: { type: 'monthly', interval: value.interval, dayOfMonth: value.dayOfMonth },
      }

    case 'semiMonthly': {
      if (!Array.isArray(value.days) || value.days.length !== 2) {
        return fail('semi-monthly rule needs exactly two days.')
      }
      if (!value.days.every(isDayOfMonth)) {
        return fail('semi-monthly rule has an invalid day.')
      }
      return {
        ok: true,
        data: { type: 'semiMonthly', days: value.days as [DayOfMonth, DayOfMonth] },
      }
    }

    case 'yearly':
      if (!isInRange(value.month, 1, 12)) return fail('yearly rule needs a month 1-12.')
      if (!isInRange(value.day, 1, 31)) return fail('yearly rule needs a day 1-31.')
      return { ok: true, data: { type: 'yearly', month: value.month, day: value.day } }

    default:
      return fail(`unknown rule type ${JSON.stringify(value.type)}.`)
  }
}

/** Validates an occurrence exception. */
function validateException(value: unknown): ValidationResult<OccurrenceException> {
  if (!isRecord(value)) return fail('exception is not an object.')
  if (!isValidDate(value.date)) return fail('exception has an invalid date.')

  if (value.type === 'skip') {
    return { ok: true, data: { type: 'skip', date: value.date } }
  }

  if (value.type !== 'override') {
    return fail(`unknown exception type ${JSON.stringify(value.type)}.`)
  }

  if (value.label !== undefined && typeof value.label !== 'string') {
    return fail('exception label must be a string.')
  }
  if (
    value.amountCents !== undefined &&
    (typeof value.amountCents !== 'number' ||
      !Number.isInteger(value.amountCents) ||
      value.amountCents < 0)
  ) {
    return fail('exception amountCents must be a whole number of cents.')
  }
  if (value.movedTo !== undefined && !isValidDate(value.movedTo)) {
    return fail('exception movedTo is not a valid date.')
  }

  return {
    ok: true,
    data: {
      type: 'override',
      date: value.date,
      ...(typeof value.label === 'string' && { label: value.label }),
      ...(typeof value.amountCents === 'number' && { amountCents: value.amountCents }),
      ...(typeof value.movedTo === 'string' && { movedTo: value.movedTo }),
    },
  }
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && isIsoDate(value)
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function isWeekday(value: unknown): value is 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return isInRange(value, 0, 6)
}

function isDayOfMonth(value: unknown): value is DayOfMonth {
  return value === 'last' || isInRange(value, 1, 31)
}
