/**
 * Progress and pace for goals.
 *
 * A goal's contributions are expense occurrences carrying its id — see
 * `Transaction.goalId`. Progress is a simple sum of those; pace is the
 * all-time average contribution rate since the goal's start date, projected
 * forward to an expected completion date. There is no attempt to weight
 * recent contributions more heavily: a goal a few weeks old does not have
 * enough history for that to mean anything, and a longer-running goal
 * self-corrects as more contributions land.
 */

import { addDays, daysBetween, type IsoDate } from './dates'
import type { Goal, Occurrence } from './types'

/**
 * Shortest span pace is averaged over, even when the goal is younger.
 *
 * A goal with one contribution the day it started has one day of real
 * history — averaging over that alone reads a single contribution as its
 * full monthly rate. Flooring the divisor at 90 days (roughly a quarter)
 * means a $100 contribution on day one projects as a modest per-month
 * figure rather than a spike, and softens toward the true average as real
 * history accumulates past this window.
 */
const MIN_PACE_WINDOW_DAYS = 90

export type GoalProgress = {
  goal: Goal
  contributedCents: number
  /** 0 to 1. Never exceeds 1, even past the target. */
  fraction: number
  reached: boolean
  /**
   * Cents per day, averaged over every day since the goal started, whether or
   * not a contribution landed that day. Undefined when there is no
   * contribution yet to measure a pace from.
   */
  paceCentsPerDay?: number
  /** Projected date the target is reached at the current pace. */
  projectedCompletion?: IsoDate
}

/**
 * Sums a goal's contributions and projects when it will be reached.
 *
 * @param goal - Goal to evaluate.
 * @param contributions - Occurrences already filtered to this goal's id.
 *   Only those on or before `today` count toward progress and pace — a
 *   future recurring contribution has not happened yet.
 * @param today - Day to measure pace and progress as of.
 * @returns The goal's progress, pace, and projected completion.
 */
export function goalProgress(
  goal: Goal,
  contributions: Occurrence[],
  today: IsoDate
): GoalProgress {
  const made = contributions.filter((occurrence) => occurrence.date <= today)
  const contributedCents = made.reduce((total, occurrence) => total + occurrence.amountCents, 0)
  const reached = contributedCents >= goal.targetCents
  const fraction = Math.min(1, goal.targetCents > 0 ? contributedCents / goal.targetCents : 0)

  if (made.length === 0) {
    return { goal, contributedCents, fraction, reached }
  }

  // Measured from the goal's start, not the first contribution, so a slow
  // start pulls the average pace down rather than being invisible. Floored
  // at MIN_PACE_WINDOW_DAYS so a goal a day or two old does not read a
  // single contribution as its full weekly or monthly rate.
  const elapsedDays = Math.max(MIN_PACE_WINDOW_DAYS, daysBetween(goal.start, today) + 1)
  const paceCentsPerDay = contributedCents / elapsedDays

  if (reached || paceCentsPerDay <= 0) {
    return { goal, contributedCents, fraction, reached, paceCentsPerDay }
  }

  const remainingCents = goal.targetCents - contributedCents
  const daysToGo = Math.ceil(remainingCents / paceCentsPerDay)
  const projectedCompletion = addDays(today, daysToGo)

  return { goal, contributedCents, fraction, reached, paceCentsPerDay, projectedCompletion }
}
