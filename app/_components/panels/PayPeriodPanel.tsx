'use client'

import { useMemo } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import {
  buildPeriods,
  dailyTotals,
  findPaycheck,
  previousPeriod,
  totalsForPeriod,
} from '@/app/_lib/income-periods'
import { formatMoney } from '@/app/_lib/money'
import { expandAll } from '@/app/_lib/recurrence'

import { useCalendar } from '../calendar/CalendarProvider'
import { PayPeriodChart } from './PayPeriodChart'

/**
 * The financial shape of one pay period: a diverging chart and three totals.
 *
 * Shows the period containing the selected date, so it follows the calendar
 * rather than sitting on a separate schedule.
 */
export function PayPeriodPanel() {
  const { transactions, selectedDate, today } = useCalendar()

  const paycheck = useMemo(() => findPaycheck(transactions), [transactions])

  const period = useMemo(() => {
    if (!paycheck) return undefined
    return buildPeriods(paycheck, selectedDate, selectedDate).find(
      (candidate) => selectedDate >= candidate.start && selectedDate <= candidate.end
    )
  }, [paycheck, selectedDate])

  const { days, totals } = useMemo(() => {
    if (!period) return { days: [], totals: undefined }

    const occurrences = expandAll(transactions, period.start, period.end)
    return {
      days: dailyTotals(occurrences, period),
      totals: totalsForPeriod(occurrences, period, today),
    }
  }, [transactions, period, today])

  // Compares this period's expenses to the one before it, so the panel shows
  // whether spending is trending up or down, not just this period in
  // isolation.
  const expenseTrend = useMemo(() => {
    if (!paycheck || !period || !totals) return undefined

    const previous = previousPeriod(paycheck, period)
    if (!previous) return undefined

    const previousOccurrences = expandAll(transactions, previous.start, previous.end)
    const previousTotals = totalsForPeriod(previousOccurrences, previous, today)
    if (previousTotals.expenses === 0) return undefined

    const change = (totals.expenses - previousTotals.expenses) / previousTotals.expenses
    return Math.round(change * 100)
  }, [paycheck, period, totals, transactions, today])

  if (!paycheck) {
    return (
      <PanelShell>
        <p className="text-[12px] text-muted">
          Mark an income transaction as your paycheck to see pay periods. Add one from a day, then
          tick <span className="text-body">This is my paycheck</span>.
        </p>
      </PanelShell>
    )
  }

  if (!period || !totals) {
    return (
      <PanelShell>
        <p className="text-[12px] text-muted">No pay period covers this date.</p>
      </PanelShell>
    )
  }

  return (
    <PanelShell>
      <p className="flex items-center justify-between gap-2 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          {formatShortDate(period.start)} — {formatShortDate(period.end)}
          {expenseTrend !== undefined && expenseTrend !== 0 && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 ${
                expenseTrend > 0 ? 'bg-expense/15 text-expense' : 'bg-income/15 text-income'
              }`}
            >
              {expenseTrend > 0 ? '+' : ''}
              {expenseTrend}% vs last
            </span>
          )}
        </span>
        {/* Stated as a count because period lengths vary: a shifted paycheck
            moves the boundary, so two periods in the same month can differ. */}
        <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-accent">
          {days.length} days
        </span>
      </p>

      <PayPeriodChart days={days} today={today} />

      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-2">
        <Figure label="Income" value={formatMoney(totals.income)} tone="income" />
        <Figure label="Expenses" value={formatMoney(totals.expenses)} tone="expense" />
        <Figure
          // "Remaining" only means anything inside the current period; on any
          // other it is that period's full expense total, relabelled.
          label={totals.kind === 'remaining' ? 'Still to pay' : 'Total out'}
          value={formatMoney(totals.thirdFigure)}
          tone="ink"
        />

        {/* The headline: whether the period ends up or down. Spans all three
            columns because it is the conclusion the other figures lead to. */}
        <div className="col-span-3 mt-1 flex items-baseline justify-between gap-2 border-t border-line pt-2">
          <dt className="text-[11px] text-muted">
            Net for period
            <span className="ml-1.5 text-[10px]">
              {totals.net > 0 ? 'left over' : totals.net < 0 ? 'short' : 'break even'}
            </span>
          </dt>
          <dd
            className={`font-display text-[20px] leading-none font-medium tabular-nums ${
              totals.net > 0 ? 'text-income' : totals.net < 0 ? 'text-expense' : 'text-ink'
            }`}
          >
            {/* The sign carries the meaning, so it is explicit rather than
                left to a minus that reads as a hyphen at a glance. */}
            {totals.net > 0 && '+'}
            {totals.net < 0 && '−'}
            {formatMoney(Math.abs(totals.net))}
          </dd>
        </div>
      </dl>
    </PanelShell>
  )
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Pay period summary"
      className="flex flex-col gap-2 rounded-2xl bg-panel p-4"
    >
      <h2 className="font-display text-[13px] font-medium text-ink">Pay period</h2>
      {children}
    </section>
  )
}

type FigureProps = {
  label: string
  value: string
  tone: 'income' | 'expense' | 'ink'
}

/** One of the three footer figures. */
function Figure({ label, value, tone }: FigureProps) {
  const toneClass =
    tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-ink'

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className={`text-[13px] tabular-nums ${toneClass}`}>{value}</dd>
    </div>
  )
}
