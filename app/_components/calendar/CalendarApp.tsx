'use client'

import { useState } from 'react'

import type { IsoDate } from '@/app/_lib/types'

import { CalendarProvider, useCalendar } from './CalendarProvider'
import { MonthGrid } from './MonthGrid'

/**
 * The interactive calendar tree.
 *
 * Holds the provider so everything below shares one source of transactions
 * and one selected date.
 */
export function CalendarApp() {
  return (
    <CalendarProvider>
      <CalendarLayout />
    </CalendarProvider>
  )
}

/**
 * Arranges the calendar and its side column.
 *
 * The right column takes the pay period summary and day detail panels; both
 * arrive in Phase 7.
 */
function CalendarLayout() {
  const { loading, storageError, dismissStorageError } = useCalendar()

  // Tracks which date a pending add applies to. The modal arrives in Phase 6.
  const [, setPendingDate] = useState<IsoDate>()

  if (loading) {
    return (
      <p className="p-4 text-[13px] text-muted" role="status">
        Loading…
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {storageError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded border border-expense/40 bg-expense/10 px-3 py-2 text-[13px] text-ink"
        >
          <span>{storageError}</span>
          <button
            type="button"
            onClick={dismissStorageError}
            className="shrink-0 text-muted underline hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1">
          <MonthGrid onAddTransaction={setPendingDate} />
        </div>

        <aside aria-label="Summary" className="hidden w-[320px] shrink-0 flex-col gap-3 xl:flex">
          <div className="rounded border border-line bg-panel p-3 text-[13px] text-muted">
            Pay period summary — Phase 7.
          </div>
          <div className="flex-1 rounded border border-line bg-panel p-3 text-[13px] text-muted">
            Day detail — Phase 7.
          </div>
        </aside>
      </div>
    </div>
  )
}
