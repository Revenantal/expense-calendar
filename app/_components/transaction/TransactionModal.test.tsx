import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Transaction } from '@/app/_lib/types'

import { TransactionModal } from './TransactionModal'

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

function renderModal(props: Partial<Parameters<typeof TransactionModal>[0]> = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()

  render(<TransactionModal date="2026-03-15" onSave={onSave} onClose={onClose} {...props} />)

  return { onSave, onClose }
}

describe('closing', () => {
  it('closes on the X button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close on a backdrop click', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    // The backdrop is the dialog's parent element.
    const backdrop = screen.getByRole('dialog').parentElement!
    await user.click(backdrop)

    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('focus', () => {
  it('moves focus into the dialog on open', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus()
  })

  it('marks itself as a modal dialog', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })
})

describe('validation', () => {
  it('rejects an empty label', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByLabelText(/amount/i), '12.34')
    await user.click(screen.getByRole('button', { name: /add transaction/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/give the transaction a label/i)).toBeInTheDocument()
  })

  it('rejects a malformed amount', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByLabelText(/label/i), 'Rent')
    await user.type(screen.getByLabelText(/amount/i), 'abc')
    await user.click(screen.getByRole('button', { name: /add transaction/i }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(/enter an amount/i)).toBeInTheDocument()
  })
})

describe('saving', () => {
  it('converts the amount to whole cents', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByLabelText(/label/i), 'Hydro')
    await user.type(screen.getByLabelText(/amount/i), '142.50')
    await user.click(screen.getByRole('button', { name: /add transaction/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Hydro', amountCents: 14_250 }),
      false
    )
  })

  it('trims whitespace from the label', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByLabelText(/label/i), '  Rent  ')
    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.click(screen.getByRole('button', { name: /add transaction/i }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ label: 'Rent' }), false)
  })

  it('defaults to an expense', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByLabelText(/label/i), 'Rent')
    await user.type(screen.getByLabelText(/amount/i), '10')
    await user.click(screen.getByRole('button', { name: /add transaction/i }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ kind: 'expense' }), false)
  })
})

describe('editing', () => {
  it('fills the form from the existing transaction', () => {
    renderModal({ existing: rent })

    expect(screen.getByLabelText(/label/i)).toHaveValue('Rent')
    expect(screen.getByLabelText(/amount/i)).toHaveValue('1500.00')
    expect(screen.getByRole('heading', { name: /edit transaction/i })).toBeInTheDocument()
  })

  it('reports that the rule is unchanged when only a value changes', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal({ existing: rent })

    const amount = screen.getByLabelText(/amount/i)
    await user.clear(amount)
    await user.type(amount, '1650.00')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 165_000 }), false)
  })

  it('reports a changed rule when the schedule changes', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal({ existing: rent })

    await user.selectOptions(screen.getByLabelText(/^repeats$/i), 'weekly')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(onSave).toHaveBeenCalledWith(expect.anything(), true)
  })
})

describe('paycheck', () => {
  it('offers the paycheck option only for income', async () => {
    const user = userEvent.setup()
    renderModal()

    expect(screen.queryByLabelText(/this is my paycheck/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /income/i }))
    expect(screen.getByLabelText(/this is my paycheck/i)).toBeInTheDocument()
  })
})

describe('recurrence fields', () => {
  it('shows no extra fields for a one-off', () => {
    renderModal()
    expect(screen.queryByLabelText(/on day/i)).not.toBeInTheDocument()
  })

  it('offers a day of month for a monthly rule', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.selectOptions(screen.getByLabelText(/^repeats$/i), 'monthly')
    expect(screen.getByLabelText(/on day/i)).toBeInTheDocument()
  })

  it('offers two days for a semi-monthly rule', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.selectOptions(screen.getByLabelText(/^repeats$/i), 'semiMonthly')
    expect(screen.getByLabelText(/first day/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/second day/i)).toBeInTheDocument()
  })

  it('offers the last day of the month', async () => {
    const user = userEvent.setup()
    const { onSave } = renderModal()

    await user.type(screen.getByLabelText(/label/i), 'Savings')
    await user.type(screen.getByLabelText(/amount/i), '500')
    await user.selectOptions(screen.getByLabelText(/^repeats$/i), 'monthly')
    await user.selectOptions(screen.getByLabelText(/on day/i), 'last')
    await user.click(screen.getByRole('button', { name: /add transaction/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        rule: { type: 'monthly', interval: 1, dayOfMonth: 'last' },
      }),
      false
    )
  })
})
