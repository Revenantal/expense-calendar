/**
 * Expands recurrence rules into dated occurrences.
 *
 * Transactions store the rule for when they happen, not a list of dates, so
 * changing a rule changes every future occurrence with nothing to migrate.
 *
 * The pipeline order matters and is fixed:
 *
 * 1. Generate raw dates from the rule, bounded by start, end, and the range.
 * 2. Resolve `'last'` day-of-month to the month's final day.
 * 3. Clamp impossible days back into the month.
 * 4. Drop skipped occurrences.
 * 5. Apply override values.
 * 6. Shift off non-business days, unless the override moved it.
 */

import { shiftToBusinessDay } from './business-days'
import {
  addDays,
  addMonths,
  clampToMonth,
  daysInMonth,
  toParts,
  weekdayOf,
  type IsoDate,
} from './dates'
import type {
  DayOfMonth,
  Occurrence,
  OccurrenceException,
  RecurrenceRule,
  Transaction,
} from './types'

/** Stops runaway generation if a rule ever yields no forward progress. */
const MAX_OCCURRENCES = 10_000

/**
 * Days of slack added either side of a query range while generating.
 *
 * An occurrence scheduled just outside the range can land inside it after
 * shifting, and one scheduled inside can land outside. Generating over a wider
 * window and filtering on the final date catches both. Shifting never moves a
 * date further than a long holiday weekend, so a fortnight is ample.
 */
const RANGE_SLACK_DAYS = 14

/**
 * Resolves a day-of-month against a specific month.
 *
 * @param day - A number, or `'last'` for the month end.
 * @param year - Four-digit year.
 * @param month - Month, 1-12.
 * @returns A day number that exists in that month.
 */
export function resolveDayOfMonth(day: DayOfMonth, year: number, month: number): number {
  const lastDay = daysInMonth(year, month)
  return day === 'last' ? lastDay : Math.min(day, lastDay)
}

/**
 * Expands one transaction into its occurrences within a date range.
 *
 * @param transaction - Transaction to expand.
 * @param rangeStart - First date of interest.
 * @param rangeEnd - Last date of interest.
 * @returns Occurrences in date order. May contain two on the same date when
 *   shifting collides them; both are real payments and both are kept.
 */
export function expandTransaction(
  transaction: Transaction,
  rangeStart: IsoDate,
  rangeEnd: IsoDate
): Occurrence[] {
  // Generate wide, filter narrow: a shift can carry an occurrence across
  // either range boundary in either direction.
  const scheduled = generateScheduledDates(
    transaction,
    addDays(rangeStart, -RANGE_SLACK_DAYS),
    addDays(rangeEnd, RANGE_SLACK_DAYS)
  )
  const occurrences: Occurrence[] = []

  for (const scheduledDate of scheduled) {
    const exception = findException(transaction.exceptions, scheduledDate)
    if (exception?.type === 'skip') continue

    const override = exception?.type === 'override' ? exception : undefined

    // A manual move is a deliberate choice about this one occurrence, so an
    // automatic business-day rule does not get to override it.
    const date = override?.movedTo
      ? override.movedTo
      : shiftToBusinessDay(scheduledDate, transaction.businessDayShift)

    occurrences.push({
      transactionId: transaction.id,
      seriesId: transaction.seriesId,
      date,
      scheduledDate,
      ...(date !== scheduledDate && {
        displacement: override?.movedTo ? ('moved' as const) : ('shifted' as const),
      }),
      kind: transaction.kind,
      label: override?.label ?? transaction.label,
      amountCents: override?.amountCents ?? transaction.amountCents,
      isPaycheck: transaction.isPaycheck === true,
      ...(transaction.goalId && { goalId: transaction.goalId }),
    })
  }

  return occurrences
    .filter((occurrence) => occurrence.date >= rangeStart && occurrence.date <= rangeEnd)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * Expands several transactions into one date-ordered list.
 *
 * @param transactions - Transactions to expand.
 * @param rangeStart - First date of interest.
 * @param rangeEnd - Last date of interest.
 * @returns All occurrences in date order.
 */
export function expandAll(
  transactions: Transaction[],
  rangeStart: IsoDate,
  rangeEnd: IsoDate
): Occurrence[] {
  return transactions
    .flatMap((transaction) => expandTransaction(transaction, rangeStart, rangeEnd))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * Produces the dates a rule schedules, before exceptions or shifting.
 *
 * Generation is bounded by the transaction's own span and by the requested
 * range, so an open-ended rule terminates.
 */
function generateScheduledDates(
  transaction: Transaction,
  searchStart: IsoDate,
  searchWindowEnd: IsoDate
): IsoDate[] {
  const { rule, start, end } = transaction

  // The transaction's own end always wins over the search window.
  const searchEnd = end && end < searchWindowEnd ? end : searchWindowEnd

  if (rule.type === 'once') {
    return start >= searchStart && start <= searchEnd ? [start] : []
  }

  const dates: IsoDate[] = []
  let cursor = firstCandidate(rule, start)
  let guard = 0

  while (cursor <= searchEnd && guard < MAX_OCCURRENCES) {
    guard += 1
    if (cursor >= start && cursor >= searchStart) dates.push(cursor)

    const next = advance(rule, cursor, start)
    // Defensive: a rule that fails to move forward would loop forever.
    if (next <= cursor) break
    cursor = next
  }

  return dates
}

/** Finds the first date at or after `start` that the rule would produce. */
function firstCandidate(rule: RecurrenceRule, start: IsoDate): IsoDate {
  switch (rule.type) {
    case 'weekly': {
      const offset = (rule.weekday - weekdayOf(start) + 7) % 7
      return addDays(start, offset)
    }
    case 'monthly': {
      const { year, month } = toParts(start)
      const candidate = clampToMonth(year, month, resolveDayOfMonth(rule.dayOfMonth, year, month))
      return candidate >= start ? candidate : monthlyFrom(rule, start, 1)
    }
    case 'semiMonthly': {
      const { year, month } = toParts(start)
      const [first, second] = orderedSemiMonthlyDays(rule.days, year, month)
      if (first >= start) return first
      if (second >= start) return second
      return semiMonthlyFrom(rule, start, 1)[0]
    }
    case 'yearly': {
      const { year } = toParts(start)
      const candidate = clampToMonth(year, rule.month, rule.day)
      return candidate >= start ? candidate : clampToMonth(year + 1, rule.month, rule.day)
    }
    default:
      return start
  }
}

/** Returns the next date after `cursor` that the rule produces. */
function advance(rule: RecurrenceRule, cursor: IsoDate, start: IsoDate): IsoDate {
  switch (rule.type) {
    case 'daily':
      return addDays(cursor, rule.interval)
    case 'weekly':
      return addDays(cursor, 7 * rule.interval)
    case 'monthly':
      return monthlyFrom(rule, cursor, rule.interval)
    case 'semiMonthly': {
      const { year, month } = toParts(cursor)
      const [first, second] = orderedSemiMonthlyDays(rule.days, year, month)
      if (cursor < first) return first
      if (cursor < second) return second
      return semiMonthlyFrom(rule, cursor, 1)[0]
    }
    case 'yearly': {
      const { year } = toParts(cursor)
      return clampToMonth(year + 1, rule.month, rule.day)
    }
    default:
      // A `once` rule never advances; generation stops after the first date.
      return start
  }
}

/** Steps a monthly rule forward by whole months, resolving the target day. */
function monthlyFrom(
  rule: Extract<RecurrenceRule, { type: 'monthly' }>,
  from: IsoDate,
  months: number
): IsoDate {
  const moved = addMonths(`${from.slice(0, 8)}01`, months)
  const { year, month } = toParts(moved)
  return clampToMonth(year, month, resolveDayOfMonth(rule.dayOfMonth, year, month))
}

/** Returns a semi-monthly rule's two dates for the month `from` falls in. */
function semiMonthlyFrom(
  rule: Extract<RecurrenceRule, { type: 'semiMonthly' }>,
  from: IsoDate,
  months: number
): [IsoDate, IsoDate] {
  const moved = addMonths(`${from.slice(0, 8)}01`, months)
  const { year, month } = toParts(moved)
  return orderedSemiMonthlyDays(rule.days, year, month)
}

/** Resolves a semi-monthly pair into dates, earliest first. */
function orderedSemiMonthlyDays(
  days: [DayOfMonth, DayOfMonth],
  year: number,
  month: number
): [IsoDate, IsoDate] {
  const resolved = days
    .map((day) => clampToMonth(year, month, resolveDayOfMonth(day, year, month)))
    .sort() as [IsoDate, IsoDate]
  return resolved
}

/** Finds the exception keyed to a scheduled date, if any. */
function findException(
  exceptions: OccurrenceException[],
  scheduledDate: IsoDate
): OccurrenceException | undefined {
  return exceptions.find((exception) => exception.date === scheduledDate)
}
