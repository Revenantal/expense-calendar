'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  formatMonthHeading,
  groupByDate,
} from '@/app/_lib/calendar-grid'
import { addDays } from '@/app/_lib/dates'
import type { IsoDate } from '@/app/_lib/types'

import { useCalendar } from './CalendarProvider'
import { DayCell } from './DayCell'
import { DayContextMenu } from './DayContextMenu'

type MonthGridProps = {
  onAddTransaction: (date: IsoDate) => void
}

/**
 * Places a day within the selected pay period, for the span marker.
 *
 * @param date - Day to place.
 * @param period - Selected pay period, if any.
 * @returns Where the day sits, or undefined when outside the period.
 */
function periodPositionFor(
  date: IsoDate,
  period?: { start: IsoDate; end: IsoDate }
): 'start' | 'inside' | 'end' | undefined {
  if (!period || date < period.start || date > period.end) return undefined
  if (date === period.start) return 'start'
  if (date === period.end) return 'end'
  return 'inside'
}

/** Arrow keys move by a day or a week; Home and End jump within the week. */
const KEY_OFFSETS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
}

/**
 * The month calendar: a fixed six-week grid with month navigation.
 */
export function MonthGrid({ onAddTransaction }: MonthGridProps) {
  const {
    occurrences,
    visibleMonth,
    selectedDate,
    selectedPeriod,
    today,
    selectDate,
    goToMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useCalendar()

  const [menu, setMenu] = useState<{ date: IsoDate; position: { x: number; y: number } }>()

  const days = useMemo(() => buildMonthGrid(visibleMonth, today), [visibleMonth, today])
  const byDate = useMemo(() => groupByDate(occurrences), [occurrences])

  /** Moves the selection, following it into an adjacent month when needed. */
  const moveSelection = (offset: number) => {
    const next = addDays(selectedDate, offset)
    selectDate(next)
    if (next.slice(0, 7) !== visibleMonth.slice(0, 7)) goToMonth(next)

    // Focus follows selection so arrow keys keep working.
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus()
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const offset = KEY_OFFSETS[event.key]
    if (offset !== undefined) {
      event.preventDefault()
      moveSelection(offset)
      return
    }

    // Shift+F10 and the context-menu key both arrive as a contextmenu event
    // in most browsers, but handle the explicit key too.
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault()
      const cell = document.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)
      const rect = cell?.getBoundingClientRect()
      setMenu({
        date: selectedDate,
        position: { x: rect?.left ?? 0, y: rect?.bottom ?? 0 },
      })
    }
  }

  return (
    <section aria-label="Month calendar" className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-medium text-ink">
          {formatMonthHeading(visibleMonth)}
        </h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToToday}
            className="rounded border border-line px-2.5 py-1 text-[12px] text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded border border-line p-1.5 text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded border border-line p-1.5 text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-7 border-t border-l border-line text-[11px] text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="border-r border-b border-line px-1.5 py-1 font-medium">
            {label}
          </div>
        ))}
      </div>

      <div
        role="grid"
        aria-label={formatMonthHeading(visibleMonth)}
        onKeyDown={handleKeyDown}
        className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 border-t border-l border-line"
      >
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            occurrences={byDate.get(day.date) ?? []}
            isSelected={day.date === selectedDate}
            periodPosition={periodPositionFor(day.date, selectedPeriod)}
            onSelect={selectDate}
            onContextMenu={(date, position) => setMenu({ date, position })}
          />
        ))}
      </div>

      {menu && (
        <DayContextMenu
          date={menu.date}
          position={menu.position}
          onAddTransaction={onAddTransaction}
          onClose={() => setMenu(undefined)}
        />
      )}
    </section>
  )
}
