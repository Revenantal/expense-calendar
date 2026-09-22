'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

import { formatFullDate, formatShortDate, netTotal } from '@/app/_lib/calendar-grid'
import { holidayOn } from '@/app/_lib/holidays'
import { formatMoney } from '@/app/_lib/money'
import type { IsoDate, Occurrence, Transaction } from '@/app/_lib/types'

import { useCalendar } from '../calendar/CalendarProvider'
import { describeRule } from '../transaction/RecurrenceFields'

type DayDetailPanelProps = {
  onAdd: (date: IsoDate) => void
  onEdit: (occurrence: Occurrence, transaction: Transaction) => void
  onDelete: (occurrence: Occurrence, transaction: Transaction) => void
}

/**
 * Everything happening on the selected day, with per-transaction actions.
 *
 * This is where edit and delete scopes are chosen, and the one place the full
 * list for a busy day is readable.
 */
export function DayDetailPanel({ onAdd, onEdit, onDelete }: DayDetailPanelProps) {
  const { occurrences, selectedDate, transactions } = useCalendar()

  const onDay = useMemo(
    () => occurrences.filter((occurrence) => occurrence.date === selectedDate),
    [occurrences, selectedDate]
  )

  const holiday = holidayOn(selectedDate)
  const net = netTotal(onDay)

  const byId = useMemo(
    () => new Map(transactions.map((transaction) => [transaction.id, transaction])),
    [transactions]
  )

  return (
    <section aria-label="Day detail" className="flex flex-col gap-2 rounded-2xl bg-panel p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-[13px] font-medium text-ink">
            {formatFullDate(selectedDate)}
          </h2>
          {holiday && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px]">
              {holiday.affectsPayments && (
                <span aria-hidden="true" className="size-1 rounded-full bg-holiday" />
              )}
              <span className={holiday.affectsPayments ? 'text-holiday' : 'text-holiday-muted'}>
                {holiday.name}
              </span>
              <span className="text-muted">
                {holiday.affectsPayments ? '· banks closed' : '· banks open'}
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAdd(selectedDate)}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-raised px-2.5 py-1 text-[11px] text-body transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Plus aria-hidden="true" size={12} />
          Add
        </button>
      </header>

      {onDay.length > 0 && (
        <p className="text-[11px] text-muted">
          Net <span className={net >= 0 ? 'text-income' : 'text-expense'}>{formatMoney(net)}</span>
        </p>
      )}

      {onDay.length === 0 ? (
        <p className="text-[12px] text-muted">Nothing scheduled.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {onDay.map((occurrence, index) => {
            const transaction = byId.get(occurrence.transactionId)
            if (!transaction) return null

            return (
              <li
                key={`${occurrence.transactionId}-${occurrence.scheduledDate}-${index}`}
                className="rounded-xl bg-surface p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[12px] text-ink">
                      <span
                        aria-hidden="true"
                        className={`size-1.5 shrink-0 rounded-full ${
                          occurrence.goalId
                            ? 'bg-goal'
                            : occurrence.kind === 'income'
                              ? 'bg-income'
                              : 'bg-expense'
                        }`}
                      />
                      <span className="truncate">{occurrence.label}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {occurrence.goalId ? 'Goal contribution' : describeRule(transaction.rule)}
                      {occurrence.displacement && (
                        <span className="text-holiday-muted">
                          {' · '}
                          {occurrence.displacement === 'shifted' ? 'moved off' : 'moved from'}{' '}
                          {formatShortDate(occurrence.scheduledDate)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={`text-[12px] tabular-nums ${
                        occurrence.goalId
                          ? 'text-goal'
                          : occurrence.kind === 'income'
                            ? 'text-income'
                            : 'text-expense'
                      }`}
                    >
                      {!occurrence.goalId && (occurrence.kind === 'income' ? '+' : '−')}
                      {formatMoney(occurrence.amountCents)}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(occurrence, transaction)}
                    aria-label={`Edit ${occurrence.label}`}
                    className="rounded p-1 text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                  >
                    <Pencil aria-hidden="true" size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(occurrence, transaction)}
                    aria-label={`Delete ${occurrence.label}`}
                    className="rounded p-1 text-muted transition-colors hover:text-expense focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                  >
                    <Trash2 aria-hidden="true" size={13} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
