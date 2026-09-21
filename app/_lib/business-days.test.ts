import { describe, expect, it } from 'vitest'

import { isBusinessDay, isWeekend, shiftToBusinessDay } from './business-days'

describe('isWeekend', () => {
  it('is true on Saturday and Sunday', () => {
    // 2026-03-21 is a Saturday.
    expect(isWeekend('2026-03-21')).toBe(true)
    expect(isWeekend('2026-03-22')).toBe(true)
  })

  it('is false on weekdays', () => {
    expect(isWeekend('2026-03-20')).toBe(false)
    expect(isWeekend('2026-03-23')).toBe(false)
  })
})

describe('isBusinessDay', () => {
  it('is true on an ordinary weekday', () => {
    expect(isBusinessDay('2026-03-16')).toBe(true)
  })

  it('is false on a weekend', () => {
    expect(isBusinessDay('2026-03-21')).toBe(false)
  })

  it('is false on a payment-affecting holiday', () => {
    // Canada Day 2026 is a Wednesday.
    expect(isBusinessDay('2026-07-01')).toBe(false)
  })

  it('is true on an informational holiday', () => {
    // Remembrance Day 2026 is a Wednesday and Ontario banks process normally.
    expect(isBusinessDay('2026-11-11')).toBe(true)
  })
})

describe('shiftToBusinessDay', () => {
  it('leaves a business day alone', () => {
    expect(shiftToBusinessDay('2026-03-16', 'previous')).toBe('2026-03-16')
    expect(shiftToBusinessDay('2026-03-16', 'next')).toBe('2026-03-16')
  })

  it('does nothing when the direction is none', () => {
    // A Saturday stays put.
    expect(shiftToBusinessDay('2026-03-21', 'none')).toBe('2026-03-21')
  })

  it('moves back off a weekend', () => {
    // Saturday and Sunday both fall back to Friday the 20th.
    expect(shiftToBusinessDay('2026-03-21', 'previous')).toBe('2026-03-20')
    expect(shiftToBusinessDay('2026-03-22', 'previous')).toBe('2026-03-20')
  })

  it('moves forward off a weekend', () => {
    expect(shiftToBusinessDay('2026-03-21', 'next')).toBe('2026-03-23')
    expect(shiftToBusinessDay('2026-03-22', 'next')).toBe('2026-03-23')
  })

  it('skips consecutive non-business days', () => {
    // Christmas 2026 is a Friday, Boxing Day the Saturday, then Sunday.
    // Forward lands on Monday the 28th.
    expect(shiftToBusinessDay('2026-12-25', 'next')).toBe('2026-12-28')
  })

  it('skips a holiday to reach a working day going backward', () => {
    // Boxing Day Saturday, Christmas Friday: back to Thursday the 24th.
    expect(shiftToBusinessDay('2026-12-26', 'previous')).toBe('2026-12-24')
  })

  it('crosses a month boundary', () => {
    // Civic Holiday 2026 is Monday Aug 3, preceded by a weekend.
    // Going back from it reaches Friday July 31.
    expect(shiftToBusinessDay('2026-08-03', 'previous')).toBe('2026-07-31')
  })

  it('crosses a year boundary', () => {
    // New Year's Day 2027 is a Friday; going back reaches Thursday Dec 31.
    expect(shiftToBusinessDay('2027-01-01', 'previous')).toBe('2026-12-31')
  })

  it('crosses forward into the next month', () => {
    // Aug 1 2026 is a Saturday; forward reaches Monday Aug 3, which is the
    // Civic Holiday, so it continues to Tuesday the 4th.
    expect(shiftToBusinessDay('2026-08-01', 'next')).toBe('2026-08-04')
  })

  it('does not shift off an informational holiday', () => {
    expect(shiftToBusinessDay('2026-11-11', 'previous')).toBe('2026-11-11')
  })
})
