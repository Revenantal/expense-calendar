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
    expect(screen.getByRole('img', { name: /daily income and expenses/i })).toBeInTheDocument()
  })

  it('keeps a slot for every day, including quiet ones', () => {
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    // One group per day, quiet days included, so spacing reflects real time.
    expect(container.querySelectorAll('svg > g')).toHaveLength(4)
  })

  it('draws income above the baseline and expenses below', () => {
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    const bars = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-income')
    )
    const expenses = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-expense')
    )

    expect(bars).toHaveLength(1)
    expect(expenses).toHaveLength(2)

    // The income bar's top edge sits above the zero line; expenses start at it.
    const zero = 10 + (132 - 10 - 16) / 2
    expect(Number(bars[0].getAttribute('y'))).toBeLessThan(zero)
    expect(Number(expenses[0].getAttribute('y'))).toBe(zero)
  })

  it('states the scale', () => {
    render(<PayPeriodChart days={days} today="2026-03-01" />)
    expect(screen.getByText(/scale \$2,500/)).toBeInTheDocument()
  })

  it('draws both arms on one scale, so heights are comparable', () => {
    // 22,000 against a 250,000 peak is 8.8% of the arm. Sharing the scale is
    // what makes a bill readable as a fraction of the pay it comes out of.
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    const armHeight = (132 - 10 - 16) / 2

    const income = [...container.querySelectorAll('rect')].find((rect) =>
      rect.getAttribute('fill')?.includes('color-income')
    )
    const expenses = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-expense')
    )
    const tallestExpense = Math.max(...expenses.map((r) => Number(r.getAttribute('height'))))

    expect(Number(income!.getAttribute('height'))).toBeCloseTo(armHeight, 5)
    expect(tallestExpense).toBeCloseTo((22_000 / 250_000) * armHeight, 5)
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
