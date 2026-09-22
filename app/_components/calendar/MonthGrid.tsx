'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

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
import { MonthYearPicker } from './MonthYearPicker'

type MonthGridProps = {
  onAddTransaction: (date: IsoDate) => void
}

/**
 * Whether a day falls inside the selected pay period, for the wash overlay.
 *
 * @param date - Day to test.
 * @param period - Selected pay period, if any.
 * @returns True when the day is within the period's bounds.
 */
function isInPeriod(date: IsoDate, period?: { start: IsoDate; end: IsoDate }): boolean {
  return period !== undefined && date >= period.start && date <= period.end
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

  // Trackpads and wheels fire many small deltas per gesture; without a
  // cooldown one scroll would flip through several months at once.
  const scrollCooldown = useRef(false)

  const handleWheel = (event: React.WheelEvent) => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
    if (scrollCooldown.current) return

    scrollCooldown.current = true
    setTimeout(() => {
      scrollCooldown.current = false
    }, 350)

    if (event.deltaY > 0) goToNextMonth()
    else if (event.deltaY < 0) goToPreviousMonth()
  }

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
    <section
      aria-label="Month calendar"
      onWheel={handleWheel}
      className="flex h-full min-h-0 flex-col gap-3"
    >
      <header className="flex items-center justify-between gap-4">
        <MonthYearPicker visibleMonth={visibleMonth} onSelect={goToMonth} />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded-lg bg-panel p-1.5 text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg bg-panel px-3.5 py-1.5 text-[12px] text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-lg bg-panel p-1.5 text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-7 gap-1.5 text-[10px] tracking-wide text-muted uppercase">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-1.5 py-1 text-center font-medium">
            {label}
          </div>
        ))}
      </div>

      <div
        role="grid"
        aria-label={formatMonthHeading(visibleMonth)}
        onKeyDown={handleKeyDown}
        className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-1.5"
      >
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            occurrences={byDate.get(day.date) ?? []}
            isSelected={day.date === selectedDate}
            inPeriod={isInPeriod(day.date, selectedPeriod)}
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
