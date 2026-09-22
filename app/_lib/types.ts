/**
 * Shared data types for transactions, recurrence, and expanded occurrences.
 */

import type { ShiftDirection } from './business-days'
import type { IsoDate, Weekday } from './dates'

export type { IsoDate, Weekday } from './dates'
export type { ShiftDirection } from './business-days'

/**
 * A day of the month, or the last day of whatever month it lands in.
 *
 * `'last'` exists because no fixed number expresses a month-end schedule: 31
 * clamps correctly in February but means the 30th in a 30-day month.
 */
export type DayOfMonth = number | 'last'

/**
 * How often a transaction repeats.
 *
 * A discriminated union so an invalid combination — a weekly rule carrying a
 * day-of-month — cannot be represented. Rules describe the pattern only; the
 * span they apply over lives on the transaction.
 */
export type RecurrenceRule =
  | { type: 'once' }
  | { type: 'daily'; interval: number }
  | { type: 'weekly'; interval: number; weekday: Weekday }
  | { type: 'monthly'; interval: number; dayOfMonth: DayOfMonth }
  | { type: 'semiMonthly'; days: [DayOfMonth, DayOfMonth] }
  | { type: 'yearly'; month: number; day: number }

/** Whether money comes in or goes out. */
export type TransactionKind = 'income' | 'expense'

/**
 * A single occurrence that differs from what its rule produces.
 *
 * `date` is the date the rule produced after clamping but before any shift.
 * Keying on that stage means changing a transaction's shift direction never
 * orphans its exceptions.
 */
export type OccurrenceException =
  | { type: 'skip'; date: IsoDate }
  | {
      type: 'override'
      date: IsoDate
      label?: string
      amountCents?: number
      /** Moves this occurrence. A moved occurrence is never shifted. */
      movedTo?: IsoDate
    }

/** A scheduled movement of money and the rule for when it happens. */
export type Transaction = {
  id: string
  /** Shared across the segments of a split series. */
  seriesId: string
  kind: TransactionKind
  label: string
  /** Always positive. Direction comes from `kind`. */
  amountCents: number
  rule: RecurrenceRule
  /** First date the rule may produce. */
  start: IsoDate
  /** Last date, inclusive. Absent means open-ended. */
  end?: IsoDate
  businessDayShift: ShiftDirection
  /** Marks the transaction income periods derive from. */
  isPaycheck?: boolean
  /** Marks this as a contribution toward a goal, rather than a plain expense. */
  goalId?: string
  exceptions: OccurrenceException[]
}

/** A savings target: an amount to reach by contributing over time. */
export type Goal = {
  id: string
  label: string
  /** Always positive. */
  targetCents: number
  /** First date a contribution can count toward this goal. */
  start: IsoDate
  /**
   * Set when the goal has been manually archived.
   * Archiving is always a deliberate action, never automatic on reaching the
   * target — the user may keep contributing, or want to see it a while
   * longer before tucking it away. Deleting removes the goal outright and is
   * a separate action from archiving.
   */
  archived?: boolean
}

/** Why an occurrence landed somewhere other than its scheduled date. */
export type Displacement = 'shifted' | 'moved'

/**
 * One dated instance of a transaction. Computed, never stored.
 */
export type Occurrence = {
  transactionId: string
  seriesId: string
  /** Where the occurrence actually lands. */
  date: IsoDate
  /** Post-clamp, pre-shift date. Also the key its exception matches on. */
  scheduledDate: IsoDate
  /** Set when `date` differs from `scheduledDate`. */
  displacement?: Displacement
  kind: TransactionKind
  label: string
  amountCents: number
  isPaycheck: boolean
  goalId?: string
}

/** Everything persisted to browser storage. */
export type StoredData = {
  schemaVersion: number
  transactions: Transaction[]
  goals: Goal[]
  currency: string
}
