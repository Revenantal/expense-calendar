'use client'

import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { formatLongDate } from '@/app/_lib/calendar-grid'
import { goalProgress, type GoalProgress } from '@/app/_lib/goals'
import { formatMoney } from '@/app/_lib/money'
import { expandAll } from '@/app/_lib/recurrence'
import { addDays } from '@/app/_lib/dates'
import type { Goal, Occurrence } from '@/app/_lib/types'

import { useCalendar } from '../calendar/CalendarProvider'
import { GoalContributionsModal } from './GoalContributionsModal'
import { GoalFormModal } from './GoalFormModal'

/** How far past today contributions are expanded, to catch near-term recurring ones. */
const FUTURE_WINDOW_DAYS = 365

/**
 * Every goal's progress, pace, and projected completion.
 *
 * A "+ New goal" action creates one; each card opens its contribution
 * history, where the goal can be deleted. Reached goals also gain a manual
 * Archive action on the card — reaching a target never hides a goal on its
 * own, since the user may keep going or want to see it a while before
 * tucking it away.
 */
export function GoalsPanel() {
  const { transactions, goals, today, addGoal, removeGoal, updateGoal } = useCalendar()

  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<Goal>()

  // Pace is an all-time average since each goal's start, so this expands the
  // full history rather than reusing the grid-scoped occurrences, which only
  // cover the visible month.
  const contributionsByGoal = useMemo(() => {
    const earliestStart = goals.reduce(
      (earliest, goal) => (goal.start < earliest ? goal.start : earliest),
      today
    )
    const all = expandAll(transactions, earliestStart, addDays(today, FUTURE_WINDOW_DAYS))

    const map = new Map<string, Occurrence[]>()
    for (const occurrence of all) {
      if (!occurrence.goalId) continue
      map.set(occurrence.goalId, [...(map.get(occurrence.goalId) ?? []), occurrence])
    }
    return map
  }, [transactions, goals, today])

  const visible = goals.filter((goal) => !goal.archived)

  return (
    <section aria-label="Goals" className="flex min-h-0 flex-col gap-2 rounded-2xl bg-panel p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[13px] font-medium text-ink">Goals</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-raised px-2.5 py-1 text-[11px] text-body transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Plus aria-hidden="true" size={12} />
          New goal
        </button>
      </header>

      {visible.length === 0 ? (
        <p className="text-[12px] text-muted">No goals yet. Start one to track progress.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((goal) => {
            // Progress is measured from all occurrences, not just what is on
            // screen right now — the grid only expands the visible month, so
            // this relies on the caller having expanded a wide enough range.
            // See the note on GoalsPanel's contributionsByGoal.
            const progress = goalProgress(goal, contributionsByGoal.get(goal.id) ?? [], today)

            return (
              <GoalCard
                key={goal.id}
                progress={progress}
                onOpen={() => setViewing(goal)}
                onArchive={() => updateGoal({ ...goal, archived: true })}
              />
            )
          })}
        </ul>
      )}

      {creating && (
        <GoalFormModal
          today={today}
          onSave={(values) => {
            addGoal({ id: crypto.randomUUID(), ...values })
            setCreating(false)
          }}
          onClose={() => setCreating(false)}
        />
      )}

      {viewing && (
        <GoalContributionsModal
          goal={viewing}
          contributions={contributionsByGoal.get(viewing.id) ?? []}
          onClose={() => setViewing(undefined)}
          onDelete={() => {
            // Deleting only removes the goal, not its past contributions —
            // those are real money that already moved, and stay on their
            // days as plain expenses.
            removeGoal(viewing.id)
            setViewing(undefined)
          }}
        />
      )}
    </section>
  )
}

type GoalCardProps = {
  progress: GoalProgress
  onOpen: () => void
  onArchive: () => void
}

function GoalCard({ progress, onOpen, onArchive }: GoalCardProps) {
  const { goal, contributedCents, fraction, reached, paceCentsPerDay, projectedCompletion } =
    progress

  return (
    <li className="rounded-xl bg-surface p-2.5">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] text-ink">{goal.label}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted">
            {formatMoney(contributedCents)} of {formatMoney(goal.targetCents)}
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`${goal.label} progress`}
          aria-valuenow={Math.round(fraction * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-goal"
            style={{ width: `${Math.round(fraction * 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-muted">
          {reached ? (
            <span className="text-goal">✓ Reached</span>
          ) : paceCentsPerDay ? (
            <>
              At {formatMoney(Math.round(paceCentsPerDay * 30))}/mo avg, done by{' '}
              {projectedCompletion && formatLongDate(projectedCompletion)}
            </>
          ) : (
            'No contributions yet'
          )}
        </p>
      </button>

      {reached && (
        <div className="mt-1.5 flex justify-end gap-1">
          <button
            type="button"
            onClick={onArchive}
            className="rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            Archive
          </button>
        </div>
      )}
    </li>
  )
}
