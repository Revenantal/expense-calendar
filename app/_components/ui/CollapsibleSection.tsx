'use client'

import { ChevronDown } from 'lucide-react'
import { startTransition, useEffect, useState, type ReactNode } from 'react'

/** Key collapse state is stored under, namespaced per section. */
const STORAGE_PREFIX = 'expense-calendar:collapsed:'

type CollapsibleSectionProps = {
  /** Identifies this section's stored collapse state. Stable across sessions. */
  id: string
  /** Rendered as the section's own heading, inside the toggle button. */
  label: string
  children: ReactNode
}

/**
 * Wraps a sidebar panel with a collapse toggle, retained in local storage.
 *
 * Wraps rather than modifies each panel, so a panel keeps its own `<section
 * aria-label>` and heading — this only adds a toggle in front of it and hides
 * its body when collapsed.
 */
export function CollapsibleSection({ id, label, children }: CollapsibleSectionProps) {
  const storageKey = `${STORAGE_PREFIX}${id}`

  // Starts open. Reading localStorage during render would mismatch the
  // server-rendered markup, so the stored value is applied after mount, same
  // as CalendarProvider does for its own data.
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = safeGet(storageKey) === 'true'
    if (stored) startTransition(() => setCollapsed(true))
  }, [storageKey])

  const toggle = () => {
    setCollapsed((current) => {
      const next = !current
      safeSet(storageKey, String(next))
      return next
    })
  }

  return (
    <div className="flex min-h-0 shrink-0 flex-col">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="flex items-center gap-1.5 px-1 py-1 text-left text-[11px] font-medium tracking-wide text-muted uppercase transition-colors hover:text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ChevronDown
          aria-hidden="true"
          size={12}
          className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
        />
        {label}
      </button>

      {!collapsed && <div className="min-h-0">{children}</div>}
    </div>
  )
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Collapse state is a convenience, not data — a blocked store just means
    // it resets next visit.
  }
}
