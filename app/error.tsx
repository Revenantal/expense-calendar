'use client'

import { Button } from './_components/ui/Button'

type ErrorPageProps = {
  error: Error & { digest?: string }
  retry: () => void
}

/** Renders the branded fallback UI for unexpected rendering errors. */
export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <main className="flex flex-1 items-center py-24">
      <div className="mx-auto w-full max-w-container px-5 md:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-[13px] font-medium uppercase tracking-[0.24em] text-accent">
            Error
          </p>
          <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.1] text-ink md:text-[44px]">
            Something went wrong
          </h1>
          <p className="mt-5 font-body text-lg leading-[1.7] text-body">
            An unexpected error occurred. Please try again, or return to the homepage.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button onClick={() => retry()}>Try again</Button>
            <Button href="/" variant="outline">
              Return home
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
