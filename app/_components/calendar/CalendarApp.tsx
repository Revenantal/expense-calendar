'use client'

import { useState } from 'react'

import { applyDelete, applyEdit, type EditScope } from '@/app/_lib/edit-scopes'
import type { IsoDate, Occurrence, Transaction } from '@/app/_lib/types'

import { DayDetailPanel } from '../panels/DayDetailPanel'
import { PayPeriodPanel } from '../panels/PayPeriodPanel'
import { ScopePrompt } from '../transaction/ScopePrompt'
import { TransactionModal, type TransactionFormValues } from '../transaction/TransactionModal'
import { CalendarProvider, useCalendar } from './CalendarProvider'
import { DataControls } from './DataControls'
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

/** A change waiting on a scope choice. */
type PendingScope = {
  action: 'edit' | 'delete'
  transaction: Transaction
  scheduledDate: IsoDate
  values?: TransactionFormValues
  ruleChanged: boolean
}

/** Arranges the calendar and its side column, and owns the modal flow. */
function CalendarLayout() {
  const { loading, storageError, dismissStorageError, addTransaction, replaceAll, transactions } =
    useCalendar()

  const [modal, setModal] = useState<ModalState>()
  const [pending, setPending] = useState<PendingScope>()

  /** Replaces one transaction with whatever a scope change produced. */
  const commit = (original: Transaction, replacement: Transaction[]) => {
    replaceAll([...transactions.filter((existing) => existing.id !== original.id), ...replacement])
  }

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

    const scopePending: PendingScope = {
      action: 'edit',
      transaction: modal.transaction,
      scheduledDate: modal.scheduledDate,
      values,
      ruleChanged,
    }

    // A one-off has a single occurrence, so every scope means the same thing.
    if (modal.transaction.rule.type === 'once') {
      applyScope('all', scopePending)
      return
    }

    setPending(scopePending)
    setModal(undefined)
  }

  /** Applies a pending edit or delete at the chosen scope. */
  const applyScope = (scope: EditScope, target: PendingScope) => {
    if (target.action === 'delete') {
      commit(target.transaction, applyDelete(target.transaction, target.scheduledDate, scope))
    } else if (target.values) {
      commit(
        target.transaction,
        applyEdit(
          target.transaction,
          target.scheduledDate,
          scope,
          {
            kind: target.values.kind,
            label: target.values.label,
            amountCents: target.values.amountCents,
            rule: target.values.rule,
            businessDayShift: target.values.businessDayShift,
            isPaycheck: target.values.isPaycheck || undefined,
          },
          crypto.randomUUID()
        )
      )
    }

    setPending(undefined)
    setModal(undefined)
  }

  const handleDelete = (occurrence: Occurrence, transaction: Transaction) => {
    const target: PendingScope = {
      action: 'delete',
      transaction,
      scheduledDate: occurrence.scheduledDate,
      ruleChanged: false,
    }

    if (transaction.rule.type === 'once') {
      applyScope('all', target)
      return
    }
    setPending(target)
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
      <div className="flex items-center justify-end">
        <DataControls />
      </div>

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

        <aside
          aria-label="Summary"
          className="hidden min-h-0 w-[320px] shrink-0 flex-col gap-3 xl:flex"
        >
          <PayPeriodPanel />
          <DayDetailPanel
            onAdd={(date) => setModal({ mode: 'add', date })}
            onEdit={(occurrence, transaction) =>
              setModal({
                mode: 'edit',
                date: occurrence.date,
                transaction,
                scheduledDate: occurrence.scheduledDate,
              })
            }
            onDelete={handleDelete}
          />
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

      {pending && (
        <ScopePrompt
          action={pending.action}
          date={pending.scheduledDate}
          ruleChanged={pending.ruleChanged}
          onChoose={(scope) => applyScope(scope, pending)}
          onCancel={() => setPending(undefined)}
        />
      )}
    </div>
  )
}
