import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/*
 * Example shared component.
 *
 * It shows the patterns this project expects: one component with variant and
 * size props instead of near-duplicate components, typed props, design tokens
 * instead of hardcoded values, and built-in focus/disabled handling.
 */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text'
type ButtonSize = 'small' | 'default' | 'large'

type SharedButtonProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

type ButtonAsLinkProps = SharedButtonProps & {
  href: string
  disabled?: never
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'href'>

type ButtonAsButtonProps = SharedButtonProps & {
  href?: never
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

type ButtonProps = ButtonAsLinkProps | ButtonAsButtonProps

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'bg-ink text-white hover:opacity-90',
  outline: 'border border-line text-ink hover:bg-panel',
  text: 'px-0 py-0 text-accent hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-4 py-2 text-[13px]',
  default: 'px-6 py-3 text-[15px]',
  large: 'px-8 py-4 text-[17px]',
}

/** Builds the shared class list for button and link variants. */
function getButtonClasses(variant: ButtonVariant, size: ButtonSize, className: string) {
  return [
    'inline-flex items-center justify-center gap-2 font-display font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent disabled:pointer-events-none disabled:bg-line disabled:text-muted',
    variantClasses[variant],
    variant === 'text' ? 'text-[15px]' : sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Renders a shared action as either a link or a button. */
export function Button(props: ButtonProps) {
  if (typeof props.href === 'string') {
    const {
      children,
      variant = 'primary',
      size = 'default',
      className = '',
      href,
      ...anchorProps
    } = props

    return (
      <Link className={getButtonClasses(variant, size, className)} href={href} {...anchorProps}>
        {children}
      </Link>
    )
  }

  const {
    children,
    variant = 'primary',
    size = 'default',
    className = '',
    type = 'button',
    ...buttonProps
  } = props

  return (
    <button className={getButtonClasses(variant, size, className)} type={type} {...buttonProps}>
      {children}
    </button>
  )
}
