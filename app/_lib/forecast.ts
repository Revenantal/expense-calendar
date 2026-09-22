/**
 * Cash runway: how long income covers expenses from today, looking forward.
 *
 * The app has no concept of an actual account balance, so the simulation
 * seeds a starting balance from the current pay period: income already
 * received minus expenses already paid, from the period's start through
 * yesterday. Without that, a lone bill on the day after payday would read as
 * an instant shortfall, since the paycheck that funds it already landed in a
 * period the simulation would otherwise ignore. "Positive through" a date
 * means the running sum never dips below zero before then.
 */

import { addDays, daysBetween, type IsoDate } from './dates'
import { findPaycheck, periodContaining } from './income-periods'
import { expandAll } from './recurrence'
import type { Occurrence, Transaction } from './types'

/** Days simulated forward before giving up and calling it clear. */
const HORIZON_DAYS = 90

/** One transaction's contribution to a shortfall, for naming the driver. */
type Draw = {
  label: string
  amountCents: number
  date: IsoDate
}

export type Forecast =
  | {
      /** The running balance never dips negative inside the horizon. */
      outlook: 'clear'
      horizonEnd: IsoDate
      horizonDays: number
    }
  | {
      /** The running balance goes negative before the horizon ends. */
      outlook: 'shortfall'
      /** Last day the balance is still non-negative. */
      lastPositiveDay: IsoDate
      /** Days from today through lastPositiveDay, inclusive of today. */
      daysAhead: number
      /** The largest single expense between today and the shortfall. */
      largestDraw: Draw
    }

/**
 * Simulates a running balance forward from today and reports when, if ever,
 * it goes negative within the horizon.
 *
 * @param occurrences - Occurrences covering at least today through the
 *   horizon. Those outside today..horizon are ignored, so a wider expansion
 *   can be passed in.
 * @param today - Day the simulation starts from.
 * @param transactions - All transactions, used to seed the starting balance
 *   from the current pay period. Pass an empty array to start from zero
 *   instead, such as when no paycheck is set.
 * @returns Either a clear outlook through the horizon, or the day the balance
 *   turns negative and the largest expense driving it.
 */
export function buildForecast(
  occurrences: Occurrence[],
  today: IsoDate,
  transactions: Transaction[] = []
): Forecast {
  const horizonEnd = addDays(today, HORIZON_DAYS)

  const inWindow = occurrences.filter(
    (occurrence) => occurrence.date >= today && occurrence.date <= horizonEnd
  )

  let balance = periodToDateBalance(transactions, today)
  let lastPositiveDay = addDays(today, -1)

  for (let date = today; date <= horizonEnd; date = addDays(date, 1)) {
    const onDay = inWindow.filter((occurrence) => occurrence.date === date)
    for (const occurrence of onDay) {
      balance += occurrence.kind === 'income' ? occurrence.amountCents : -occurrence.amountCents
    }

    if (balance < 0) {
      const draws = inWindow.filter(
        (occurrence) =>
          occurrence.kind === 'expense' && occurrence.date >= today && occurrence.date <= date
      )
      const largest = draws.reduce((biggest, current) =>
        current.amountCents > biggest.amountCents ? current : biggest
      )

      return {
        outlook: 'shortfall',
        lastPositiveDay,
        daysAhead: daysBetween(today, lastPositiveDay) + 1,
        largestDraw: { label: largest.label, amountCents: largest.amountCents, date: largest.date },
      }
    }

    lastPositiveDay = date
  }

  return { outlook: 'clear', horizonEnd, horizonDays: HORIZON_DAYS }
}

/**
 * Nets income against expenses already settled in the current pay period,
 * from its start through yesterday — the money the simulation would
 * otherwise ignore because it falls before today.
 *
 * Returns zero when no paycheck is set or today falls outside any period,
 * since there is then no period to measure from.
 */
function periodToDateBalance(transactions: Transaction[], today: IsoDate): number {
  const paycheck = findPaycheck(transactions)
  if (!paycheck) return 0

  const period = periodContaining(paycheck, today)
  if (!period) return 0

  const settledThrough = addDays(today, -1)
  if (settledThrough < period.start) return 0

  const settled = expandAll(transactions, period.start, settledThrough)
  return settled.reduce(
    (total, occurrence) =>
      total + (occurrence.kind === 'income' ? occurrence.amountCents : -occurrence.amountCents),
    0
  )
}
