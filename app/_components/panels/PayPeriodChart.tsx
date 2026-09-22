'use client'

import { useId, useState } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import { toParts } from '@/app/_lib/dates'
import { formatMoney } from '@/app/_lib/money'
import type { IsoDate } from '@/app/_lib/types'

/** One day's income and expenses, in cents. */
export type ChartDay = {
  date: IsoDate
  income: number
  expenses: number
}

type PayPeriodChartProps = {
  days: ChartDay[]
  today: IsoDate
}

/** Chart geometry. Height is fixed; width scales to the container. */
const HEIGHT = 132
const TOP_PAD = 10
const BOTTOM_PAD = 16
const BAR_MAX_WIDTH = 14
const BAR_GAP = 2
const CORNER = 4

/**
 * Income above a centre baseline, expenses below, one column per day.
 *
 * A diverging bar is the right form because the reader's job is polarity —
 * money in against money out — rather than comparing categories. Every day in
 * the period gets a slot, including quiet ones, so the spacing reflects real
 * elapsed time.
 */
export function PayPeriodChart({ days, today }: PayPeriodChartProps) {
  const titleId = useId()
  const [hovered, setHovered] = useState<number>()

  if (days.length === 0) return null

  const plotHeight = HEIGHT - TOP_PAD - BOTTOM_PAD
  const zeroY = TOP_PAD + plotHeight / 2
  const armHeight = plotHeight / 2

  // One scale across both arms, so bar heights are directly comparable: a
  // 1,400 bill against 3,600 income draws at roughly half the height. Scaling
  // each arm to its own peak would make every expense look full-size relative
  // to the largest expense, which hides how much of the pay each one consumes.
  const peak = Math.max(...days.flatMap((day) => [day.income, day.expenses]), 1)

  // Percentage geometry keeps the chart fluid without measuring the container.
  const slotWidth = 100 / days.length
  const barWidth = Math.min(slotWidth - BAR_GAP, BAR_MAX_WIDTH)

  const scale = (cents: number) => (cents / peak) * armHeight

  const active = hovered !== undefined ? days[hovered] : undefined

  return (
    <figure className="m-0 flex flex-col gap-1">
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
        className="h-33 w-full"
        onMouseLeave={() => setHovered(undefined)}
      >
        <title id={titleId}>
          Daily income and expenses across the pay period, {days.length} days
        </title>

        {/* Zero line, one step stronger than the hairline grid. */}
        <line
          x1="0"
          x2="100"
          y1={zeroY}
          y2={zeroY}
          stroke="var(--color-line-strong)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {days.map((day, index) => {
          const centre = index * slotWidth + slotWidth / 2
          const x = centre - barWidth / 2
          const incomeHeight = scale(day.income)
          const expenseHeight = scale(day.expenses)
          const isToday = day.date === today

          return (
            <g key={day.date}>
              {/* Hit target spans the whole slot; a thin bar is hard to hover. */}
              <rect
                x={index * slotWidth}
                y={0}
                width={slotWidth}
                height={HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
              />

              {isToday && (
                <rect
                  x={index * slotWidth}
                  y={TOP_PAD}
                  width={slotWidth}
                  height={plotHeight}
                  fill="var(--color-raised)"
                  opacity={0.6}
                />
              )}

              {day.income > 0 && (
                <rect
                  x={x}
                  y={zeroY - incomeHeight}
                  width={barWidth}
                  height={incomeHeight}
                  rx={CORNER}
                  fill="var(--color-income)"
                  opacity={hovered === undefined || hovered === index ? 1 : 0.45}
                />
              )}

              {day.expenses > 0 && (
                <rect
                  x={x}
                  y={zeroY}
                  width={barWidth}
                  height={expenseHeight}
                  rx={CORNER}
                  fill="var(--color-expense)"
                  opacity={hovered === undefined || hovered === index ? 1 : 0.45}
                />
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex justify-between text-[10px] text-muted">
        <span>
          Day {dayNumber(days[0].date)}–{dayNumber(days[days.length - 1].date)}
        </span>
        <span>scale {formatMoney(peak)}</span>
      </div>

      <figcaption
        aria-live="polite"
        className="min-h-8.5 rounded-xl bg-surface px-2.5 py-1 text-[11px]"
      >
        {active ? (
          <>
            <span className="text-body">{formatShortDate(active.date)}</span>
            <span className="ml-2 text-income">
              {active.income > 0 ? `+${formatMoney(active.income)}` : '—'}
            </span>
            <span className="ml-2 text-expense">
              {active.expenses > 0 ? `−${formatMoney(active.expenses)}` : '—'}
            </span>
          </>
        ) : (
          <span className="text-muted">Hover a day for its totals.</span>
        )}
      </figcaption>
    </figure>
  )
}

/** Returns just the day number, for the compact axis ends. */
function dayNumber(date: IsoDate): string {
  return String(toParts(date).day)
}
