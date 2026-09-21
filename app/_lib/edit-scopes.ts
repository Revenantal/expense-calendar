/**
 * Applies edits and deletions at a chosen scope.
 *
 * A rule carries one set of values, so the only way a series can differ before
 * and after a point is to be two series. "This and all future" therefore ends
 * the original and starts a new one sharing its `seriesId`.
 *
 * Splitting is never surfaced in the UI — it exists so past occurrences keep
 * their old values, which is a storage concern rather than something to
 * manage.
 */

import { addDays, type IsoDate } from './dates'
import type { OccurrenceException, Transaction } from './types'

/** Which occurrences a change applies to. */
export type EditScope = 'this' | 'future' | 'all'

/** Values an edit can change. */
export type TransactionEdit = Pick<
  Transaction,
  'kind' | 'label' | 'amountCents' | 'rule' | 'businessDayShift' | 'isPaycheck'
>

/**
 * Removes occurrences at the given scope.
 *
 * @param transaction - Transaction being changed.
 * @param scheduledDate - Pre-shift date of the occurrence acted on.
 * @param scope - Which occurrences to remove.
 * @returns Transactions to save. Empty when the whole series is removed.
 */
export function applyDelete(
  transaction: Transaction,
  scheduledDate: IsoDate,
  scope: EditScope
): Transaction[] {
  switch (scope) {
    case 'this':
      return [addException(transaction, { type: 'skip', date: scheduledDate })]

    case 'future': {
      // Ending the series rather than deleting keeps past occurrences visible.
      if (scheduledDate <= transaction.start) return []
      return [{ ...transaction, end: addDays(scheduledDate, -1) }]
    }

    case 'all':
      return []
  }
}

/**
 * Applies an edit at the given scope.
 *
 * @param transaction - Transaction being changed.
 * @param scheduledDate - Pre-shift date of the occurrence acted on.
 * @param scope - Which occurrences to change.
 * @param edit - New values.
 * @param newId - Id for the new segment when the series splits.
 * @returns Transactions to save, replacing the original.
 */
export function applyEdit(
  transaction: Transaction,
  scheduledDate: IsoDate,
  scope: EditScope,
  edit: TransactionEdit,
  newId: string
): Transaction[] {
  switch (scope) {
    case 'this':
      return [
        addException(transaction, {
          type: 'override',
          date: scheduledDate,
          label: edit.label,
          amountCents: edit.amountCents,
        }),
      ]

    case 'future': {
      // Editing from the first occurrence changes the whole series, so there
      // is nothing to split off.
      if (scheduledDate <= transaction.start) {
        return [{ ...transaction, ...edit }]
      }

      const ended: Transaction = { ...transaction, end: addDays(scheduledDate, -1) }
      const continuation: Transaction = {
        ...transaction,
        ...edit,
        id: newId,
        // Shared so the two segments stay one logical series.
        seriesId: transaction.seriesId,
        start: scheduledDate,
        end: transaction.end,
        // Exceptions follow whichever segment covers their date.
        exceptions: transaction.exceptions.filter((exception) => exception.date >= scheduledDate),
      }

      return [
        {
          ...ended,
          exceptions: transaction.exceptions.filter((exception) => exception.date < scheduledDate),
        },
        continuation,
      ]
    }

    case 'all':
      return [{ ...transaction, ...edit }]
  }
}

/**
 * Moves a single occurrence to another date.
 *
 * A moved occurrence is never business-day shifted: the move is a deliberate
 * choice about that date, and an automatic rule should not override it.
 *
 * @param transaction - Transaction being changed.
 * @param scheduledDate - Pre-shift date of the occurrence to move.
 * @param movedTo - Date to move it to.
 * @returns The updated transaction.
 */
export function applyMove(
  transaction: Transaction,
  scheduledDate: IsoDate,
  movedTo: IsoDate
): Transaction {
  return addException(transaction, { type: 'override', date: scheduledDate, movedTo })
}

/** Adds an exception, replacing any already keyed to the same date. */
function addException(transaction: Transaction, exception: OccurrenceException): Transaction {
  return {
    ...transaction,
    exceptions: [
      ...transaction.exceptions.filter((existing) => existing.date !== exception.date),
      exception,
    ],
  }
}
