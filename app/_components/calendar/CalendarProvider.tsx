'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { buildMonthGrid } from '@/app/_lib/calendar-grid'
import { addMonths, fromParts, lastDayOfMonth, toParts, today as todayDate } from '@/app/_lib/dates'
import { buildPeriods, findPaycheck, type IncomePeriod } from '@/app/_lib/income-periods'
import { expandAll } from '@/app/_lib/recurrence'
import { loadData, saveTransactions } from '@/app/_lib/storage'
import type { IsoDate, Occurrence, Transaction } from '@/app/_lib/types'

/** State and actions shared by the calendar and its panels. */
type CalendarContextValue = {
  transactions: Transaction[]
  /**
   * Occurrences across the whole visible grid, including the leading and
   * trailing days borrowed from the adjacent months.
   */
  occurrences: Occurrence[]
  /** Any date within the month on display. */
  visibleMonth: IsoDate
  /** First and last date of the visible month. */
  monthRange: { start: IsoDate; end: IsoDate }
  selectedDate: IsoDate
  /** The pay period covering the selected day, when a paycheck is defined. */
  selectedPeriod?: IncomePeriod
  /** Today, captured once on mount so it cannot change mid-render. */
  today: IsoDate
  /** True until stored data has loaded, so the UI can avoid a flash of empty. */
  loading: boolean
  /** Set when a write fails, so the failure is visible rather than silent. */
  storageError?: string
  selectDate: (date: IsoDate) => void
  goToMonth: (date: IsoDate) => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (transaction: Transaction) => void
  removeTransaction: (id: string) => void
  replaceAll: (transactions: Transaction[]) => void
  dismissStorageError: () => void
}

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined)

/**
 * Reads calendar state.
 *
 * @returns The shared calendar context.
 * @throws When called outside a `CalendarProvider`.
 */
export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used inside a CalendarProvider')
  }
  return context
}

type CalendarProviderProps = {
  children: ReactNode
  /** Fixes today's date. Tests pass this; the app does not. */
  initialToday?: IsoDate
}

/**
 * Owns transaction data, persistence, and which dates are on screen.
 *
 * Data loads on mount rather than during render because `localStorage` is a
 * browser API and this tree is server-rendered first.
 */
export function CalendarProvider({ children, initialToday }: CalendarProviderProps) {
  // Captured once so a session left open overnight does not silently change
  // which day counts as today mid-interaction.
  const [today] = useState(() => initialToday ?? todayDate())

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState<string>()
  const [visibleMonth, setVisibleMonth] = useState<IsoDate>(today)
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today)

  // Reads stored data once the component is on the client. localStorage is a
  // browser API and this tree renders on the server first, so the read cannot
  // happen during render or in the initial state.
  useEffect(() => {
    const stored = loadData()
    startTransition(() => {
      setTransactions(stored.transactions)
      setLoading(false)
    })
  }, [])

  const monthRange = useMemo(() => {
    const { year, month } = toParts(visibleMonth)
    const start = fromParts({ year, month, day: 1 })
    return { start, end: lastDayOfMonth(start) }
  }, [visibleMonth])

  // The grid shows six weeks, so it spills into the months either side.
  // Expanding only the current month would leave those cells with a date
  // number and nothing in them, which reads as "nothing scheduled" rather
  // than "not loaded".
  const gridRange = useMemo(() => {
    const days = buildMonthGrid(visibleMonth, today)
    return { start: days[0].date, end: days[days.length - 1].date }
  }, [visibleMonth, today])

  const occurrences = useMemo(
    () => expandAll(transactions, gridRange.start, gridRange.end),
    [transactions, gridRange]
  )

  // The pay period covering the selected day, so the grid can show its span.
  const selectedPeriod = useMemo(() => {
    const paycheck = findPaycheck(transactions)
    if (!paycheck) return undefined

    return buildPeriods(paycheck, selectedDate, selectedDate).find(
      (candidate) => selectedDate >= candidate.start && selectedDate <= candidate.end
    )
  }, [transactions, selectedDate])

  /**
   * Applies a change to the transaction list and persists the result.
   *
   * Takes an updater rather than a finished array so the actions below stay
   * referentially stable without reading state during render. Persistence is
   * driven by these actions, not by an effect watching state, so navigating
   * months never triggers a write.
   */
  const persist = useCallback((update: (current: Transaction[]) => Transaction[]) => {
    setTransactions((current) => {
      const next = update(current)
      const result = saveTransactions(next)
      setStorageError(result.ok ? undefined : result.reason)
      return next
    })
  }, [])

  const addTransaction = useCallback(
    (transaction: Transaction) => {
      persist((current) => [...current, transaction])
    },
    [persist]
  )

  const updateTransaction = useCallback(
    (transaction: Transaction) => {
      persist((current) =>
        current.map((existing) => (existing.id === transaction.id ? transaction : existing))
      )
    },
    [persist]
  )

  const removeTransaction = useCallback(
    (id: string) => {
      persist((current) => current.filter((existing) => existing.id !== id))
    },
    [persist]
  )

  const replaceAll = useCallback(
    (next: Transaction[]) => {
      persist(() => next)
    },
    [persist]
  )

  const goToMonth = useCallback((date: IsoDate) => setVisibleMonth(date), [])

  const goToPreviousMonth = useCallback(() => {
    setVisibleMonth((current) => addMonths(`${current.slice(0, 8)}01`, -1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setVisibleMonth((current) => addMonths(`${current.slice(0, 8)}01`, 1))
  }, [])

  const goToToday = useCallback(() => {
    setVisibleMonth(today)
    setSelectedDate(today)
  }, [today])

  const value = useMemo<CalendarContextValue>(
    () => ({
      transactions,
      occurrences,
      visibleMonth,
      monthRange,
      selectedDate,
      selectedPeriod,
      today,
      loading,
      storageError,
      selectDate: setSelectedDate,
      goToMonth,
      goToPreviousMonth,
      goToNextMonth,
      goToToday,
      addTransaction,
      updateTransaction,
      removeTransaction,
      replaceAll,
      dismissStorageError: () => setStorageError(undefined),
    }),
    [
      transactions,
      occurrences,
      visibleMonth,
      monthRange,
      selectedDate,
      selectedPeriod,
      today,
      loading,
      storageError,
      goToMonth,
      goToPreviousMonth,
      goToNextMonth,
      goToToday,
      addTransaction,
      updateTransaction,
      removeTransaction,
      replaceAll,
    ]
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
