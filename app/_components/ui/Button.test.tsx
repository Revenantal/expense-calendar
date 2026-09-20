import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { Button } from './Button'

/*
 * Example test.
 *
 * It shows what is worth testing on a shared component: the behaviour
 * consumers depend on, not the class names. Delete or replace this when the
 * project has real components.
 */

describe('Button', () => {
  test('renders a button element by default', () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  test('renders a link when given an href', () => {
    render(<Button href="/products">View products</Button>)

    expect(screen.getByRole('link', { name: 'View products' })).toHaveAttribute('href', '/products')
  })

  test('supports the disabled state', () => {
    render(<Button disabled>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})
