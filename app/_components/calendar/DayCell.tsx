'use client'

import { toParts } from '@/app/_lib/dates'
import { holidayOn } from '@/app/_lib/holidays'
import { formatAmount } from '@/app/_lib/money'
import { netTotal } from '@/app/_lib/calendar-grid'
import type { CalendarDay } from '@/app/_lib/calendar-grid'
import type { Occurrence } from '@/app/_lib/types'

/**
 * How many transactions a cell lists before showing a count.
 *
 * Four pills plus the count fit at the grid's usual height. Keep this in step
 * with the cell's real height — listing more than fits silently clips them,
 * which reads as missing data rather than a layout limit.
 */
const VISIBLE_TRANSACTIONS = 4

type DayCellProps = {
  day: CalendarDay
  occurrences: Occurrence[]
  isSelected: boolean
  /** Whether this day falls inside the selected pay period. */
  inPeriod: boolean
  onSelect: (date: string) => void
  onContextMenu: (date: string, position: { x: number; y: number }) => void
}

/**
 * One day in the month grid.
 *
 * Left click selects the day; right click and the context-menu key open the
 * menu. Cells are a fixed height and never scroll — overflow goes to the day
 * detail panel, which is built for reading.
 */
export function DayCell({
  day,
  occurrences,
  isSelected,
  inPeriod,
  onSelect,
  onContextMenu,
}: DayCellProps) {
  const holiday = holidayOn(day.date)
  const net = netTotal(occurrences)
  const shown = occurrences.slice(0, VISIBLE_TRANSACTIONS)
  const hidden = occurrences.length - shown.length

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    onContextMenu(day.date, { x: event.clientX, y: event.clientY })
  }

  return (
    <div
      role="gridcell"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      data-date={day.date}
      onClick={() => onSelect(day.date)}
      onContextMenu={handleContextMenu}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(day.date)
        }
      }}
      className={[
        'relative flex h-full min-h-0 cursor-pointer flex-col gap-1 overflow-hidden rounded-2xl p-2 text-left transition-colors',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
        day.inMonth ? 'bg-panel hover:bg-raised' : 'bg-transparent opacity-35',
        isSelected && 'shadow-[inset_0_0_0_2px_var(--color-accent)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* A wash on top of the cell background, not a competing background
          class — so it layers with the selection ring instead of fighting it
          for which colour wins. A day can be in the selected period without
          being the selected day. */}
      {inPeriod && (
        <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-accent/10" />
      )}

      <div className="relative flex items-baseline justify-between gap-1">
        <span
          className={[
            'text-[13px] leading-none font-medium tabular-nums',
            !day.inMonth ? 'text-past/60' : day.isPast ? 'text-past' : 'text-ink',
            day.isToday && 'rounded-full bg-accent px-1.5 py-0.5 text-surface',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {toParts(day.date).day}
        </span>

        {net !== 0 && (
          <span
            className={[
              'text-[11px] leading-none tabular-nums',
              day.isPast && 'opacity-60',
              net > 0 ? 'text-income' : 'text-expense',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {`${net > 0 ? '+' : '−'}${formatAmount(Math.abs(net))}`}
          </span>
        )}
      </div>

      {holiday && (
        <div className="flex items-center gap-1 truncate">
          {/* A dot marks payment-affecting days, so the distinction is not
              carried by colour alone. */}
          {holiday.affectsPayments && (
            <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-holiday" />
          )}
          <span
            className={`truncate text-[10px] leading-tight ${
              holiday.affectsPayments ? 'text-holiday' : 'text-holiday-muted'
            }`}
            title={holiday.name}
          >
            {holiday.name}
          </span>
        </div>
      )}

      <ul className="flex min-h-0 flex-col gap-1 overflow-hidden">
        {shown.map((occurrence, index) => {
          const isIncome = occurrence.kind === 'income'

          return (
            <li
              key={`${occurrence.transactionId}-${occurrence.scheduledDate}-${index}`}
              // A tinted pill rather than a bullet: the fill carries the
              // income/expense distinction across the full width, so the
              // amount has somewhere to sit at the right edge.
              className={`flex items-center justify-between gap-1 rounded-full px-2 py-0.5 text-[11px] leading-tight ${
                isIncome ? 'bg-income/18' : 'bg-expense/18'
              } ${day.isPast ? 'opacity-55' : ''}`}
            >
              {/* The amount never truncates — it is the number being read.
                  The label gives up characters instead. */}
              <span className={`truncate ${isIncome ? 'text-income' : 'text-expense'}`}>
                {occurrence.label}
              </span>
              <span
                className={`shrink-0 tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}
              >
                {formatAmount(occurrence.amountCents)}
              </span>
            </li>
          )
        })}

        {hidden > 0 && (
          <li className={`px-1 text-[10px] ${day.isPast ? 'text-past' : 'text-muted'}`}>
            +{hidden} more
          </li>
        )}
      </ul>
    </div>
  )
}
