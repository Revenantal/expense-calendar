'use client'

import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { exportFilename, exportToJson, importFromJson } from '@/app/_lib/transfer'

import { useCalendar } from './CalendarProvider'

/**
 * Export and import controls.
 *
 * Browser storage is the only copy of the data and is cleared by ordinary
 * things — cleanup tools, privacy settings, some extensions. Export is the
 * only recovery path, and doubles as the way to move between devices.
 */
export function DataControls() {
  const { transactions, replaceAll } = useCalendar()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string }>()

  const handleExport = () => {
    const blob = new Blob([exportToJson(transactions)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = exportFilename()
    link.click()

    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: 'Exported.' })
  }

  const handleFile = async (file: File) => {
    const result = importFromJson(await file.text())

    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }

    // Import replaces everything, so it is worth a confirmation even though
    // the file has already been validated.
    const count = result.data.transactions.length
    const confirmed = globalThis.confirm(
      `Replace all ${transactions.length} transactions with the ${count} in this file? This cannot be undone.`
    )
    if (!confirmed) return

    replaceAll(result.data.transactions)
    setMessage({ tone: 'ok', text: `Imported ${count} transactions.` })
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span
          role="status"
          className={`text-[11px] ${message.tone === 'error' ? 'text-expense' : 'text-muted'}`}
        >
          {message.text}
        </span>
      )}

      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1 rounded-lg bg-panel px-2.5 py-1.5 text-[11px] text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Download aria-hidden="true" size={12} />
        Export
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 rounded-lg bg-panel px-2.5 py-1.5 text-[11px] text-body transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Upload aria-hidden="true" size={12} />
        Import
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Import data file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          // Reset so choosing the same file twice fires a change event.
          event.target.value = ''
        }}
      />
    </div>
  )
}
