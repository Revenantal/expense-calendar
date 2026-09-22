/**
 * Builds the day grid for a month view, and formats dates for display.
 *
 * Kept as plain functions so the layout maths is testable without rendering.
 *
 * Every formatter here passes `timeZone: 'UTC'`. The dates are built with
 * `Date.UTC`, and without that option `Intl` renders the instant in the
 * machine's local zone — which shifts the date back a day anywhere west of
 * UTC. Removing it reintroduces exactly the drift that storing plain date
 * strings exists to prevent.
 */

import { addDays, fromParts, lastDayOfMonth, toParts, weekdayOf, type IsoDate } from './dates'
import type { Occurrence } from './types'

/** One cell in the month grid. */
export type CalendarDay = {
  date: IsoDate
  /** False for the leading and trailing days borrowed from adjacent months. */
  inMonth: boolean
  isToday: boolean
  isPast: boolean
}

/**
 * Builds six weeks of days covering a month.
 *
 * Always returns 42 days so the grid keeps a fixed height as months change.
 * A grid that grows and shrinks between months makes the whole page jump.
 *
 * @param monthDate - Any date within the month to show.
 * @param today - Today's date, for marking and past-day fading.
 * @returns 42 days, starting on the Sunday on or before the 1st.
 */
export function buildMonthGrid(monthDate: IsoDate, today: IsoDate): CalendarDay[] {
  const { year, month } = toParts(monthDate)
  const firstOfMonth = fromParts({ year, month, day: 1 })
  const lastOfMonth = lastDayOfMonth(firstOfMonth)

  // Back up to the Sunday that starts the first visible week.
  const gridStart = addDays(firstOfMonth, -weekdayOf(firstOfMonth))

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return {
      date,
      inMonth: date >= firstOfMonth && date <= lastOfMonth,
      isToday: date === today,
      isPast: date < today,
    }
  })
}

/**
 * Groups occurrences by the date they land on.
 *
 * @param occurrences - Occurrences to group.
 * @returns A map from date to the occurrences on it.
 */
export function groupByDate(occurrences: Occurrence[]): Map<IsoDate, Occurrence[]> {
  const grouped = new Map<IsoDate, Occurrence[]>()

  for (const occurrence of occurrences) {
    const existing = grouped.get(occurrence.date)
    if (existing) existing.push(occurrence)
    else grouped.set(occurrence.date, [occurrence])
  }

  return grouped
}

/**
 * Nets a day's occurrences into a single figure.
 *
 * @param occurrences - Occurrences on one day.
 * @returns Income minus expenses, in cents.
 */
export function netTotal(occurrences: Occurrence[]): number {
  return occurrences.reduce(
    (total, occurrence) =>
      occurrence.kind === 'income'
        ? total + occurrence.amountCents
        : total - occurrence.amountCents,
    0
  )
}

/** Short weekday headings, Sunday first, matching the grid order. */
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/**
 * Formats a month and year for the calendar heading.
 *
 * @param monthDate - Any date within the month.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A heading such as `March 2026`.
 */
export function formatMonthHeading(monthDate: IsoDate, locale?: string): string {
  const { year, month } = toParts(monthDate)
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return formatter.format(new Date(Date.UTC(year, month - 1, 1)))
}

/**
 * Formats a full date for the day detail panel.
 *
 * @param date - Date to format.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A date such as `Sunday, 15 March 2026`.
 */
export function formatFullDate(date: IsoDate, locale?: string): string {
  const { year, month, day } = toParts(date)
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return formatter.format(new Date(Date.UTC(year, month - 1, day)))
}

/**
 * Formats a date compactly, for shift notes such as "moved from Sat 15 Mar".
 *
 * @param date - Date to format.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A date such as `Sat 15 Mar`.
 */
export function formatShortDate(date: IsoDate, locale?: string): string {
  const { year, month, day } = toParts(date)
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  return formatter.format(new Date(Date.UTC(year, month - 1, day)))
}

/**
 * Formats a date without a weekday, for prose that already reads as a
 * sentence, such as "positive through Nov 3".
 *
 * @param date - Date to format.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A date such as `Nov 3`.
 */
export function formatMonthDay(date: IsoDate, locale?: string): string {
  const { year, month, day } = toParts(date)
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  return formatter.format(new Date(Date.UTC(year, month - 1, day)))
}

/**
 * Formats a date with its year, for a projection that may land well over a
 * year out, such as a goal's expected completion date.
 *
 * @param date - Date to format.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A date such as `Jan 5, 2027`.
 */
export function formatLongDate(date: IsoDate, locale?: string): string {
  const { year, month, day } = toParts(date)
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return formatter.format(new Date(Date.UTC(year, month - 1, day)))
}
