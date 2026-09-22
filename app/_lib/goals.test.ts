import { describe, expect, it } from 'vitest'

import { goalProgress } from './goals'
import type { Goal, Occurrence } from './types'

const goal: Goal = {
  id: 'goal-1',
  label: 'Emergency fund',
  targetCents: 300_000,
  start: '2026-01-01',
}

function contribution(date: string, amountCents: number): Occurrence {
  return {
    transactionId: 'txn-1',
    seriesId: 'series-1',
    date,
    scheduledDate: date,
    kind: 'expense',
    label: 'Emergency fund',
    amountCents,
    isPaycheck: false,
    goalId: goal.id,
  }
}

describe('goalProgress', () => {
  it('reports zero progress with no contributions', () => {
    const progress = goalProgress(goal, [], '2026-01-15')

    expect(progress.contributedCents).toBe(0)
    expect(progress.fraction).toBe(0)
    expect(progress.reached).toBe(false)
    expect(progress.paceCentsPerDay).toBeUndefined()
    expect(progress.projectedCompletion).toBeUndefined()
  })

  it('sums contributions up to and including today', () => {
    const contributions = [
      contribution('2026-01-01', 10_000),
      contribution('2026-01-08', 10_000),
      contribution('2026-01-15', 10_000),
    ]
    const progress = goalProgress(goal, contributions, '2026-01-15')

    expect(progress.contributedCents).toBe(30_000)
    expect(progress.fraction).toBeCloseTo(0.1, 5)
  })

  it('ignores contributions dated after today', () => {
    const contributions = [contribution('2026-01-01', 10_000), contribution('2026-02-01', 10_000)]
    const progress = goalProgress(goal, contributions, '2026-01-15')

    expect(progress.contributedCents).toBe(10_000)
  })

  it('averages pace over days elapsed since the goal started, not since the first contribution', () => {
    // One contribution, one hundred days after start: pace is 100/101 days,
    // not 100/1 — past the 90-day floor, so the real elapsed span applies.
    const contributions = [contribution('2026-04-11', 10_000)]
    const progress = goalProgress(goal, contributions, '2026-04-11')

    expect(progress.paceCentsPerDay).toBeCloseTo(10_000 / 101, 2)
  })

  it('floors the averaging window at 90 days, so an early contribution does not read as a full monthly rate', () => {
    // A goal one day old with a single $100 contribution should not average
    // to $100/day — it should read as roughly $100 over 90 days.
    const contributions = [contribution('2026-01-01', 10_000)]
    const progress = goalProgress(goal, contributions, '2026-01-01')

    expect(progress.paceCentsPerDay).toBeCloseTo(10_000 / 90, 2)
  })

  it('projects a completion date at the current pace', () => {
    // Two contributions, measured on day 120 — past the 90-day floor, so
    // the real elapsed span applies.
    const contributions = [contribution('2026-01-01', 10_000), contribution('2026-01-08', 10_000)]
    const progress = goalProgress(goal, contributions, '2026-04-30')

    // Pace: 20,000 / 120 days ≈ 166.67/day. Remaining: 280,000.
    // Days to go: ceil(280000 / 166.67) = 1680 days from 2026-04-30.
    expect(progress.paceCentsPerDay).toBeCloseTo(20_000 / 120, 2)
    expect(progress.projectedCompletion).toBeDefined()
    expect(progress.projectedCompletion! > '2026-04-30').toBe(true)
  })

  it('marks a goal reached once contributions meet the target, and caps fraction at 1', () => {
    const contributions = [contribution('2026-01-01', 300_000), contribution('2026-01-08', 50_000)]
    const progress = goalProgress(goal, contributions, '2026-01-08')

    expect(progress.reached).toBe(true)
    expect(progress.fraction).toBe(1)
    expect(progress.projectedCompletion).toBeUndefined()
  })
})
