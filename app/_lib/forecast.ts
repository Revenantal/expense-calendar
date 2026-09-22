/**
 * Cash runway: how long income covers expenses from today, looking forward.
 *
 * The simulation starts at a running balance of zero on today, since the app
 * has no concept of an actual account balance — it only knows relative cash
 * flow. "Positive through" a date means that running sum never dips below
 * zero before then.
 */

import { addDays, daysBetween, type IsoDate } from './dates'
import type { Occurrence } from './types'

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
 * @param today - Day the simulation starts from, at balance zero.
 * @returns Either a clear outlook through the horizon, or the day the balance
 *   turns negative and the largest expense driving it.
 */
export function buildForecast(occurrences: Occurrence[], today: IsoDate): Forecast {
  const horizonEnd = addDays(today, HORIZON_DAYS)

  const inWindow = occurrences.filter(
    (occurrence) => occurrence.date >= today && occurrence.date <= horizonEnd
  )

  let balance = 0
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
