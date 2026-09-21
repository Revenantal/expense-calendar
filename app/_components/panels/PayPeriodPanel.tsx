'use client'

import { useMemo } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import { buildPeriods, dailyTotals, findPaycheck, totalsForPeriod } from '@/app/_lib/income-periods'
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
      <p className="text-[11px] text-muted">
        {formatShortDate(period.start)} — {formatShortDate(period.end)}
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
      </dl>
    </PanelShell>
  )
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Pay period summary"
      className="flex flex-col gap-2 rounded border border-line bg-panel p-3"
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
