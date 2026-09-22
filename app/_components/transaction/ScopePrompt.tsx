'use client'

import { useEffect, useRef } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import type { IsoDate } from '@/app/_lib/types'

/** Which occurrences a change applies to. */
export type EditScope = 'this' | 'future' | 'all'

type ScopePromptProps = {
  action: 'edit' | 'delete'
  date: IsoDate
  /** Hides "this occurrence" — meaningless when the pattern itself changed. */
  ruleChanged?: boolean
  onChoose: (scope: EditScope) => void
  onCancel: () => void
}

/**
 * Asks which occurrences an edit or delete applies to.
 *
 * Only shown for recurring transactions. A one-off skips this, since all three
 * scopes would mean the same thing.
 */
export function ScopePrompt({
  action,
  date,
  ruleChanged = false,
  onChoose,
  onCancel,
}: ScopePromptProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.querySelector('button')?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const verb = action === 'delete' ? 'Delete' : 'Change'

  const allOptions: { scope: EditScope; label: string; detail: string }[] = [
    {
      scope: 'this',
      label: 'This occurrence only',
      detail: `Leaves every other ${formatShortDate(date)} unchanged.`,
    },
    {
      scope: 'future',
      label: 'This and all future',
      detail: 'Past occurrences keep their current values.',
    },
    {
      scope: 'all',
      label: 'All occurrences',
      detail: 'Applies to past occurrences too.',
    },
  ]

  // "Just this one" has no meaning when the schedule itself changed.
  const options = allOptions.filter((option) => !(ruleChanged && option.scope === 'this'))

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-prompt-title"
        className="w-full max-w-sm rounded-2xl bg-raised p-5 shadow-overlay"
      >
        <h2 id="scope-prompt-title" className="font-display text-[15px] font-medium text-ink">
          {verb} which occurrences?
        </h2>

        {ruleChanged && (
          <p className="mt-1 text-[12px] text-muted">
            The schedule changed, so this cannot apply to a single occurrence.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-1.5">
          {options.map((option) => (
            <button
              key={option.scope}
              type="button"
              onClick={() => onChoose(option.scope)}
              className="rounded-xl bg-surface px-3.5 py-2.5 text-left transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <span className="block text-[13px] text-ink">{option.label}</span>
              <span className="block text-[11px] text-muted">{option.detail}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full rounded-lg px-3 py-2 text-[13px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
