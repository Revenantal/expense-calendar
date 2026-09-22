'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { formatMonthHeading } from '@/app/_lib/calendar-grid'
import { fromParts, toParts } from '@/app/_lib/dates'
import type { IsoDate } from '@/app/_lib/types'

type MonthYearPickerProps = {
  visibleMonth: IsoDate
  onSelect: (date: IsoDate) => void
}

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, index, 1))
  )
)

/** How many years either side of the current one to offer. */
const YEAR_SPAN = 10

/**
 * A dropdown on the month heading for jumping several months or years at
 * once, rather than clicking the arrow buttons repeatedly.
 */
export function MonthYearPicker({ visibleMonth, onSelect }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { year, month } = toParts(visibleMonth)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const years = Array.from({ length: YEAR_SPAN * 2 + 1 }, (_, index) => year - YEAR_SPAN + index)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-lg px-1 py-0.5 font-display text-xl font-medium text-ink transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {formatMonthHeading(visibleMonth)}
        <ChevronDown aria-hidden="true" size={16} className="text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose month and year"
          className="absolute top-full left-0 z-50 mt-1 flex gap-1.5 rounded-2xl bg-raised p-2 shadow-overlay"
        >
          <select
            aria-label="Month"
            value={month}
            onChange={(event) => {
              onSelect(fromParts({ year, month: Number(event.target.value), day: 1 }))
              setOpen(false)
            }}
            className="rounded-lg bg-panel px-2 py-1.5 text-[13px] text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Year"
            value={year}
            onChange={(event) => {
              onSelect(fromParts({ year: Number(event.target.value), month, day: 1 }))
              setOpen(false)
            }}
            className="rounded-lg bg-panel px-2 py-1.5 text-[13px] text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {years.map((candidate) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
