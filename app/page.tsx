import { ArrowRight } from 'lucide-react'
import { Button } from './_components/ui/Button'

export default function Home() {
  return (
    <main className="flex flex-1 items-center py-24">
      <div className="mx-auto w-full max-w-container px-5 md:px-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.01em] text-ink text-balance md:text-[64px]">
            Expense Calendar
          </h1>
          <p className="mt-5 font-body text-lg leading-[1.65] text-body text-pretty">
            Track expenses on a calendar. This placeholder page is here so the project builds and
            runs; replace it once the real requirements are decided.
          </p>
          {/* Icons compose through children rather than a dedicated icon prop. */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href="/">
              Primary action
              <ArrowRight aria-hidden="true" size={18} />
            </Button>
            <Button href="/" variant="outline">
              Secondary action
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
