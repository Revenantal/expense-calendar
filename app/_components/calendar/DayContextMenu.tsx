'use client'

import { Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { formatShortDate } from '@/app/_lib/calendar-grid'
import type { IsoDate } from '@/app/_lib/types'

type DayContextMenuProps = {
  date: IsoDate
  position: { x: number; y: number }
  onAddTransaction: (date: IsoDate) => void
  onClose: () => void
}

/**
 * Actions for a day, opened by right click or the context-menu key.
 *
 * Built to take more actions later; for now it offers only adding. Right
 * click is undiscoverable on its own, so this is never the only route to an
 * action — the day detail panel carries the same Add button.
 */
export function DayContextMenu({ date, position, onAddTransaction, onClose }: DayContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Move focus into the menu so it can be driven and dismissed by keyboard.
  useEffect(() => {
    menuRef.current?.querySelector('button')?.focus()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Keep the menu on screen when opened near an edge.
  const left = Math.min(position.x, globalThis.innerWidth - 220)
  const top = Math.min(position.y, globalThis.innerHeight - 120)

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${formatShortDate(date)}`}
      style={{ left, top }}
      className="fixed z-50 min-w-[200px] rounded-2xl bg-raised py-1.5 shadow-overlay"
    >
      <p className="px-3 py-1.5 text-[11px] text-muted">{formatShortDate(date)}</p>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onAddTransaction(date)
          onClose()
        }}
        className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-body hover:bg-line focus-visible:bg-line focus-visible:outline-none"
      >
        <Plus aria-hidden="true" size={14} />
        Add transaction
      </button>
    </div>
  )
}
