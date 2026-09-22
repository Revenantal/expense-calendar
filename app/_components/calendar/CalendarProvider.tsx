'use client'

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { buildMonthGrid } from '@/app/_lib/calendar-grid'
import { addMonths, fromParts, lastDayOfMonth, toParts, today as todayDate } from '@/app/_lib/dates'
import { buildPeriods, findPaycheck, type IncomePeriod } from '@/app/_lib/income-periods'
import { expandAll } from '@/app/_lib/recurrence'
import { loadData, saveTransactions } from '@/app/_lib/storage'
import type { Goal, IsoDate, Occurrence, Transaction } from '@/app/_lib/types'

/** State and actions shared by the calendar and its panels. */
type CalendarContextValue = {
  transactions: Transaction[]
  goals: Goal[]
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
  /** Replaces both lists at once, for a full import. */
  replaceAllData: (transactions: Transaction[], goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (goal: Goal) => void
  removeGoal: (id: string) => void
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

  // Transactions and goals are one state value, not two, because they persist
  // together in one storage record. Two separate `useState`s would need a
  // write to happen as a side effect of one setter reading the other's
  // current value — exactly the nested-setState-inside-an-updater shape that
  // produced duplicate goals under React's Strict Mode double-invoke.
  const [data, setData] = useState<{ transactions: Transaction[]; goals: Goal[] }>({
    transactions: [],
    goals: [],
  })
  const { transactions, goals } = data
  // Mirrors `data` outside render, so `persist` can compute the next value
  // and write it in one pass without a functional updater. Refs cannot be
  // written during render, so this is kept current by an effect instead —
  // safe here because every caller of `persist` runs from an event handler,
  // which always fires after the effect for the render it saw has committed.
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState<string>()
  const [visibleMonth, setVisibleMonth] = useState<IsoDate>(today)
  const [selectedDate, setSelectedDate] = useState<IsoDate>(today)

  // Reads stored data once the component is on the client. localStorage is a
  // browser API and this tree renders on the server first, so the read cannot
  // happen during render or in the initial state.
  useEffect(() => {
    const stored = loadData()
    const loaded = { transactions: stored.transactions, goals: stored.goals }
    dataRef.current = loaded
    startTransition(() => {
      setData(loaded)
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
   * Applies changes to the transaction and goal lists and persists the
   * result together — they live in one storage record, so a write always
   * carries both.
   *
   * Takes updaters rather than finished arrays so the actions below stay
   * referentially stable without reading state during render. Reads the
   * current value from `dataRef` rather than a `setData` functional updater,
   * and writes as a plain statement after — not nested inside the updater.
   * React (in Strict Mode) invokes a state updater twice to check it is
   * pure, and a write nested inside one fires twice too, which is what
   * previously produced a duplicate goal on every add.
   */
  const persist = useCallback(
    (
      updateTransactions: (current: Transaction[]) => Transaction[],
      updateGoals: (current: Goal[]) => Goal[] = (current) => current
    ) => {
      const next = {
        transactions: updateTransactions(dataRef.current.transactions),
        goals: updateGoals(dataRef.current.goals),
      }
      dataRef.current = next
      setData(next)

      const result = saveTransactions(next.transactions, next.goals)
      setStorageError(result.ok ? undefined : result.reason)
    },
    []
  )

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

  const replaceAllData = useCallback(
    (nextTransactions: Transaction[], nextGoals: Goal[]) => {
      persist(
        () => nextTransactions,
        () => nextGoals
      )
    },
    [persist]
  )

  const addGoal = useCallback(
    (goal: Goal) => {
      persist(
        (current) => current,
        (current) => [...current, goal]
      )
    },
    [persist]
  )

  const updateGoal = useCallback(
    (goal: Goal) => {
      persist(
        (current) => current,
        (current) => current.map((existing) => (existing.id === goal.id ? goal : existing))
      )
    },
    [persist]
  )

  const removeGoal = useCallback(
    (id: string) => {
      persist(
        (current) => current,
        (current) => current.filter((existing) => existing.id !== id)
      )
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
      goals,
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
      replaceAllData,
      addGoal,
      updateGoal,
      removeGoal,
      dismissStorageError: () => setStorageError(undefined),
    }),
    [
      transactions,
      goals,
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
      replaceAllData,
      addGoal,
      updateGoal,
      removeGoal,
    ]
  )

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}
