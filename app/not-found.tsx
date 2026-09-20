import type { Metadata } from 'next'
import { Button } from './_components/ui/Button'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
}

/** Renders the branded 404 page for missing routes. */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center py-24">
      <div className="mx-auto w-full max-w-container px-5 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-[13px] font-medium uppercase tracking-[0.24em] text-accent">
            404
          </p>
          <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.1] text-ink md:text-[44px]">
            Page not found
          </h1>
          <p className="mt-5 font-body text-lg leading-[1.7] text-body">
            The page you are looking for may have been moved or no longer exists.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button href="/">Return home</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
