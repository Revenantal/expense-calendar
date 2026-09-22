import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEY } from '@/app/_lib/storage'
import type { Transaction } from '@/app/_lib/types'

import { CalendarProvider } from './CalendarProvider'
import { MonthGrid } from './MonthGrid'

const rent: Transaction = {
  id: 'rent',
  seriesId: 'rent-series',
  kind: 'expense',
  label: 'Rent',
  amountCents: 150_000,
  rule: { type: 'monthly', interval: 1, dayOfMonth: 1 },
  start: '2026-01-01',
  businessDayShift: 'none',
  exceptions: [],
}

const pay: Transaction = {
  id: 'pay',
  seriesId: 'pay-series',
  kind: 'income',
  label: 'Salary',
  amountCents: 250_000,
  rule: { type: 'semiMonthly', days: [1, 15] },
  start: '2026-01-01',
  businessDayShift: 'none',
  isPaycheck: true,
  exceptions: [],
}

/** Renders the grid with stored transactions and a fixed today. */
function renderGrid(transactions: Transaction[] = []) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ schemaVersion: 1, currency: 'CAD', transactions })
  )

  return render(
    <CalendarProvider initialToday="2026-03-15">
      <MonthGrid onAddTransaction={vi.fn()} />
    </CalendarProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('month heading and navigation', () => {
  it('names the visible month and year', async () => {
    renderGrid()
    expect(await screen.findByRole('heading', { name: /march 2026/i })).toBeInTheDocument()
  })

  it('moves to the previous month', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(await screen.findByRole('button', { name: /previous month/i }))
    expect(screen.getByRole('heading', { name: /february 2026/i })).toBeInTheDocument()
  })

  it('moves to the next month', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(await screen.findByRole('button', { name: /next month/i }))
    expect(screen.getByRole('heading', { name: /april 2026/i })).toBeInTheDocument()
  })

  it('crosses a year boundary', async () => {
    const user = userEvent.setup()
    renderGrid()

    const previous = await screen.findByRole('button', { name: /previous month/i })
    for (let i = 0; i < 3; i += 1) await user.click(previous)

    expect(screen.getByRole('heading', { name: /december 2025/i })).toBeInTheDocument()
  })

  it('returns to today', async () => {
    const user = userEvent.setup()
    renderGrid()

    await user.click(await screen.findByRole('button', { name: /next month/i }))
    await user.click(screen.getByRole('button', { name: /^today$/i }))

    expect(screen.getByRole('heading', { name: /march 2026/i })).toBeInTheDocument()
  })
})

describe('day cells', () => {
  it('renders six weeks of cells', async () => {
    renderGrid()
    expect(await screen.findAllByRole('gridcell')).toHaveLength(42)
  })

  it('shows transactions on their day', async () => {
    renderGrid([rent, pay])
    // March 1: rent and a paycheck.
    const cell = (await screen.findAllByRole('gridcell')).find(
      (element) => element.dataset.date === '2026-03-01'
    )

    expect(within(cell!).getByText('Rent')).toBeInTheDocument()
    expect(within(cell!).getByText('Salary')).toBeInTheDocument()
  })

  it('shows a net total for the day', async () => {
    renderGrid([rent, pay])
    const cell = (await screen.findAllByRole('gridcell')).find(
      (element) => element.dataset.date === '2026-03-01'
    )

    // 250,000 income less 150,000 rent leaves 1,000.00 positive.
    expect(within(cell!).getByText(/\+\$1,000\.00/)).toBeInTheDocument()
  })

  it('shows each transaction amount in full', async () => {
    // The amount never abbreviates; the label truncates instead.
    renderGrid([rent, pay])
    const cell = (await screen.findAllByRole('gridcell')).find(
      (element) => element.dataset.date === '2026-03-01'
    )

    expect(within(cell!).getByText('$1,500.00')).toBeInTheDocument()
    expect(within(cell!).getByText('$2,500.00')).toBeInTheDocument()
  })

  it('fills trailing days borrowed from the next month', async () => {
    // The grid shows six weeks, so early April is visible from March. Those
    // cells must carry their transactions, not just a date number.
    renderGrid([rent, pay])
    const cell = (await screen.findAllByRole('gridcell')).find(
      (element) => element.dataset.date === '2026-04-01'
    )

    expect(cell).toBeDefined()
    expect(within(cell!).getByText('Rent')).toBeInTheDocument()
    expect(within(cell!).getByText('Salary')).toBeInTheDocument()
  })

  it('fills leading days borrowed from the previous month', async () => {
    const user = userEvent.setup()
    renderGrid([rent, pay])

    // April 2026 starts on a Wednesday, so the grid opens with late March.
    await user.click(await screen.findByRole('button', { name: /next month/i }))
    const cell = screen
      .getAllByRole('gridcell')
      .find((element) => element.dataset.date === '2026-03-31')

    expect(cell).toBeDefined()
    expect(within(cell!).queryByText('Rent')).not.toBeInTheDocument()

    // March 30 has nothing, but April 1 in the same grid does — confirming the
    // range covers both ends rather than just one.
    const april = screen
      .getAllByRole('gridcell')
      .find((element) => element.dataset.date === '2026-04-01')
    expect(within(april!).getByText('Rent')).toBeInTheDocument()
  })

  it('names a holiday on its day', async () => {
    renderGrid()
    const user = userEvent.setup()

    // Good Friday 2026 is April 3.
    await user.click(await screen.findByRole('button', { name: /next month/i }))
    const cell = screen
      .getAllByRole('gridcell')
      .find((element) => element.dataset.date === '2026-04-03')

    expect(within(cell!).getByText('Good Friday')).toBeInTheDocument()
  })

  it('counts transactions that do not fit', async () => {
    const many = Array.from({ length: 6 }, (_, index) => ({
      ...rent,
      id: `bill-${index}`,
      seriesId: `bill-${index}`,
      label: `Bill ${index}`,
      rule: { type: 'once' } as const,
      start: '2026-03-10',
    }))
    renderGrid(many)

    const cell = (await screen.findAllByRole('gridcell')).find(
      (element) => element.dataset.date === '2026-03-10'
    )

    // Four pills fit, so two of the six are counted instead.
    expect(within(cell!).getByText('+2 more')).toBeInTheDocument()
  })
})

describe('selection', () => {
  it('selects a day on click', async () => {
    const user = userEvent.setup()
    renderGrid()

    const cells = await screen.findAllByRole('gridcell')
    const target = cells.find((element) => element.dataset.date === '2026-03-10')!

    await user.click(target)
    expect(target).toHaveAttribute('aria-selected', 'true')
  })

  it('starts with today selected', async () => {
    renderGrid()
    const cells = await screen.findAllByRole('gridcell')
    const today = cells.find((element) => element.dataset.date === '2026-03-15')!

    expect(today).toHaveAttribute('aria-selected', 'true')
  })

  it('moves the selection with arrow keys', async () => {
    const user = userEvent.setup()
    renderGrid()

    const cells = await screen.findAllByRole('gridcell')
    const start = cells.find((element) => element.dataset.date === '2026-03-10')!
    await user.click(start)

    await user.keyboard('{ArrowRight}')
    expect(
      screen.getAllByRole('gridcell').find((el) => el.dataset.date === '2026-03-11')
    ).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowDown}')
    expect(
      screen.getAllByRole('gridcell').find((el) => el.dataset.date === '2026-03-18')
    ).toHaveAttribute('aria-selected', 'true')
  })

  it('follows the selection into the next month', async () => {
    const user = userEvent.setup()
    renderGrid()

    const cells = await screen.findAllByRole('gridcell')
    await user.click(cells.find((element) => element.dataset.date === '2026-03-31')!)
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('heading', { name: /april 2026/i })).toBeInTheDocument()
  })
})

describe('pay period span', () => {
  /** Counts cells carrying the period wash overlay. */
  function washedCells() {
    return screen
      .getAllByRole('gridcell')
      .filter((cell) => cell.querySelector('span.bg-accent\\/10[aria-hidden="true"]'))
      .map((cell) => cell.dataset.date)
  }

  it('marks every day of the period containing the selection', async () => {
    renderGrid([pay])
    await screen.findAllByRole('gridcell')

    // Today is 2026-03-15, so the period runs the 15th to the 31st.
    const marked = washedCells()
    expect(marked).toContain('2026-03-15')
    expect(marked).toContain('2026-03-20')
    expect(marked).toContain('2026-03-31')
    expect(marked).not.toContain('2026-03-14')
  })

  it('moves the span when another period is selected', async () => {
    const user = userEvent.setup()
    renderGrid([pay])

    const cells = await screen.findAllByRole('gridcell')
    await user.click(cells.find((element) => element.dataset.date === '2026-03-05')!)

    const marked = washedCells()
    expect(marked).toContain('2026-03-01')
    expect(marked).toContain('2026-03-14')
    expect(marked).not.toContain('2026-03-15')
  })

  it('marks nothing when no paycheck is defined', async () => {
    renderGrid([rent])
    await screen.findAllByRole('gridcell')

    expect(washedCells()).toHaveLength(0)
  })
})

describe('context menu', () => {
  it('opens on right click', async () => {
    const user = userEvent.setup()
    renderGrid()

    const cells = await screen.findAllByRole('gridcell')
    await user.pointer({
      keys: '[MouseRight]',
      target: cells.find((element) => element.dataset.date === '2026-03-10')!,
    })

    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /add transaction/i })).toBeInTheDocument()
  })

  it('does not open on left click', async () => {
    const user = userEvent.setup()
    renderGrid()

    const cells = await screen.findAllByRole('gridcell')
    await user.click(cells.find((element) => element.dataset.date === '2026-03-10')!)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    renderGrid()

    const cells = await screen.findAllByRole('gridcell')
    await user.pointer({
      keys: '[MouseRight]',
      target: cells.find((element) => element.dataset.date === '2026-03-10')!,
    })
    await screen.findByRole('menu')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
