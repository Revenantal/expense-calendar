# Core Build

Initial build of the expense calendar, from data model to working UI.

Requirements live in `docs/project/project-brief.md`. This plan does not restate them; it covers how they get built.

**Status:** Complete. All eight phases done, 311 tests passing.

## Progress

- **Phase 1 — Dates, holidays, recurrence.** Done. `0103896`
- **Phase 2 — Money, types, storage.** Done. `817718c`
- **Phase 3 — Income periods.** Done. `68e5f2a`
- **Phase 4 — Dark theme tokens.** Done. `e632265`
- **Phase 5 — Provider and calendar.** Done. `c319e39`, `23d6c81`
- **Phase 6 — Transaction modal.** Done. `e29ff7d`
- **Phases 7 and 8 — Panels, export/import.** Done. `00b369f`

## What The Build Changed

Decisions made while building that the plan did not anticipate.

- **Occurrences belong to the date they land on**, not the date they were
  scheduled. Expansion generates over a widened window and filters on the
  final date, so a payment scheduled April 1 that shifts back to March 31
  appears in March and not April. The first implementation lost such
  occurrences entirely; the Phase 1 checkpoint caught it.
- **A `validation.ts` module was added.** Storage and import both check
  untrusted data field by field, and duplicating that would let them drift.
- **The chart's arms scale independently.** A shared scale is more honest in
  principle, but a paycheck is often 20x any single bill, so it fills its arm
  and flattens every expense into an invisible sliver. Each arm scales to its
  own peak and the axis states both, which keeps the choice explicit.
- **Amount formatting needed a symbol-free variant.** `CAD` renders as `CA$`
  in some locales, so stripping a leading `$` from a formatted string silently
  left the `CA` behind.

## What Running The App Caught

Three bugs passed the test suite and failed in a browser. Worth remembering
that a green suite is not the same as a working screen.

- Date formatters rendered a day early. They build UTC instants, which `Intl`
  then rendered in local time — the same drift plain date strings exist to
  prevent. Fixed with `timeZone: 'UTC'` and a regression test.
- A `<label>` wrapping a `<select>` absorbs the option text into the field's
  accessible name, so "Repeats" announced as "Repeats Once Every N days
  Weekly…". jsdom matched it; a real browser did not.
- The month grid stopped short of the viewport with dead space below, from a
  broken flex height chain.

## Manual Verification

Run in a browser against the real app: empty first run, adding a paycheck,
periods appearing, a business-day shift landing on the correct day,
persistence across reload, an edit splitting a series, a scoped delete, and an
export/import round trip with a junk file rejected.

## Goal

A working single-page calendar: add transactions with recurrence and business-day rules, see them laid out by month with day totals, and read a pay period summary alongside. Data persists locally and can be exported and imported.

## Approach

Build inward-out. Date and recurrence logic first, since everything reads from it, then storage, then UI.

The recurrence engine is where quiet bugs live — clamping, shifting, and period boundaries interact, and a wrong answer looks like a plausible date rather than a crash. It gets built and tested as plain functions before any UI exists to hide behind.

### No date library

None is installed, and the arithmetic needed is narrow: add days and months, find ordinal weekdays, compute Easter. Roughly 150 lines over `YYYY-MM-DD` strings.

Most date libraries are timezone-aware in ways that fight the brief's plain-local-date rule — they parse `2026-03-15` into an instant, which can shift a day either direction. Strings cannot drift. Revisit only if the hand-rolled version starts sprawling.

### Rendering model

All data lives in `localStorage`, a browser-only API, so the interactive tree is client-side. `app/page.tsx` stays a Server Component rendering static shell and metadata; it renders one client provider that owns everything below.

This is the documented pattern in `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`: Server Components by default, `'use client'` where state, event handlers, or browser APIs are needed.

### State

One React context provider holds transactions and the selected date, persists changes to `localStorage`, and exposes add, edit, and delete. The three views read from it.

Context rather than prop drilling — the calendar, summary, and day panel are siblings needing the same data, and threading props through the tree would be noisy. Context rather than a state library — the brief discourages added dependencies and there is one store with a handful of actions.

### Recomputation

Occurrences expand on demand for the visible range, memoized on transactions plus range. A few dozen transactions over one month is trivial work, so no cache and no invalidation bugs.

### Testing against a fixed clock

Remaining-expenses, past-day fading, and the default pay period all depend on today's date. **Any test touching "today" pins the clock**:

```ts
beforeEach(() => vi.setSystemTime(new Date('2026-03-15T12:00:00')))
afterEach(() => vi.useRealTimers())
```

Tests written against the real clock pass on the day they are written and fail later — a suite that rots quietly is worse than no suite. Functions that need the current date take it as an argument rather than calling `new Date()` internally, so most logic stays testable without touching the clock at all.

## File Layout

```txt
app/
  page.tsx                      Server Component: shell, metadata
  _lib/
    dates.ts                    Date arithmetic over YYYY-MM-DD strings
    dates.test.ts
    holidays.ts                 Federal + Ontario, payment-affecting flags, Easter
    holidays.test.ts
    business-days.ts            Non-business-day checks, shift previous/next
    business-days.test.ts
    recurrence.ts               Rule expansion, clamping, exceptions
    recurrence.test.ts
    income-periods.ts           Period derivation and totals
    income-periods.test.ts
    money.ts                    Integer-cent parsing and formatting
    money.test.ts
    storage.ts                  localStorage read/write, schema version
    storage.test.ts
    transfer.ts                 JSON export and import
    transfer.test.ts
    types.ts                    Shared data types
  _components/
    calendar/
      CalendarProvider.tsx      'use client' — state, persistence, actions
      MonthGrid.tsx             'use client' — grid, month navigation
      DayCell.tsx               'use client' — one day, click handling
      DayContextMenu.tsx        'use client' — right-click menu
    panels/
      PayPeriodPanel.tsx        'use client' — chart and totals
      PayPeriodChart.tsx        'use client' — diverging bars, tooltips
      DayDetailPanel.tsx        'use client' — selected day, actions
    transaction/
      TransactionModal.tsx      'use client' — add/edit form
      RecurrenceFields.tsx      'use client' — rule-specific inputs
      ScopePrompt.tsx           'use client' — this / future / all
    ui/                         Existing shared primitives
```

Logic in `_lib/` is plain functions with no React, so it is testable without rendering. Tests sit beside the code they cover, per `docs/development/coding-practices.md`.

## Data Model

Sketched here because these shapes constrain every phase. Exact field names may shift during Phase 1; the structure should not.

### Recurrence rules

A discriminated union on `type`. Each rule carries only the fields it needs, so an invalid combination — a weekly rule with a day-of-month — cannot be represented.

```ts
type RecurrenceRule =
  | { type: 'once'; date: IsoDate }
  | { type: 'daily'; interval: number }
  | { type: 'weekly'; interval: number; weekday: Weekday }
  | { type: 'monthly'; interval: number; dayOfMonth: DayOfMonth }
  | { type: 'semiMonthly'; days: [DayOfMonth, DayOfMonth] }
  | { type: 'yearly'; month: number; day: number }

type IsoDate = string // YYYY-MM-DD
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 1–31, or the last day of whatever month it lands in. */
type DayOfMonth = number | 'last'
```

**`DayOfMonth` allows `'last'`** because "paid on the last day of the month" is a real schedule that a number cannot express. `31` clamps to Feb 28 but means the 30th in a 30-day month, which is wrong for anyone actually paid month-end. `'last'` resolves to whatever the month ends on.

Rules carry no `start` or `end`. The transaction owns both — see below.

### Transactions

```ts
type Transaction = {
  id: string // crypto.randomUUID()
  seriesId: string // crypto.randomUUID(), shared across split segments
  kind: 'income' | 'expense'
  label: string
  amountCents: number // always positive
  rule: RecurrenceRule
  start: IsoDate // first date the rule may produce
  end?: IsoDate // last date, inclusive; absent means open-ended
  businessDayShift: 'none' | 'previous' | 'next'
  isPaycheck?: boolean
  exceptions: OccurrenceException[]
}
```

**`start` and `end` live only here, never on the rule.** Storing a range in two places means expansion has to decide which wins, and "end the series" silently failing is exactly the bug that produces. The rule describes the _pattern_; the transaction describes the _span_ it applies over.

For a `once` rule, `start` and `rule.date` are the same date. Expansion reads `start`.

`seriesId` is how a split series stays one logical thing. Editing "this and all future" sets `end` on one transaction and creates another with the same `seriesId`. The UI never shows it — per the brief, splitting is invisible — but it is what lets the app treat segments as one series.

**IDs come from `crypto.randomUUID()`**, available in all target browsers and in Node for tests. Import replaces all data, so IDs from an imported file are used as-is; there is nothing to collide with.

### Occurrence exceptions

```ts
type OccurrenceException =
  | { type: 'skip'; date: IsoDate }
  | {
      type: 'override'
      date: IsoDate
      label?: string
      amountCents?: number
      movedTo?: IsoDate
    }
```

Exceptions live on their transaction rather than in a separate collection. They are meaningless without it, and deleting a transaction should take them with it.

`date` is always the date the rule produced after clamping but before any shift — otherwise changing a shift direction would orphan every exception.

`movedTo` handles the brief's "move a single occurrence" case: editing one occurrence's date. An occurrence with `movedTo` set is **not** business-day shifted; see the pipeline below.

### Expanded occurrences

What expansion returns. Not stored.

```ts
type Occurrence = {
  transactionId: string
  seriesId: string
  date: IsoDate // final date the occurrence lands on
  scheduledDate: IsoDate // post-clamp, pre-shift; what the rule produced
  displacement?: 'shifted' | 'moved' // why date differs from scheduledDate
  kind: 'income' | 'expense'
  label: string
  amountCents: number
  isPaycheck: boolean
}
```

When `date` differs from `scheduledDate`, `displacement` says why: `'shifted'` for an automatic business-day move, `'moved'` for a manual per-occurrence edit. The day panel wording differs — "moved from Sat 15 Mar" for a shift, a plainer note for a deliberate move — and without this field the two are indistinguishable.

`scheduledDate` is also the key an exception matches on, so the panel can find the exception behind a displaced occurrence.

### Stored shape

```ts
type StoredData = {
  schemaVersion: number
  transactions: Transaction[]
  currency: string // 'CAD'
}
```

`schemaVersion` is written from the first release, not added later — retrofitting a version onto unversioned files means guessing at their shape.

## Expansion Pipeline

The order matters and is specified in the brief. Each step is a separate function so each can be tested alone.

```txt
transaction + range
  → generate raw dates         (rule type decides the stride;
                                bounded by start, end, and the range)
  → resolve day-of-month        ('last' → the month's final day)
  → clamp short months          (Feb 31 → Feb 28)
  → drop skip exceptions        (matched on the date so far)
  → apply override values       (matched on the date so far)
  → if the override moved it    → use movedTo, skip shifting
    otherwise                   → apply business-day shift
  → Occurrence[]
```

Shifting after clamping is what the brief specifies: a monthly-on-the-31st bill in a February ending Saturday clamps to the 28th, then shifts to the 27th.

**A manually moved occurrence is not shifted.** If an override sets `movedTo`, that date stands even if it lands on a weekend or holiday. The move was a deliberate choice about one occurrence; applying an automatic rule on top would override an explicit instruction with a general one.

This is why overrides are matched and applied **before** shifting rather than after. Matching on the post-clamp, pre-shift date also means changing a transaction's shift direction never orphans its exceptions — the date they key on does not move.

Collisions are kept. Two occurrences landing on one date are two real payments.

## Phase 1 — Dates, holidays, recurrence

Pure functions. No React. The foundation everything else reads.

- [ ] `dates.ts`: parse, format, add days, add months, compare, last day of month, weekday, ordinal weekday (nth Monday of a month).
- [ ] `dates.test.ts`: month-end arithmetic, leap years, year boundaries.
- [ ] `holidays.ts`: Easter computation; the ten payment-affecting and three informational holidays from the brief, generated for any year.
- [ ] `holidays.test.ts`: known Easter dates across several years; correct holiday set for a sample year; payment-affecting flags.
- [ ] `business-days.ts`: is-business-day, shift previous, shift next, skipping consecutive non-business days.
- [ ] `business-days.test.ts`: a normal weekend, Christmas through Boxing Day and a weekend, a shift crossing a month boundary.
- [ ] `recurrence.ts`: expansion for all six rule types, then the pipeline above.
- [ ] `recurrence.test.ts`: each rule type; the 31st in February and in a leap year; `'last'` day-of-month across 28, 30, and 31-day months; semi-monthly with `'last'` as the second day; a skip exception; a value override; a `movedTo` override landing on a weekend and staying there; an exception still matching after the shift direction changes; two occurrences colliding on one date; a series with an `end`; a series with no `end` bounded only by the query range.

**Checkpoint:** expansion is correct for every edge case in the brief before any UI is built on it.

## Phase 2 — Money, types, storage

- [ ] `types.ts`: the shapes above.
- [ ] `money.ts`: decimal string to integer cents and back; `Intl.NumberFormat` with `CAD`.
- [ ] `money.test.ts`: rounding, values that would drift as floats, formatting.
- [ ] `storage.ts`: read and write with schema version; tolerate absent or malformed data rather than throwing; report write failures to the caller.
- [ ] `storage.test.ts`: round trip, empty storage, unknown version, corrupt JSON, a write that throws.

**A failed write must surface.** `localStorage.setItem` throws on quota exhaustion, and in Safari private mode it can throw regardless of size. A silently swallowed failure means the app shows data that was never saved and loses it on reload — the worst outcome for the only copy.

Write returns a success/failure result rather than throwing, and the provider surfaces a failure in the UI. Unlikely at this data size, but the cost of handling it is small and the cost of not handling it is silent data loss.

- [ ] `transfer.ts`: export to a JSON blob; import with full validation.
- [ ] `transfer.test.ts`: round trip; a file that is not ours; valid `schemaVersion` with malformed transactions; a truncated file; an unknown rule type.

**Import validates every transaction, not just the envelope.** Import replaces all existing data, so accepting a bad file destroys the only copy. A file can carry a correct `schemaVersion` and still hold garbage — checking the wrapper is not enough.

Validation walks each transaction: required fields present, `kind` and `businessDayShift` within their unions, `amountCents` a positive integer, `rule.type` known and carrying the fields that type requires, dates matching `YYYY-MM-DD`. Anything failing rejects the **whole import** with a message naming the problem. A partial import would leave the app in a state neither the file nor the previous data describes.

## Phase 3 — Income periods

- [ ] `income-periods.ts`: derive periods from the paycheck transaction, boundaries following shifted dates; find the period containing a date; totals for income, expenses, and the third figure — remaining expenses on the current period, full-period expenses otherwise, each reporting which it is so the panel can label it.
- [ ] `income-periods.test.ts`: semi-monthly periods; a shifted boundary moving the period start; a period spanning a month end; remaining-expenses including today; the third figure falling back on a past and a future period; no paycheck defined.

The current-versus-other distinction is computed here, not in the panel. The panel should render what it is given rather than re-deriving which period is current.

**Checkpoint:** all logic complete and tested. UI work starts against a known-good core.

## Phase 4 — Dark theme tokens

- [ ] Replace the light placeholders in the `@theme inline` block in `app/globals.css`, and the `:root` `--background`/`--foreground` pair above it, with dark surfaces and ink.
- [ ] Update the matching metadata in `app/_design/tokens.ts` so the registries do not drift from the runtime values.
- [ ] Add the validated chart colours from the brief.
- [ ] Verify contrast for de-emphasised past days, holiday markers, and chart bars against the dark surface.

This project uses Tailwind 4, where theme values are declared in the `@theme inline` block in `globals.css` rather than a `tailwind.config` file. `tokens.ts` holds only human-readable metadata; changing it alone changes nothing at runtime.

Tokens come before components so nothing is built against values about to change.

## Phase 5 — Provider and calendar

- [ ] `CalendarProvider.tsx`: transactions, selected date, visible month; loads from storage on mount, persists after add/edit/delete; surfaces a write failure; add/edit/delete actions.

Persistence is triggered by the three data actions, not by a general "state changed" effect. Selected date and visible month are view state and are not persisted — writing on every navigation would mean a storage write per month click for nothing.

- [ ] `MonthGrid.tsx`: grid with month and year heading, previous/next navigation, memoized expansion for the visible range.
- [ ] `DayCell.tsx`: day number, net total, first few transactions, "+N more"; past de-emphasis; holiday marking.
- [ ] Keyboard navigation across cells; left click selects; right click and the context-menu key open the menu.
- [ ] `DayContextMenu.tsx`: positioned menu with "Add transaction".
- [ ] Tests for day-total calculation and for cell overflow behaviour.

## Phase 6 — Transaction modal

- [ ] `TransactionModal.tsx`: type, amount, label, date, recurrence, business-day handling; X and Escape close, backdrop does not; focus trap and focus return.
- [ ] `RecurrenceFields.tsx`: fields switching on rule type.
- [ ] `ScopePrompt.tsx`: this / this and future / all; skipped for one-offs; rule changes offer only future and all.
- [ ] Edit paths: override, split series, edit in place.
- [ ] Tests: focus behaviour, close behaviour, amount conversion, the split producing two transactions with one `seriesId`.

## Phase 7 — Panels

- [ ] `DayDetailPanel.tsx`: date, holiday name and payment-affecting flag, net total, full transaction list with recurrence in plain words and shift origin; add, edit, delete.
- [ ] `PayPeriodChart.tsx`: diverging bars, one per day including empty days, income above and expenses below, 4px rounded data-ends, recessive grid, stronger zero line, hover tooltips.
- [ ] `PayPeriodPanel.tsx`: chart plus the three totals, relabelled on non-current periods; empty state when no paycheck exists.
- [ ] Right column holding both panels beside the calendar.
- [ ] Tests for totals and for the relabelling.

The chart is hand-rolled SVG. A charting library would be a large dependency for one fixed chart, and the brief already specifies the mark geometry.

## Phase 8 — Finishing

- [ ] Export and import controls, with import confirming before replacing.
- [ ] Page metadata, one clear `h1`.
- [ ] `npm run format:check`, `lint`, `test:run`, `build`.
- [ ] Manual pass: empty first run; a busy day overflowing a cell; a shifted payment showing its origin; a period boundary on a shifted paycheck; an export/import round trip.

## Out Of Scope

Per the brief: mobile layouts, light mode, categories, multi-currency, merging on import, backend or auth, and any panel beyond the two specified.

## Risks

- **Recurrence edge cases.** The most likely source of silent wrong answers. Mitigated by testing the pipeline before any UI exists.
- **Holiday payment-impact data is a best guess.** The brief says so. It is a plain table, easy to correct once real behaviour is known.
- **Hand-rolled date arithmetic.** Deliberate, but it is real code that can be wrong. Phase 1 tests are what make it safe.

## Decisions Made During This Phase

_None yet. Decisions that change requirements go in the brief, not here._
