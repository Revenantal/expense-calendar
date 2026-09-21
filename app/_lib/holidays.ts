/**
 * Canadian holidays: the federal/national set plus Ontario provincial days.
 *
 * Dates are computed rather than stored per year, so the calendar works in any
 * year without maintenance.
 *
 * Each holiday carries `affectsPayments`, and only those days count as
 * non-business days. A statutory holiday is not automatically a banking
 * holiday — Remembrance Day is a federal holiday but Ontario banks generally
 * process normally, and shifting a bill off it would be wrong.
 *
 * The `affectsPayments` split is a best guess, not an authoritative source.
 * Which days a given bank processes is not uniformly documented and varies
 * between institutions. Correct it against real behaviour.
 */

import { addDays, fromParts, nthWeekdayOfMonth, weekdayOnOrBefore, type IsoDate } from './dates'

/** A holiday on a specific date. */
export type Holiday = {
  name: string
  date: IsoDate
  /** Whether banks are closed and payments do not process. */
  affectsPayments: boolean
}

/**
 * Calculates Easter Sunday for a year in the Gregorian calendar.
 *
 * Uses the anonymous Gregorian algorithm (Meeus/Jones/Butcher). The steps have
 * no intuitive meaning on their own, which is why this is the one date rule
 * here that cannot be read at a glance.
 *
 * @param year - Four-digit year.
 * @returns Easter Sunday.
 */
export function easterSunday(year: number): IsoDate {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return fromParts({ year, month, day })
}

/**
 * Returns Good Friday, the Friday before Easter.
 *
 * @param year - Four-digit year.
 * @returns Good Friday.
 */
export function goodFriday(year: number): IsoDate {
  return addDays(easterSunday(year), -2)
}

/**
 * Returns Easter Monday, the day after Easter.
 *
 * @param year - Four-digit year.
 * @returns Easter Monday.
 */
export function easterMonday(year: number): IsoDate {
  return addDays(easterSunday(year), 1)
}

/**
 * Builds the full holiday list for a year.
 *
 * @param year - Four-digit year.
 * @returns Holidays in date order.
 */
export function holidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = [
    { name: "New Year's Day", date: fromParts({ year, month: 1, day: 1 }), affectsPayments: true },
    // Third Monday of February.
    { name: 'Family Day', date: nthWeekdayOfMonth(year, 2, 1, 3), affectsPayments: true },
    { name: 'Good Friday', date: goodFriday(year), affectsPayments: true },
    { name: 'Easter Monday', date: easterMonday(year), affectsPayments: false },
    // The Monday on or before May 25.
    {
      name: 'Victoria Day',
      date: weekdayOnOrBefore(fromParts({ year, month: 5, day: 25 }), 1),
      affectsPayments: true,
    },
    { name: 'Canada Day', date: fromParts({ year, month: 7, day: 1 }), affectsPayments: true },
    // First Monday of August.
    { name: 'Civic Holiday', date: nthWeekdayOfMonth(year, 8, 1, 1), affectsPayments: true },
    // First Monday of September.
    { name: 'Labour Day', date: nthWeekdayOfMonth(year, 9, 1, 1), affectsPayments: true },
    {
      name: 'National Day for Truth and Reconciliation',
      date: fromParts({ year, month: 9, day: 30 }),
      affectsPayments: false,
    },
    // Second Monday of October.
    { name: 'Thanksgiving', date: nthWeekdayOfMonth(year, 10, 1, 2), affectsPayments: true },
    {
      name: 'Remembrance Day',
      date: fromParts({ year, month: 11, day: 11 }),
      affectsPayments: false,
    },
    { name: 'Christmas Day', date: fromParts({ year, month: 12, day: 25 }), affectsPayments: true },
    { name: 'Boxing Day', date: fromParts({ year, month: 12, day: 26 }), affectsPayments: true },
  ]

  return holidays.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * Finds the holiday falling on a date, if any.
 *
 * @param date - Date to check.
 * @returns The holiday, or undefined when the date is not one.
 */
export function holidayOn(date: IsoDate): Holiday | undefined {
  const year = Number(date.slice(0, 4))
  return holidaysForYear(year).find((holiday) => holiday.date === date)
}

/**
 * Returns whether a date is a holiday that stops payments processing.
 *
 * @param date - Date to check.
 * @returns True when banks are closed that day.
 */
export function isPaymentHoliday(date: IsoDate): boolean {
  return holidayOn(date)?.affectsPayments === true
}

/**
 * Returns the holidays falling within an inclusive date range.
 *
 * @param start - First date in range.
 * @param end - Last date in range.
 * @returns Matching holidays in date order.
 */
export function holidaysBetween(start: IsoDate, end: IsoDate): Holiday[] {
  const firstYear = Number(start.slice(0, 4))
  const lastYear = Number(end.slice(0, 4))

  const holidays: Holiday[] = []
  for (let year = firstYear; year <= lastYear; year += 1) {
    holidays.push(...holidaysForYear(year))
  }
  return holidays.filter((holiday) => holiday.date >= start && holiday.date <= end)
}
