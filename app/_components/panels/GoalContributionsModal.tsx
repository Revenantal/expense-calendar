'use client'

import { X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import { formatMoney } from '@/app/_lib/money'
import type { Goal, Occurrence } from '@/app/_lib/types'

type GoalContributionsModalProps = {
  goal: Goal
  /** All of the goal's contribution occurrences, any date. */
  contributions: Occurrence[]
  onClose: () => void
  /** Deletes the goal itself, not a contribution. */
  onDelete: () => void
}

/**
 * A goal's full contribution history, most recent first.
 *
 * The contribution list itself is read-only: editing or deleting a single
 * contribution happens through the day it falls on, the same as any other
 * transaction, so this list does not duplicate that flow. Deleting the goal
 * lives here rather than on its card, since this is the detail view — the
 * card stays a compact summary.
 */
export function GoalContributionsModal({
  goal,
  contributions,
  onClose,
  onDelete,
}: GoalContributionsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const ordered = useMemo(
    () => [...contributions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [contributions]
  )
  const total = useMemo(
    () => ordered.reduce((sum, occurrence) => sum + occurrence.amountCents, 0),
    [ordered]
  )

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${goal.label} contributions`}
        className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-raised shadow-overlay"
      >
        <header className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="font-display text-[15px] font-medium text-ink">{goal.label}</h2>
            <p className="text-[12px] text-muted">
              {formatMoney(total)} of {formatMoney(goal.targetCents)} · {ordered.length}{' '}
              contribution{ordered.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-line hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        {ordered.length === 0 ? (
          <p className="px-5 pb-5 text-[12px] text-muted">No contributions yet.</p>
        ) : (
          <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto px-3 pb-3">
            {ordered.map((occurrence, index) => (
              <li
                key={`${occurrence.transactionId}-${occurrence.scheduledDate}-${index}`}
                className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2"
              >
                <span className="text-[12px] text-body">{formatShortDate(occurrence.date)}</span>
                <span className="text-[13px] tabular-nums text-goal">
                  {formatMoney(occurrence.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end px-5 py-3">
          <button
            type="button"
            onClick={() => {
              if (globalThis.confirm(`Delete "${goal.label}"? This cannot be undone.`)) {
                onDelete()
              }
            }}
            className="rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:text-expense focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            Delete goal
          </button>
        </div>
      </div>
    </div>
  )
}
