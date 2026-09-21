/**
 * Income periods: the spans between paychecks.
 *
 * A period runs from a payday through the day before the next payday. Payday
 * is the first day of its period, so the paycheck that opens a period counts
 * as income within it — the period's total income is the money funding that
 * stretch of days.
 *
 * Periods derive from the transaction marked as the paycheck, so the schedule
 * lives in one place and cannot drift out of step with the income it
 * describes.
 */

import { addDays, type IsoDate } from './dates'
import { expandTransaction } from './recurrence'
import type { Occurrence, Transaction } from './types'

/** One span between paychecks. */
export type IncomePeriod = {
  /** Payday. The period's first day. */
  start: IsoDate
  /** Day before the next payday. */
  end: IsoDate
}

/** Which of the three footer figures the third slot is showing. */
export type ThirdFigureKind = 'remaining' | 'fullPeriod'

/** Totals for one period, in cents. */
export type PeriodTotals = {
  income: number
  expenses: number
  /**
   * Expenses still to come on the current period, or the full-period expense
   * total on any other. `kind` says which, so the panel can label it without
   * re-deriving whether the period is current.
   */
  thirdFigure: number
  kind: ThirdFigureKind
}

/**
 * Finds the transaction periods derive from.
 *
 * @param transactions - All transactions.
 * @returns The paycheck transaction, or undefined when none is marked.
 */
export function findPaycheck(transactions: Transaction[]): Transaction | undefined {
  return transactions.find((transaction) => transaction.isPaycheck === true)
}

/**
 * Builds the income periods overlapping a date range.
 *
 * Boundaries follow the date a paycheck actually lands on, including any
 * business-day shift. Periods track when money arrives, not when it was
 * nominally scheduled — a boundary fixed to the scheduled date would put a
 * paycheck in the period before the one it starts.
 *
 * Because a shift can move a boundary, period lengths vary slightly. That is
 * correct, and it means the summary chart's bar count is not fixed.
 *
 * @param paycheck - Transaction marked as the paycheck.
 * @param rangeStart - First date of interest.
 * @param rangeEnd - Last date of interest.
 * @returns Periods in date order, covering the range.
 */
export function buildPeriods(
  paycheck: Transaction,
  rangeStart: IsoDate,
  rangeEnd: IsoDate
): IncomePeriod[] {
  // Widen the search so the period containing rangeStart is found even when
  // its payday falls well before the range.
  const searchStart = addDays(rangeStart, -70)
  const searchEnd = addDays(rangeEnd, 70)

  const paydays = expandTransaction(paycheck, searchStart, searchEnd)
    .map((occurrence) => occurrence.date)
    .sort()

  const periods: IncomePeriod[] = []
  for (const [index, start] of paydays.entries()) {
    const nextPayday = paydays[index + 1]
    // The final payday has no known successor, so its period is left open
    // until the search window ends.
    const end = nextPayday ? addDays(nextPayday, -1) : searchEnd
    if (end >= rangeStart && start <= rangeEnd) periods.push({ start, end })
  }

  return periods
}

/**
 * Finds the period containing a date.
 *
 * @param paycheck - Transaction marked as the paycheck.
 * @param date - Date to locate.
 * @returns The period holding the date, or undefined when none does.
 */
export function periodContaining(paycheck: Transaction, date: IsoDate): IncomePeriod | undefined {
  return buildPeriods(paycheck, date, date).find(
    (period) => date >= period.start && date <= period.end
  )
}

/**
 * Returns whether a period contains today.
 *
 * @param period - Period to test.
 * @param today - Today's date.
 * @returns True when today falls inside the period.
 */
export function isCurrentPeriod(period: IncomePeriod, today: IsoDate): boolean {
  return today >= period.start && today <= period.end
}

/**
 * Totals the occurrences falling inside a period.
 *
 * The third figure is remaining expenses on the current period and the full
 * expense total on any other, since "remaining" has no meaning on a period
 * that has closed or not yet begun.
 *
 * A bill due today counts as still owing. The calendar has no concept of a
 * payment having cleared, so excluding it would understate what is left.
 *
 * @param occurrences - Occurrences to total. Those outside the period are
 *   ignored, so a whole month's expansion can be passed in.
 * @param period - Period to total over.
 * @param today - Today's date, used to decide the third figure.
 * @returns Totals in cents.
 */
export function totalsForPeriod(
  occurrences: Occurrence[],
  period: IncomePeriod,
  today: IsoDate
): PeriodTotals {
  const inPeriod = occurrences.filter(
    (occurrence) => occurrence.date >= period.start && occurrence.date <= period.end
  )

  const income = sumOf(inPeriod.filter((o) => o.kind === 'income'))
  const expenseOccurrences = inPeriod.filter((o) => o.kind === 'expense')
  const expenses = sumOf(expenseOccurrences)

  const current = isCurrentPeriod(period, today)
  const thirdFigure = current ? sumOf(expenseOccurrences.filter((o) => o.date >= today)) : expenses

  return {
    income,
    expenses,
    thirdFigure,
    kind: current ? 'remaining' : 'fullPeriod',
  }
}

/**
 * Sums the net amount for each day in a period.
 *
 * Every day in the span gets an entry, including days with no activity, so the
 * chart's spacing reflects real elapsed time rather than only the days that
 * happen to have transactions.
 *
 * @param occurrences - Occurrences to draw from.
 * @param period - Period to cover.
 * @returns One entry per day, in date order.
 */
export function dailyTotals(
  occurrences: Occurrence[],
  period: IncomePeriod
): { date: IsoDate; income: number; expenses: number }[] {
  const days: { date: IsoDate; income: number; expenses: number }[] = []

  for (let date = period.start; date <= period.end; date = addDays(date, 1)) {
    const onDay = occurrences.filter((occurrence) => occurrence.date === date)
    days.push({
      date,
      income: sumOf(onDay.filter((o) => o.kind === 'income')),
      expenses: sumOf(onDay.filter((o) => o.kind === 'expense')),
    })
  }

  return days
}

/** Sums occurrence amounts in cents. */
function sumOf(occurrences: Occurrence[]): number {
  return occurrences.reduce((total, occurrence) => total + occurrence.amountCents, 0)
}
