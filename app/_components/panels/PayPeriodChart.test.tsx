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

  it('states each arm peak, since the arms scale independently', () => {
    render(<PayPeriodChart days={days} today="2026-03-01" />)
    expect(screen.getByText(/2,500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/220\.00/)).toBeInTheDocument()
  })

  it('scales each arm to its own peak', () => {
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)
    const expenses = [...container.querySelectorAll('rect')].filter((rect) =>
      rect.getAttribute('fill')?.includes('color-expense')
    )

    // The larger expense fills its arm; a shared scale would leave both as
    // slivers beside the much larger paycheck.
    const tallest = Math.max(...expenses.map((r) => Number(r.getAttribute('height'))))
    expect(tallest).toBe((132 - 10 - 16) / 2)
  })

  it('shows a day total on hover', async () => {
    const user = userEvent.setup()
    const { container } = render(<PayPeriodChart days={days} today="2026-03-01" />)

    expect(screen.getByText(/hover a day/i)).toBeInTheDocument()

    const hitTargets = [...container.querySelectorAll('rect')].filter(
      (rect) => rect.getAttribute('fill') === 'transparent'
    )
    await user.hover(hitTargets[1])

    expect(screen.getByText(/−60\.00/)).toBeInTheDocument()
  })
})
