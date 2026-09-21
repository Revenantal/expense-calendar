import { describe, expect, it } from 'vitest'

import {
  formatAmount,
  formatMoney,
  formatSignedMoney,
  parseAmount,
  sumCents,
  toDecimalString,
} from './money'

describe('parseAmount', () => {
  it('parses whole dollars', () => {
    expect(parseAmount('12')).toBe(1200)
    expect(parseAmount('0')).toBe(0)
  })

  it('parses two decimal places', () => {
    expect(parseAmount('12.34')).toBe(1234)
    expect(parseAmount('0.99')).toBe(99)
  })

  it('pads a single decimal place', () => {
    // .5 is fifty cents, not five.
    expect(parseAmount('12.5')).toBe(1250)
    expect(parseAmount('0.5')).toBe(50)
  })

  it('handles values that would drift as floats', () => {
    // 0.1 + 0.2 !== 0.3 in binary floating point.
    expect(parseAmount('0.10')).toBe(10)
    expect(parseAmount('0.20')).toBe(20)
    expect(parseAmount('0.29')).toBe(29)
    expect(parseAmount('1.15')).toBe(115)
    expect(parseAmount('8.20')).toBe(820)
  })

  it('ignores currency symbols, commas, and spaces', () => {
    expect(parseAmount('$12.34')).toBe(1234)
    expect(parseAmount('1,234.56')).toBe(123456)
    expect(parseAmount('  12.34  ')).toBe(1234)
  })

  it('parses negative amounts', () => {
    expect(parseAmount('-12.34')).toBe(-1234)
  })

  it('rejects malformed input', () => {
    expect(parseAmount('')).toBeUndefined()
    expect(parseAmount('abc')).toBeUndefined()
    expect(parseAmount('12.')).toBeUndefined()
    expect(parseAmount('.5')).toBeUndefined()
    expect(parseAmount('12.345')).toBeUndefined()
    expect(parseAmount('1.2.3')).toBeUndefined()
  })

  it('handles large amounts without precision loss', () => {
    expect(parseAmount('999999.99')).toBe(99999999)
  })
})

describe('toDecimalString', () => {
  it('formats cents as a decimal', () => {
    expect(toDecimalString(1234)).toBe('12.34')
    expect(toDecimalString(1200)).toBe('12.00')
    expect(toDecimalString(5)).toBe('0.05')
    expect(toDecimalString(50)).toBe('0.50')
    expect(toDecimalString(0)).toBe('0.00')
  })

  it('formats negative amounts', () => {
    expect(toDecimalString(-1234)).toBe('-12.34')
    expect(toDecimalString(-5)).toBe('-0.05')
  })

  it('round trips with parseAmount', () => {
    for (const cents of [0, 1, 50, 99, 100, 1234, 99999999]) {
      expect(parseAmount(toDecimalString(cents))).toBe(cents)
    }
  })
})

describe('formatMoney', () => {
  it('formats as Canadian currency', () => {
    // Locale pinned so the assertion does not depend on the test machine.
    expect(formatMoney(1234, 'en-CA')).toBe('$12.34')
    expect(formatMoney(0, 'en-CA')).toBe('$0.00')
  })

  it('groups thousands', () => {
    expect(formatMoney(123456789, 'en-CA')).toBe('$1,234,567.89')
  })
})

describe('formatAmount', () => {
  it('omits the currency symbol entirely', () => {
    // CAD renders as "CA$" in some locales, so stripping a bare "$" from a
    // formatted string would leave "CA" behind.
    expect(formatAmount(100_000, 'en-CA')).toBe('1,000.00')
    expect(formatAmount(1234, 'en-CA')).toBe('12.34')
    expect(formatAmount(0, 'en-CA')).toBe('0.00')
  })

  it('always shows two decimal places', () => {
    expect(formatAmount(1200, 'en-CA')).toBe('12.00')
    expect(formatAmount(5, 'en-CA')).toBe('0.05')
  })
})

describe('formatSignedMoney', () => {
  it('prefixes a sign for non-zero values', () => {
    expect(formatSignedMoney(1234, 'en-CA')).toBe('+$12.34')
    expect(formatSignedMoney(-1234, 'en-CA')).toBe('-$12.34')
  })

  it('leaves zero unsigned', () => {
    expect(formatSignedMoney(0, 'en-CA')).toBe('$0.00')
  })
})

describe('sumCents', () => {
  it('totals exactly where floats would drift', () => {
    // 284.99999999999994 as floats; exact as integers.
    const amounts = Array.from({ length: 10 }, () => 2850)
    expect(sumCents(amounts)).toBe(28500)
  })

  it('sums an empty list to zero', () => {
    expect(sumCents([])).toBe(0)
  })

  it('handles mixed signs', () => {
    expect(sumCents([1000, -250, -100])).toBe(650)
  })
})
