/**
 * Business-day checks and shifting.
 *
 * A non-business day is a weekend or a holiday that stops payments processing.
 * Holidays marked informational only — Remembrance Day and similar — are
 * ordinary business days here.
 */

import { addDays, weekdayOf, type IsoDate } from './dates'
import { isPaymentHoliday } from './holidays'

/** Which way an occurrence moves when it lands on a non-business day. */
export type ShiftDirection = 'none' | 'previous' | 'next'

/** How many days to walk before giving up. Guards against an infinite loop. */
const MAX_SHIFT_DAYS = 14

/**
 * Returns whether a date falls on a weekend.
 *
 * @param date - Date to check.
 * @returns True for Saturday or Sunday.
 */
export function isWeekend(date: IsoDate): boolean {
  const weekday = weekdayOf(date)
  return weekday === 0 || weekday === 6
}

/**
 * Returns whether banks process payments on a date.
 *
 * @param date - Date to check.
 * @returns True when the date is a working day.
 */
export function isBusinessDay(date: IsoDate): boolean {
  return !isWeekend(date) && !isPaymentHoliday(date)
}

/**
 * Moves a date to a business day in the given direction.
 *
 * Walks over consecutive non-business days, so a payment on Christmas shifting
 * backward passes Boxing Day and the weekend to reach a working day. A shift
 * may cross a month or year boundary; the occurrence belongs to where it
 * lands.
 *
 * @param date - Date to shift.
 * @param direction - Which way to move, or `none` to leave the date alone.
 * @returns The shifted date, or the original when it is already a business day.
 * @throws When no business day is found within two weeks, which would mean the
 *   holiday table is wrong.
 */
export function shiftToBusinessDay(date: IsoDate, direction: ShiftDirection): IsoDate {
  if (direction === 'none' || isBusinessDay(date)) return date

  const step = direction === 'previous' ? -1 : 1
  let candidate = date

  for (let moved = 0; moved < MAX_SHIFT_DAYS; moved += 1) {
    candidate = addDays(candidate, step)
    if (isBusinessDay(candidate)) return candidate
  }

  throw new RangeError(
    `No business day within ${MAX_SHIFT_DAYS} days of ${date} going ${direction}`
  )
}
