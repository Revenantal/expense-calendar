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
 * One bar per day, net of income minus expenses, all growing up from a
 * bottom baseline. Color alone carries the sign: blue for a day ahead, red
 * for a day behind.
 *
 * A single net bar is the right form because the reader's job is the day's
 * outcome, not a breakdown of the two flows that produced it — that detail
 * still lives in the hover caption. Every day in the period gets a slot,
 * including quiet ones, so the spacing reflects real elapsed time.
 */
export function PayPeriodChart({ days, today }: PayPeriodChartProps) {
  const titleId = useId()
  const [hovered, setHovered] = useState<number>()

  if (days.length === 0) return null

  const plotHeight = HEIGHT - TOP_PAD - BOTTOM_PAD
  const baselineY = TOP_PAD + plotHeight

  // Every bar grows from the same baseline, scaled against the largest net
  // magnitude in the period, so a 300 net day draws at roughly half the
  // height of a 600 net day regardless of sign.
  const peak = Math.max(...days.map((day) => Math.abs(day.income - day.expenses)), 1)

  // Percentage geometry keeps the chart fluid without measuring the container.
  const slotWidth = 100 / days.length
  const barWidth = Math.min(slotWidth - BAR_GAP, BAR_MAX_WIDTH)

  const scale = (cents: number) => (cents / peak) * plotHeight

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
          Daily net of income and expenses across the pay period, {days.length} days
        </title>

        {/* Peak guide, dashed so it reads as a reference rather than a value. */}
        <line
          x1="0"
          x2="100"
          y1={TOP_PAD}
          y2={TOP_PAD}
          stroke="var(--color-line)"
          strokeWidth="0.6"
          strokeDasharray="2,2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Baseline, one step stronger than the hairline grid. */}
        <line
          x1="0"
          x2="100"
          y1={baselineY}
          y2={baselineY}
          stroke="var(--color-line-strong)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {days.map((day, index) => {
          const centre = index * slotWidth + slotWidth / 2
          const x = centre - barWidth / 2
          const net = day.income - day.expenses
          const netHeight = scale(Math.abs(net))
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

              {net !== 0 && (
                <rect
                  x={x}
                  y={baselineY - netHeight}
                  width={barWidth}
                  height={netHeight}
                  rx={CORNER}
                  fill={net > 0 ? 'var(--color-income)' : 'var(--color-expense)'}
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
