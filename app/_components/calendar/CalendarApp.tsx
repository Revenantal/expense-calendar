'use client'

import { useState } from 'react'

import { applyEdit, type EditScope } from '@/app/_lib/edit-scopes'
import type { IsoDate, Transaction } from '@/app/_lib/types'

import { TransactionModal, type TransactionFormValues } from '../transaction/TransactionModal'
import { ScopePrompt } from '../transaction/ScopePrompt'
import { CalendarProvider, useCalendar } from './CalendarProvider'
import { MonthGrid } from './MonthGrid'

/**
 * The interactive calendar tree.
 *
 * Holds the provider so everything below shares one source of transactions
 * and one selected date.
 */
export function CalendarApp() {
  return (
    <CalendarProvider>
      <CalendarLayout />
    </CalendarProvider>
  )
}

/** What the modal is currently doing, if anything. */
type ModalState =
  | { mode: 'add'; date: IsoDate }
  | { mode: 'edit'; date: IsoDate; transaction: Transaction; scheduledDate: IsoDate }

/** A saved edit waiting on a scope choice. */
type PendingEdit = {
  transaction: Transaction
  scheduledDate: IsoDate
  values: TransactionFormValues
  ruleChanged: boolean
}

/**
 * Arranges the calendar and its side column, and owns the modal flow.
 *
 * The right column takes the pay period summary and day detail panels; both
 * arrive in Phase 7.
 */
function CalendarLayout() {
  const { loading, storageError, dismissStorageError, addTransaction, replaceAll, transactions } =
    useCalendar()

  const [modal, setModal] = useState<ModalState>()
  const [pendingEdit, setPendingEdit] = useState<PendingEdit>()

  /** Saves a new transaction, or routes an edit through the scope prompt. */
  const handleSave = (values: TransactionFormValues, ruleChanged: boolean) => {
    if (modal?.mode === 'add') {
      addTransaction({
        id: crypto.randomUUID(),
        seriesId: crypto.randomUUID(),
        kind: values.kind,
        label: values.label,
        amountCents: values.amountCents,
        rule: values.rule,
        start: values.date,
        businessDayShift: values.businessDayShift,
        ...(values.isPaycheck && { isPaycheck: true }),
        exceptions: [],
      })
      setModal(undefined)
      return
    }

    if (modal?.mode !== 'edit') return

    // A one-off has only one occurrence, so every scope means the same thing.
    if (modal.transaction.rule.type === 'once') {
      applyScope('all', {
        transaction: modal.transaction,
        scheduledDate: modal.scheduledDate,
        values,
        ruleChanged,
      })
      return
    }

    setPendingEdit({
      transaction: modal.transaction,
      scheduledDate: modal.scheduledDate,
      values,
      ruleChanged,
    })
    setModal(undefined)
  }

  /** Applies a pending edit at the chosen scope. */
  const applyScope = (scope: EditScope, pending: PendingEdit) => {
    const replacement = applyEdit(
      pending.transaction,
      pending.scheduledDate,
      scope,
      {
        kind: pending.values.kind,
        label: pending.values.label,
        amountCents: pending.values.amountCents,
        rule: pending.values.rule,
        businessDayShift: pending.values.businessDayShift,
        isPaycheck: pending.values.isPaycheck || undefined,
      },
      crypto.randomUUID()
    )

    replaceAll([
      ...transactions.filter((existing) => existing.id !== pending.transaction.id),
      ...replacement,
    ])

    setPendingEdit(undefined)
    setModal(undefined)
  }

  if (loading) {
    return (
      <p className="p-4 text-[13px] text-muted" role="status">
        Loading…
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {storageError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded border border-expense/40 bg-expense/10 px-3 py-2 text-[13px] text-ink"
        >
          <span>{storageError}</span>
          <button
            type="button"
            onClick={dismissStorageError}
            className="shrink-0 text-muted underline hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1">
          <MonthGrid onAddTransaction={(date) => setModal({ mode: 'add', date })} />
        </div>

        <aside aria-label="Summary" className="hidden w-[320px] shrink-0 flex-col gap-3 xl:flex">
          <div className="rounded border border-line bg-panel p-3 text-[13px] text-muted">
            Pay period summary — Phase 7.
          </div>
          <div className="flex-1 rounded border border-line bg-panel p-3 text-[13px] text-muted">
            Day detail — Phase 7.
          </div>
        </aside>
      </div>

      {modal && (
        <TransactionModal
          date={modal.date}
          existing={modal.mode === 'edit' ? modal.transaction : undefined}
          onSave={handleSave}
          onClose={() => setModal(undefined)}
        />
      )}

      {pendingEdit && (
        <ScopePrompt
          action="edit"
          date={pendingEdit.scheduledDate}
          ruleChanged={pendingEdit.ruleChanged}
          onChoose={(scope) => applyScope(scope, pendingEdit)}
          onCancel={() => setPendingEdit(undefined)}
        />
      )}
    </div>
  )
}
