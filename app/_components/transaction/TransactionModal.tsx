'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import { parseAmount, toDecimalString } from '@/app/_lib/money'
import type { IsoDate, RecurrenceRule, Transaction, TransactionKind } from '@/app/_lib/types'

import { RecurrenceFields, defaultRule } from './RecurrenceFields'

/** Values the form collects. */
export type TransactionFormValues = {
  kind: TransactionKind
  label: string
  amountCents: number
  date: IsoDate
  rule: RecurrenceRule
  businessDayShift: Transaction['businessDayShift']
  isPaycheck: boolean
}

type TransactionModalProps = {
  /** Date the transaction starts on, or the occurrence being edited. */
  date: IsoDate
  /** Present when editing; absent when adding. */
  existing?: Transaction
  onSave: (values: TransactionFormValues, ruleChanged: boolean) => void
  onClose: () => void
}

const fieldClass =
  'rounded border border-line bg-surface px-2 py-1.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'

/**
 * Form for adding or editing a transaction.
 *
 * Does not close on a backdrop click: a stray click should never discard a
 * partly entered transaction, and that is the only realistic way it happens.
 * Escape does close it, since a keypress is deliberate and keyboard users
 * rely on it.
 */
export function TransactionModal({ date, existing, onSave, onClose }: TransactionModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const [kind, setKind] = useState<TransactionKind>(existing?.kind ?? 'expense')
  const [label, setLabel] = useState(existing?.label ?? '')
  const [amount, setAmount] = useState(existing ? toDecimalString(existing.amountCents) : '')
  const [startDate, setStartDate] = useState<IsoDate>(existing?.start ?? date)
  const [rule, setRule] = useState<RecurrenceRule>(existing?.rule ?? defaultRule('once'))
  const [shift, setShift] = useState(existing?.businessDayShift ?? 'none')
  const [isPaycheck, setIsPaycheck] = useState(existing?.isPaycheck === true)
  const [touched, setTouched] = useState(false)

  const amountCents = useMemo(() => parseAmount(amount), [amount])
  const amountValid = amountCents !== undefined && amountCents >= 0
  const labelValid = label.trim().length > 0

  // Return focus where it was, so dismissing does not drop the user at the
  // top of the page.
  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement
    closeRef.current?.focus()
    return () => previouslyFocused.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      // Trap focus inside the dialog.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [href]'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!labelValid || !amountValid) return

    const ruleChanged =
      existing !== undefined && JSON.stringify(existing.rule) !== JSON.stringify(rule)

    onSave(
      {
        kind,
        label: label.trim(),
        amountCents: amountCents!,
        date: startDate,
        rule,
        businessDayShift: shift,
        isPaycheck,
      },
      ruleChanged
    )
  }

  return (
    // The backdrop deliberately has no click handler.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-line bg-raised shadow-overlay"
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
          <h2 id={titleId} className="font-display text-[15px] font-medium text-ink">
            {existing ? 'Edit transaction' : 'Add transaction'}
            <span className="ml-2 text-[12px] font-normal text-muted">{formatShortDate(date)}</span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
          <fieldset className="flex gap-2">
            <legend className="sr-only">Type</legend>
            {(['expense', 'income'] as const).map((option) => (
              <label
                key={option}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded border px-3 py-2 text-[13px] capitalize transition-colors ${
                  kind === option
                    ? 'border-accent bg-accent/10 text-ink'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${
                    option === 'income' ? 'bg-income' : 'bg-expense'
                  }`}
                />
                {option}
              </label>
            ))}
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Label</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Rent, Salary, Hydro…"
              aria-invalid={touched && !labelValid}
              className={fieldClass}
            />
            {touched && !labelValid && (
              <span className="text-[11px] text-expense">Give the transaction a label.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Amount</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={touched && !amountValid}
              className={fieldClass}
            />
            {touched && !amountValid && (
              <span className="text-[11px] text-expense">Enter an amount such as 12.34.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">
              {rule.type === 'once' ? 'Date' : 'Starts on'}
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value as IsoDate)}
              className={fieldClass}
            />
          </label>

          <RecurrenceFields rule={rule} onChange={setRule} />

          {/* Labelled by id rather than by wrapping, so the option text does
              not become part of the field's accessible name. */}
          <div className="flex flex-col gap-1">
            <label htmlFor={`${titleId}-shift`} className="text-[12px] text-muted">
              If it lands on a weekend or holiday
            </label>
            <select
              id={`${titleId}-shift`}
              value={shift}
              onChange={(event) => setShift(event.target.value as Transaction['businessDayShift'])}
              className={fieldClass}
            >
              <option value="none">Leave the date as is</option>
              <option value="previous">Move to the previous business day</option>
              <option value="next">Move to the next business day</option>
            </select>
          </div>

          {kind === 'income' && (
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={isPaycheck}
                onChange={(event) => setIsPaycheck(event.target.checked)}
                className="mt-0.5"
              />
              <span className="text-[12px] text-body">
                This is my paycheck
                <span className="block text-[11px] text-muted">
                  Pay periods are worked out from it.
                </span>
              </span>
            </label>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-2 text-[13px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 text-[13px] font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {existing ? 'Save changes' : 'Add transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
