'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { parseAmount } from '@/app/_lib/money'
import type { IsoDate } from '@/app/_lib/types'

export type GoalFormValues = {
  label: string
  targetCents: number
  start: IsoDate
}

type GoalFormModalProps = {
  /** Defaults the start date to today. */
  today: IsoDate
  onSave: (values: GoalFormValues) => void
  onClose: () => void
}

const fieldClass =
  'rounded-lg bg-surface px-2.5 py-1.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'

/**
 * Form for creating a new goal.
 *
 * A separate, smaller modal from `TransactionModal` — a goal is a target to
 * track, not a scheduled movement of money, so it has none of the recurrence
 * or business-day machinery a transaction needs.
 */
export function GoalFormModal({ today, onSave, onClose }: GoalFormModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [start, setStart] = useState<IsoDate>(today)
  const [touched, setTouched] = useState(false)

  const targetCents = useMemo(() => parseAmount(amount), [amount])
  const amountValid = targetCents !== undefined && targetCents > 0
  const labelValid = label.trim().length > 0

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement
    closeRef.current?.focus()
    return () => previouslyFocused.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!labelValid || !amountValid) return

    onSave({ label: label.trim(), targetCents: targetCents!, start })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-raised shadow-overlay"
      >
        <header className="flex items-center justify-between gap-4 px-5 py-4">
          <h2 id={titleId} className="font-display text-[15px] font-medium text-ink">
            New goal
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-line hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-5">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Label</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Emergency fund, New laptop…"
              aria-invalid={touched && !labelValid}
              className={fieldClass}
            />
            {touched && !labelValid && (
              <span className="text-[11px] text-expense">Give the goal a label.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Target amount</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={touched && !amountValid}
              className={fieldClass}
            />
            {touched && !amountValid && (
              <span className="text-[11px] text-expense">Enter an amount such as 1000.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-muted">Start date</span>
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value as IsoDate)}
              className={fieldClass}
            />
          </label>

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-[13px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Create goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
