import { CalendarApp } from './_components/calendar/CalendarApp'

/**
 * The calendar page.
 *
 * Stays a Server Component: the interactive tree below needs browser APIs and
 * state, so it is marked as client, but the shell and metadata do not.
 */
export default function Home() {
  return (
    <main className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden p-4">
      <h1 className="sr-only">Expense Calendar</h1>
      <CalendarApp />
    </main>
  )
}
