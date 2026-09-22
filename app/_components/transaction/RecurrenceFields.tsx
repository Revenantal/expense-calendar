'use client'

import { useId } from 'react'

import { WEEKDAY_LABELS } from '@/app/_lib/calendar-grid'
import type { DayOfMonth, RecurrenceRule, Weekday } from '@/app/_lib/types'

type RecurrenceFieldsProps = {
  rule: RecurrenceRule
  onChange: (rule: RecurrenceRule) => void
}

/** Rule types in the order they are offered. */
const RULE_TYPES: { value: RecurrenceRule['type']; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every N days' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'semiMonthly', label: 'Twice a month' },
  { value: 'yearly', label: 'Yearly' },
]

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const fieldClass =
  'rounded-lg bg-surface px-2.5 py-1.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'

/**
 * Inputs for a recurrence rule, switching on the selected type.
 *
 * Changing type builds a fresh rule with that type's defaults rather than
 * carrying fields across, since each type holds different fields.
 */
export function RecurrenceFields({ rule, onChange }: RecurrenceFieldsProps) {
  const repeatsId = useId()

  return (
    <div className="flex flex-col gap-3">
      {/* Labels point at their control by id rather than wrapping it. A label
          that wraps a select takes the option text into its accessible name,
          so the field announces as "Repeats Once Every N days Weekly…". */}
      <div className="flex flex-col gap-1">
        <label htmlFor={repeatsId} className="text-[12px] text-muted">
          Repeats
        </label>
        <select
          id={repeatsId}
          value={rule.type}
          onChange={(event) => onChange(defaultRule(event.target.value as RecurrenceRule['type']))}
          className={fieldClass}
        >
          {RULE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {rule.type === 'daily' && (
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-muted">Every</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={rule.interval}
              onChange={(event) => onChange({ ...rule, interval: positiveInt(event.target.value) })}
              className={`${fieldClass} w-20`}
            />
            <span className="text-[13px] text-body">days</span>
          </div>
        </label>
      )}

      {rule.type === 'weekly' && (
        <div className="flex gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Every</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={rule.interval}
                onChange={(event) =>
                  onChange({ ...rule, interval: positiveInt(event.target.value) })
                }
                className={`${fieldClass} w-20`}
              />
              <span className="text-[13px] text-body">weeks</span>
            </div>
          </label>

          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`${repeatsId}-weekday`} className="text-[12px] text-muted">
              On
            </label>
            <select
              id={`${repeatsId}-weekday`}
              value={rule.weekday}
              onChange={(event) =>
                onChange({ ...rule, weekday: Number(event.target.value) as Weekday })
              }
              className={fieldClass}
            >
              {WEEKDAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {rule.type === 'monthly' && (
        <div className="flex gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Every</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={rule.interval}
                onChange={(event) =>
                  onChange({ ...rule, interval: positiveInt(event.target.value) })
                }
                className={`${fieldClass} w-20`}
              />
              <span className="text-[13px] text-body">months</span>
            </div>
          </label>

          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`${repeatsId}-day`} className="text-[12px] text-muted">
              On day
            </label>
            <DayOfMonthSelect
              id={`${repeatsId}-day`}
              value={rule.dayOfMonth}
              onChange={(dayOfMonth) => onChange({ ...rule, dayOfMonth })}
            />
          </div>
        </div>
      )}

      {rule.type === 'semiMonthly' && (
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`${repeatsId}-first`} className="text-[12px] text-muted">
              First day
            </label>
            <DayOfMonthSelect
              id={`${repeatsId}-first`}
              value={rule.days[0]}
              onChange={(day) => onChange({ ...rule, days: [day, rule.days[1]] })}
            />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`${repeatsId}-second`} className="text-[12px] text-muted">
              Second day
            </label>
            <DayOfMonthSelect
              id={`${repeatsId}-second`}
              value={rule.days[1]}
              onChange={(day) => onChange({ ...rule, days: [rule.days[0], day] })}
            />
          </div>
        </div>
      )}

      {rule.type === 'yearly' && (
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`${repeatsId}-month`} className="text-[12px] text-muted">
              Month
            </label>
            <select
              id={`${repeatsId}-month`}
              value={rule.month}
              onChange={(event) => onChange({ ...rule, month: Number(event.target.value) })}
              className={fieldClass}
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Day</span>
            <input
              type="number"
              min={1}
              max={31}
              value={rule.day}
              onChange={(event) =>
                onChange({ ...rule, day: clamp(Number(event.target.value), 1, 31) })
              }
              className={`${fieldClass} w-20`}
            />
          </label>
        </div>
      )}
    </div>
  )
}

type DayOfMonthSelectProps = {
  id: string
  value: DayOfMonth
  onChange: (day: DayOfMonth) => void
}

/**
 * Picks a day of the month, including the month's last day.
 *
 * "Last day" is a distinct option rather than the number 31, because 31 means
 * the 30th in a 30-day month — wrong for a month-end schedule.
 */
function DayOfMonthSelect({ id, value, onChange }: DayOfMonthSelectProps) {
  return (
    <select
      id={id}
      value={value === 'last' ? 'last' : String(value)}
      onChange={(event) =>
        onChange(event.target.value === 'last' ? 'last' : Number(event.target.value))
      }
      className={fieldClass}
    >
      {Array.from({ length: 31 }, (_, index) => (
        <option key={index + 1} value={index + 1}>
          {ordinal(index + 1)}
        </option>
      ))}
      <option value="last">Last day</option>
    </select>
  )
}

/**
 * Builds a rule of the given type with sensible defaults.
 *
 * @param type - Rule type to build.
 * @returns A complete rule of that type.
 */
export function defaultRule(type: RecurrenceRule['type']): RecurrenceRule {
  switch (type) {
    case 'once':
      return { type: 'once' }
    case 'daily':
      return { type: 'daily', interval: 1 }
    case 'weekly':
      return { type: 'weekly', interval: 1, weekday: 1 }
    case 'monthly':
      return { type: 'monthly', interval: 1, dayOfMonth: 1 }
    case 'semiMonthly':
      return { type: 'semiMonthly', days: [1, 15] }
    case 'yearly':
      return { type: 'yearly', month: 1, day: 1 }
  }
}

/**
 * Describes a rule in plain words.
 *
 * @param rule - Rule to describe.
 * @returns A phrase such as `Monthly on the 15th`.
 */
export function describeRule(rule: RecurrenceRule): string {
  switch (rule.type) {
    case 'once':
      return 'One-off'
    case 'daily':
      return rule.interval === 1 ? 'Every day' : `Every ${rule.interval} days`
    case 'weekly': {
      const day = WEEKDAY_LABELS[rule.weekday]
      return rule.interval === 1 ? `Weekly on ${day}` : `Every ${rule.interval} weeks on ${day}`
    }
    case 'monthly': {
      const day = rule.dayOfMonth === 'last' ? 'the last day' : `the ${ordinal(rule.dayOfMonth)}`
      return rule.interval === 1 ? `Monthly on ${day}` : `Every ${rule.interval} months on ${day}`
    }
    case 'semiMonthly': {
      const [first, second] = rule.days.map((day) =>
        day === 'last' ? 'the last day' : `the ${ordinal(day)}`
      )
      return `Twice a month, on ${first} and ${second}`
    }
    case 'yearly':
      return `Yearly on ${MONTH_NAMES[rule.month - 1]} ${ordinal(rule.day)}`
  }
}

/** Formats a number with its ordinal suffix. */
function ordinal(value: number): string {
  const lastTwo = value % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`

  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

function positiveInt(value: string): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
