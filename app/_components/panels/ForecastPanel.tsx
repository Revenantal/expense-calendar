'use client'

import { useMemo } from 'react'

import { formatMonthDay } from '@/app/_lib/calendar-grid'
import { addDays } from '@/app/_lib/dates'
import { buildForecast } from '@/app/_lib/forecast'
import { formatAmount } from '@/app/_lib/money'
import { expandAll } from '@/app/_lib/recurrence'

import { useCalendar } from '../calendar/CalendarProvider'

/** Days simulated forward, kept in step with the forecast module's horizon. */
const HORIZON_DAYS = 90

/**
 * A plain-English forecast: how long income covers expenses from today.
 *
 * Prose only, no chart — the sentence is the analysis. Sits full width below
 * the calendar because it looks further ahead than the pay period panel,
 * which only ever shows one period at a time.
 */
export function ForecastPanel() {
  const { transactions, today } = useCalendar()

  const forecast = useMemo(() => {
    const horizonEnd = addDays(today, HORIZON_DAYS)
    const occurrences = expandAll(transactions, today, horizonEnd)
    return buildForecast(occurrences, today)
  }, [transactions, today])

  const isWarning = forecast.outlook === 'shortfall'

  return (
    <section
      aria-label="Forecast"
      className={['rounded-2xl p-4', isWarning ? 'bg-expense/10' : 'bg-panel'].join(' ')}
    >
      <h2
        className={`font-display text-[13px] font-medium ${isWarning ? 'text-expense' : 'text-ink'}`}
      >
        {isWarning ? 'Forecast — worth a look' : 'Forecast'}
      </h2>

      <p className="mt-2 max-w-[780px] text-[13px] leading-relaxed text-body">
        {forecast.outlook === 'clear' ? (
          <>
            At the current pace, your balance stays <span className="text-income">positive</span>{' '}
            through at least <b className="text-ink">{formatMonthDay(forecast.horizonEnd)}</b>.
          </>
        ) : (
          <>
            At the current pace, your balance turns <span className="text-expense">negative</span>{' '}
            around{' '}
            <b className="text-ink">{formatMonthDay(addDays(forecast.lastPositiveDay, 1))}</b>,
            about <b className="text-ink">{forecast.daysAhead} days</b> out. The largest draw before
            then is <b className="text-ink">{forecast.largestDraw.label}</b> on{' '}
            <b className="text-ink">{formatMonthDay(forecast.largestDraw.date)}</b> at{' '}
            <b className="text-ink">{formatAmount(forecast.largestDraw.amountCents)}</b>.
          </>
        )}
      </p>
    </section>
  )
}
