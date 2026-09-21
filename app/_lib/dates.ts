/**
 * Date arithmetic over plain `YYYY-MM-DD` strings.
 *
 * Dates here are calendar dates, not moments in time. A bill on the 15th is on
 * the 15th regardless of timezone, so nothing in this module converts to or
 * from UTC. Working in strings and integers keeps a date from drifting a day
 * either direction the way a timestamp can.
 */

/** A calendar date as `YYYY-MM-DD`. */
export type IsoDate = string

/** Day of the week, Sunday through Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Year, month, and day as numbers. Month is 1-12, not 0-indexed. */
export type DateParts = {
  year: number
  month: number
  day: number
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Checks whether a string is a well-formed, real calendar date.
 *
 * Rejects dates that match the pattern but do not exist, such as `2026-02-30`.
 *
 * @param value - String to check.
 * @returns True when the value is a valid `YYYY-MM-DD` date.
 */
export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE_PATTERN.test(value)) return false

  const { year, month, day } = splitParts(value)
  if (month < 1 || month > 12) return false
  return day >= 1 && day <= daysInMonth(year, month)
}

/**
 * Splits an ISO date into its numeric parts.
 *
 * @param date - Date to split.
 * @returns Year, month (1-12), and day.
 */
export function toParts(date: IsoDate): DateParts {
  return splitParts(date)
}

/**
 * Builds an ISO date from numeric parts, padding as needed.
 *
 * Parts are used as given. Callers that may produce an out-of-range day should
 * clamp first with {@link clampToMonth}.
 *
 * @param parts - Year, month (1-12), and day.
 * @returns The date as `YYYY-MM-DD`.
 */
export function fromParts({ year, month, day }: DateParts): IsoDate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`
}

/**
 * Returns whether a year is a leap year in the Gregorian calendar.
 *
 * @param year - Four-digit year.
 * @returns True when February has 29 days.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Returns the number of days in a month.
 *
 * @param year - Four-digit year.
 * @param month - Month, 1-12.
 * @returns Day count, accounting for leap years.
 */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31
}

/**
 * Returns the last day of the month a date falls in.
 *
 * @param date - Any date in the month.
 * @returns The month's final date.
 */
export function lastDayOfMonth(date: IsoDate): IsoDate {
  const { year, month } = splitParts(date)
  return fromParts({ year, month, day: daysInMonth(year, month) })
}

/**
 * Clamps a day number to one that exists in the given month.
 *
 * This is how a bill on the 31st resolves in February: the day is pulled back
 * to the month's end rather than rolling into March or being skipped.
 *
 * @param year - Four-digit year.
 * @param month - Month, 1-12.
 * @param day - Requested day, which may not exist in this month.
 * @returns A date whose day is at most the month's last.
 */
export function clampToMonth(year: number, month: number, day: number): IsoDate {
  return fromParts({ year, month, day: Math.min(day, daysInMonth(year, month)) })
}

/**
 * Adds days to a date. Negative values subtract.
 *
 * @param date - Starting date.
 * @param count - Days to add.
 * @returns The resulting date.
 */
export function addDays(date: IsoDate, count: number): IsoDate {
  const { year, month, day } = splitParts(date)
  // Date handles rollover across months and years; UTC keeps the local
  // timezone from shifting the result by a day.
  const shifted = new Date(Date.UTC(year, month - 1, day + count))
  return fromUtc(shifted)
}

/**
 * Adds months to a date, clamping the day to the target month's length.
 *
 * Adding one month to January 31 gives the last day of February rather than
 * overflowing into March.
 *
 * @param date - Starting date.
 * @param count - Months to add. Negative values subtract.
 * @returns The resulting date.
 */
export function addMonths(date: IsoDate, count: number): IsoDate {
  const { year, month, day } = splitParts(date)
  const zeroBased = month - 1 + count
  const targetYear = year + Math.floor(zeroBased / 12)
  // Modulo can be negative when subtracting past January.
  const targetMonth = (((zeroBased % 12) + 12) % 12) + 1
  return clampToMonth(targetYear, targetMonth, day)
}

/**
 * Returns the weekday for a date.
 *
 * @param date - Date to check.
 * @returns 0 for Sunday through 6 for Saturday.
 */
export function weekdayOf(date: IsoDate): Weekday {
  const { year, month, day } = splitParts(date)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as Weekday
}

/**
 * Compares two dates chronologically.
 *
 * ISO dates sort correctly as strings, so this is a plain comparison expressed
 * as a name that reads clearly at call sites.
 *
 * @param a - First date.
 * @param b - Second date.
 * @returns Negative when a is earlier, positive when later, 0 when equal.
 */
export function compareDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Returns whether a date falls within an inclusive range.
 *
 * @param date - Date to test.
 * @param start - First date in range.
 * @param end - Last date in range.
 * @returns True when the date is on or between the bounds.
 */
export function isWithin(date: IsoDate, start: IsoDate, end: IsoDate): boolean {
  return date >= start && date <= end
}

/**
 * Finds the nth occurrence of a weekday in a month.
 *
 * Used for holidays defined by position rather than date, such as the third
 * Monday of February.
 *
 * @param year - Four-digit year.
 * @param month - Month, 1-12.
 * @param weekday - Weekday to find.
 * @param occurrence - Which one, starting at 1.
 * @returns The matching date.
 * @throws When the month has no such occurrence, such as a fifth Monday.
 */
export function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: Weekday,
  occurrence: number
): IsoDate {
  const firstWeekday = weekdayOf(fromParts({ year, month, day: 1 }))
  const offset = (weekday - firstWeekday + 7) % 7
  const day = 1 + offset + (occurrence - 1) * 7

  if (day > daysInMonth(year, month)) {
    throw new RangeError(
      `No occurrence ${occurrence} of weekday ${weekday} in ${year}-${pad(month, 2)}`
    )
  }
  return fromParts({ year, month, day })
}

/**
 * Finds the last occurrence of a weekday in a month.
 *
 * @param year - Four-digit year.
 * @param month - Month, 1-12.
 * @param weekday - Weekday to find.
 * @returns The matching date.
 */
export function lastWeekdayOfMonth(year: number, month: number, weekday: Weekday): IsoDate {
  const lastDay = daysInMonth(year, month)
  const lastWeekday = weekdayOf(fromParts({ year, month, day: lastDay }))
  const offset = (lastWeekday - weekday + 7) % 7
  return fromParts({ year, month, day: lastDay - offset })
}

/**
 * Returns the date on or before a reference date that falls on a weekday.
 *
 * Used for holidays such as Victoria Day, the Monday before May 25.
 *
 * @param date - Reference date, included in the search.
 * @param weekday - Weekday to find.
 * @returns The matching date.
 */
export function weekdayOnOrBefore(date: IsoDate, weekday: Weekday): IsoDate {
  const offset = (weekdayOf(date) - weekday + 7) % 7
  return addDays(date, -offset)
}

/**
 * Counts whole days between two dates.
 *
 * @param from - Starting date.
 * @param to - Ending date.
 * @returns Day count, negative when `to` is earlier.
 */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = splitParts(from)
  const b = splitParts(to)
  const msPerDay = 86_400_000
  const start = Date.UTC(a.year, a.month - 1, a.day)
  const end = Date.UTC(b.year, b.month - 1, b.day)
  return Math.round((end - start) / msPerDay)
}

/**
 * Returns today's date in the user's local timezone.
 *
 * Call this only at the edges of the app. Functions that need the current date
 * should take it as an argument so they stay testable without a fixed clock.
 *
 * @returns Today as `YYYY-MM-DD`.
 */
export function today(): IsoDate {
  const now = new Date()
  return fromParts({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  })
}

/** Splits an ISO date without validating it. */
function splitParts(date: string): DateParts {
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  }
}

/** Formats a UTC Date as an ISO date string. */
function fromUtc(value: Date): IsoDate {
  return fromParts({
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  })
}

/** Left-pads a number with zeros to a fixed width. */
function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}
