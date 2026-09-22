import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PayPeriodChart, type ChartDay } from './PayPeriodChart'

const days: ChartDay[] = [
  { date: '2026-03-01', income: 250_000, expenses: 0 },
  { date: '2026-03-02', income: 0, expenses: 6_000 },
  { date: '2026-03-03', income: 0, expenses: 0 },
  { date: '2026-03-04', income: 0, expenses: 22_000 },
]

describe('PayPeriodChart', () => {
  it('renders nothing without days', () => {
    const { container } = render(<PayPeriodChart days={[]} today="2026-03-01" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('describes itself for screen readers', () => {
    render(<PayPeriodChart days={days} today="2026-03-01" />)
    expect(screen.getByRole('img', { name: /daily net of income and expenses/i })).toBeInTheDocument()
  })

  it('keeps a slot for every day, including quiet ones', () => {
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    // One group per day, quiet days included, so spacing reflects real time.
    expect(container.querySelectorAll('svg > g')).toHaveLength(4)
  })

  it('draws a positive net day in income colour and a negative one in expense colour', () => {
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    const incomeBars = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-income')
    )
    const expenseBars = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-expense')
    )

    // Day 1: net +250,000 (income colour). Days 2 and 4: net negative (expense colour).
    // Day 3 has no activity, so it draws no bar at all.
    expect(incomeBars).toHaveLength(1)
    expect(expenseBars).toHaveLength(2)
  })

  it('states the scale', () => {
    render(<PayPeriodChart days={days} today="2026-03-01" />)
    expect(screen.getByText(/scale \$2,500/)).toBeInTheDocument()
  })

  it('scales every bar against the same peak, so heights are comparable', () => {
    // 22,000 against a 250,000 peak is 8.8% of the plot height. Sharing the
    // scale is what makes a bill readable as a fraction of the pay it comes out of.
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    const plotHeight = 132 - 10 - 16

    const incomeBar = [...container.querySelectorAll('rect')].find((rect) =>
      rect.getAttribute('fill')?.includes('color-income')
    )
    const expenseBars = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-expense')
    )
    const tallestExpense = Math.max(...expenseBars.map((r) => Number(r.getAttribute('height'))))

    expect(Number(incomeBar!.getAttribute('height'))).toBeCloseTo(plotHeight, 5)
    expect(tallestExpense).toBeCloseTo((22_000 / 250_000) * plotHeight, 5)
  })

  it('draws a bill at half height against double the income', () => {
    const half = [
      { date: '2026-03-01', income: 360_000, expenses: 0 },
      { date: '2026-03-02', income: 0, expenses: 180_000 },
    ]
    const { container } = render(<PayPeriodChart days={half} today="2026-03-01" />)

    const income = [...container.querySelectorAll('rect')].find((rect) =>
      rect.getAttribute('fill')?.includes('color-income')
    )
    const expense = [...container.querySelectorAll('rect')].find((rect) =>
      rect.getAttribute('fill')?.includes('color-expense')
    )

    expect(Number(expense!.getAttribute('height'))).toBeCloseTo(
      Number(income!.getAttribute('height')) / 2,
      5
    )
  })

  it('shows a day total on hover', async () => {
    const user = userEvent.setup()
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)

    expect(screen.getByText(/hover a day/i)).toBeInTheDocument()

    const hitTargets = [...container.querySelectorAll('rect')].filter(
      (rect) => rect.getAttribute('fill') === 'transparent'
    )
    await user.hover(hitTargets[1])

    expect(screen.getByText('−$60')).toBeInTheDocument()
  })
})
