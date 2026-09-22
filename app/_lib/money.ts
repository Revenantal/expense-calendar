/**
 * Money handling in integer minor units.
 *
 * Amounts are stored as whole cents, never as decimal dollars. Floating-point
 * cannot represent most decimal fractions exactly, so summing dollar values
 * drifts: a column of amounts can total 284.99999999999994 rather than 285.
 * For a tool whose whole purpose is totalling money, that is disqualifying.
 *
 * Conversion to a decimal happens only when formatting for display.
 */

/** Currency used throughout the app. */
export const CURRENCY = 'CAD'

/** Minor units per major unit. Two for a decimal currency. */
const MINOR_UNITS = 100

/** Accepts an optional sign, digits, and up to two decimal places. */
const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/

/**
 * Parses a user-entered decimal amount into whole cents.
 *
 * Splits on the decimal point and works with the halves as integers, so the
 * value never passes through a float.
 *
 * @param input - Amount as typed, such as `12.34`. Commas and spaces are
 *   ignored, and a leading currency symbol is accepted.
 * @returns The amount in cents, or undefined when the input is not a valid
 *   amount.
 */
export function parseAmount(input: string): number | undefined {
  const cleaned = input.trim().replace(/[$\s,]/g, '')
  if (!AMOUNT_PATTERN.test(cleaned)) return undefined

  const negative = cleaned.startsWith('-')
  const [whole, fraction = ''] = cleaned.replace('-', '').split('.')

  // Pad so `.5` reads as 50 cents rather than 5.
  const cents = Number(whole) * MINOR_UNITS + Number(fraction.padEnd(2, '0'))
  return negative ? -cents : cents
}

/**
 * Converts cents to a plain decimal string, without a currency symbol.
 *
 * Use for form fields, where a symbol and thousands separators would have to
 * be stripped again on the way back in.
 *
 * @param cents - Amount in cents.
 * @returns The amount as `12.34`.
 */
export function toDecimalString(cents: number): string {
  const negative = cents < 0
  const absolute = Math.abs(Math.round(cents))
  const whole = Math.floor(absolute / MINOR_UNITS)
  const fraction = absolute % MINOR_UNITS

  return `${negative ? '-' : ''}${whole}.${String(fraction).padStart(2, '0')}`
}

/**
 * Formats cents as currency for display.
 *
 * Builds a plain `$` prefix onto a locale-formatted number rather than
 * asking `Intl` for currency style: `style: 'currency'` with `CAD` renders as
 * `CA$` in every locale except `en-CA`, which would show wrong for the
 * overwhelming majority of browsers. Digit grouping still comes from `Intl`,
 * since that varies correctly by locale.
 *
 * A negative amount's minus sign goes before the `$`, not between it and the
 * digits — `formatAmount` already includes the sign from `Intl`, so the `$`
 * is inserted after it rather than simply prefixed.
 *
 * Rounds to the nearest whole dollar — every display in the app is a read
 * summary, not the editable amount, so pennies are a decimal the reader
 * cannot act on. Nothing is lost: the stored `amountCents` and the amount
 * form field both keep full precision.
 *
 * @param cents - Amount in cents.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A formatted string such as `$12` or `-$12`.
 */
export function formatMoney(cents: number, locale?: string): string {
  const formatted = formatAmount(cents, locale)
  return formatted.startsWith('-') ? `-$${formatted.slice(1)}` : `$${formatted}`
}

/**
 * Formats cents with an explicit sign, for values where direction matters.
 *
 * @param cents - Amount in cents. Negative values read as money out.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A formatted string such as `+$12.34` or `-$12.34`.
 */
export function formatSignedMoney(cents: number, locale?: string): string {
  const formatted = formatMoney(Math.abs(cents), locale)
  if (cents === 0) return formatted
  return `${cents > 0 ? '+' : '-'}${formatted}`
}

/**
 * Formats cents as a plain whole-dollar number, with digit grouping but no
 * currency symbol.
 *
 * Rounds to the nearest dollar; see `formatMoney` for why.
 *
 * @param cents - Amount in cents.
 * @param locale - Locale to format for. Defaults to the browser's.
 * @returns A formatted number such as `1,000`.
 */
export function formatAmount(cents: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(cents / MINOR_UNITS)
}

/**
 * Sums amounts in cents.
 *
 * Exact because the inputs are integers. Exists so call sites read clearly
 * rather than repeating a reduce.
 *
 * @param amounts - Amounts in cents.
 * @returns The total in cents.
 */
export function sumCents(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0)
}
