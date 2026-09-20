# Project Brief

**Project:** Expense Calendar
**Type:** Internal tool, self-directed
**Status:** Living document — see "How This Brief Is Maintained" below.
**Last updated:** 2026-09-20

## What This Is

A personal finance calendar for seeing upcoming income and expenses laid out by date. The main view is a full-month calendar showing what is coming in and what is going out, so it is easy to see at a glance whether a given stretch of days is tight or comfortable.

It is a planning tool, not an accounting tool. It shows what is scheduled to happen, not what actually happened. There is no reconciliation against a bank account and no tracking of whether a payment cleared.

## Who It Is For

Built by and for the project owner. Single user, no accounts, no sharing. There is no client on this project, so requirements are set by the owner directly.

## How This Brief Is Maintained

This project has no external client, so the usual rule that the brief is read-only does not apply — see `project-exceptions.md`. This file is a living document, edited directly as the project evolves, and is the single source of requirements.

Reasoning lives alongside the rules it explains, so a decision can be revisited without guessing why it was made. Git history is the record of what changed.

## Core Concepts

### Transaction

A scheduled movement of money. Every transaction is either **income** or **expense**, and carries an amount, a free-text label, and a recurrence rule.

**A label is the only descriptive field.** No categories, tags, or grouping. The calendar answers "what is happening and when", and category-level questions belong to the spend analysis that is out of scope here.

A transaction stores the *rule* for when it happens, not a list of dates. Occurrences are generated on the fly when a month is displayed. This means changing a rule immediately and correctly changes every future occurrence, with no stored dates left to migrate or fall out of sync.

### Recurrence

The recurrence system needs to handle real bill and income schedules, which vary widely:

- One-off, on a single date.
- Every N days.
- Weekly, or every N weeks, on a given weekday.
- Monthly, or every N months, on a given day of the month.
- **Semi-monthly** — twice a month on two given days, such as the 1st and the 15th.
- Yearly.

Every N months matters specifically — quarterly bills are common and a monthly-only model cannot express them.

Semi-monthly is its own rule rather than two separate monthly rules. This matters for pay: the owner is paid semi-monthly, and income periods derive from a single paycheck transaction, so that transaction has to be able to express the whole schedule on its own.

**Short months:** when a monthly rule targets a day that does not exist in a given month, the occurrence clamps to the last day of that month. A bill set to the 31st falls on Feb 28 (or Feb 29 in a leap year). Clamping is used rather than skipping so a payment is never silently hidden in months where the date does not exist.

**Series end:** a recurrence may run indefinitely or stop on an end date.

### Business Days

A transaction can be marked **business days only**. When an occurrence lands on a non-business day it shifts to the nearest one.

**A non-business day is a weekend or a payment-affecting holiday.** Not every holiday counts — see Holidays below.

Each transaction chooses its own shift direction:

- **Previous business day** — typical for pay. A paycheque due Saturday arrives Friday.
- **Next business day** — typical for bills that debit on the following business day.
- **No shift** — the default. The date stands regardless.

The direction is per transaction because one global rule would be wrong half the time: payroll generally moves backward and many debits move forward.

Shifting skips consecutive non-business days. A payment due on Christmas Day shifting backward passes over Boxing Day and the weekend to the previous working day.

**Order of operations:** short-month clamping happens first, then the business-day shift. A monthly bill on the 31st in a February ending on a Saturday clamps to Feb 28, then shifts to Feb 27. A forward shift may cross into the next month — that is allowed, and the occurrence belongs to the date it lands on.

A shifted occurrence shows its shift in the UI, so a payment on an unexpected date has a visible reason rather than looking like a bug.

**Collisions are kept.** Shifting can land two occurrences of the same series on one date — a weekly Saturday bill moving back to Friday where an occurrence already sits. Both are shown and both count toward totals. They are two real payments, and silently merging them would understate what is owed.

### Holidays

The calendar marks Canadian holidays: the **federal/national** set plus **Ontario** provincial holidays. Each is named on the calendar.

Every holiday carries a **payment-affecting** flag, and **only payment-affecting holidays count as non-business days.** A statutory holiday is not automatically a banking holiday, and shifting a bill off a day when banks are actually open would be wrong.

**Payment-affecting** — banks closed, payments do not process:

| Holiday | Rule |
|---|---|
| New Year's Day | Jan 1 |
| Family Day | 3rd Monday of February |
| Good Friday | Friday before Easter |
| Victoria Day | Monday before May 25 |
| Canada Day | Jul 1 |
| Civic Holiday | 1st Monday of August |
| Labour Day | 1st Monday of September |
| Thanksgiving | 2nd Monday of October |
| Christmas Day | Dec 25 |
| Boxing Day | Dec 26 |

**Marked but not payment-affecting** — shown on the calendar, no effect on dates:

| Holiday | Rule | Why not |
|---|---|---|
| Remembrance Day | Nov 11 | Ontario banks generally open |
| Truth and Reconciliation | Sep 30 | Federal institutions; most Ontario banks process normally |
| Easter Monday | Monday after Easter | Federal public service, not banks |

**This table is a best guess, not an authoritative source.** Which days a given bank processes payments is not uniformly documented and varies between institutions. Treat it as a starting point and correct it against actual experience — it is a plain data table, easy to change.

Dates are computed rather than stored year by year, so the calendar works in any year without maintenance. Most rules are trivial ordinal-weekday calculations. Good Friday and Easter Monday depend on Easter, which needs the standard ecclesiastical calculation — the only non-obvious piece.

### Occurrence Exceptions

Storing rules alone is not enough, because individual occurrences sometimes need to differ from the rule. The model follows the iCalendar approach: a recurrence rule plus a list of exceptions.

Deleting an occurrence offers three scopes:

- **This occurrence** — adds a skip exception for that date. The rule is unchanged.
- **This and all future** — sets the rule's end date to just before this occurrence, ending the series here.
- **All occurrences** — removes the transaction entirely.

"This and all future" ends the existing series rather than deleting it, so past occurrences stay visible in history.

### Editing Occurrences

Editing offers the same three scopes, and each maps onto the rules-plus-exceptions model:

- **This occurrence** — stores an override for that date: an exception carrying replacement values. The rule is unchanged, and every other occurrence keeps the original values.
- **This and all future** — **splits the series.** The original transaction gets an end date just before this occurrence. A new transaction is created starting at this occurrence, carrying the edited values. Past occurrences keep the old values; this one and everything after use the new ones.
- **All occurrences** — edits the transaction in place. Every occurrence changes, including past ones.

The split is what makes "this and all future" work. A rule has one set of values, so the only way for a series to have different values before and after a point is to be two series.

Two consequences worth knowing:

- A series edited several times becomes several linked transactions.
- Per-occurrence overrides on a split series stay with whichever segment covers their date.

**Splitting is invisible in the UI.** Editing an occurrence shows the values in effect for that occurrence and its recurrence rule — nothing about segments or when the series was last changed. The segmentation exists so past occurrences keep their old values; it is not something to manage or even be aware of.

The full history stays in the data, so a change view could be added later without a model change.

**Changing the recurrence rule itself** — not the amount or label, but the schedule — only supports **this and all future** or **all occurrences**. "Just this one" has no meaning when the thing being changed is the pattern. To move a single occurrence, edit its date as a per-occurrence override instead.

### Amounts and Currency

**Amounts are stored as integer minor units** — cents, not dollars. `12.34` is stored as `1234`.

Floating-point numbers cannot represent most decimal fractions exactly, so summing them drifts. A column of floats can total `284.99999999999994` instead of `285`. Integers avoid this completely. Conversion to a decimal happens only at display time.

- Amounts are always positive. Direction comes from the transaction type, not the sign.
- Single currency. No conversion or multi-currency support.
- Formatting uses the browser's `Intl.NumberFormat` with the user's locale.
- The currency code is a single configurable constant, defaulting to `CAD`.

### Dates and Time

All dates are local to the user. The app uses the browser's own timezone and never converts or normalises to UTC.

- "Today" means the user's current local date.
- A day cell holds everything on that local calendar date.
- Income periods run `00:00:00` to `23:59:59` in local time.

Because a transaction is a calendar date rather than a moment in time, dates are stored as plain `YYYY-MM-DD` strings, not as timestamps. A timestamp would shift across a timezone change and could move a bill to the wrong day.

### Income Period

An income period is the span between paychecks. It runs **from a payday through the day before the next payday**. If pay lands on the 1st and again on the 15th, the first period runs from the 1st through the 14th, and the second runs from the 15th until the day before the following payday.

Payday is the first day of its period, not the last. The paycheck that opens a period counts as income within it, so the period's total income is the money funding that stretch of days.

A period starts at `00:00:00` on its first day and ends at `23:59:59` on its last day. Periods are contiguous and never overlap.

Income periods are derived from a transaction marked as the paycheck, so the pay schedule lives in exactly one place and the periods cannot drift out of sync with the income they represent. The paycheck transaction is configurable through the UI.

**Boundaries follow the shifted date.** If the paycheck is business-days-only and an occurrence moves — pay due Sunday the 15th arriving Friday the 13th — the period boundary moves with it. That period starts on the 13th, and the previous one ends on the 12th.

Periods track when money actually arrives, not when it was nominally scheduled. A period boundary that ignored the shift would put a paycheque in the period before the one it starts, and the summary panel would show income landing in a period that had already closed.

**First run:** with no paycheck transaction defined there are no income periods, and the summary panel shows an empty state with a direct route to setting one up.

## Primary View

A large calendar showing one month at a time.

Requirements:

- The current month and year are clearly stated.
- Navigation to previous and following months.
- Each day cell shows the income and expenses scheduled for that day.
- Income and expenses are visually distinguishable, and not by colour alone.
- Past days are visually de-emphasised — slightly faded or lower contrast than upcoming days — while staying readable and meeting contrast requirements.
- Holidays are visually marked and named, with payment-affecting days distinguished from those that are informational only.

### Day Cell Contents

Each cell shows the day number, a **day total**, and the first few transactions for that day.

The day total is the net for that day — income minus expenses — so a glance across the grid shows which days are positive and which are negative. There is no running balance across days, and no time-of-day detail. A transaction belongs to a date, not an hour.

**Overflow:** cells are a fixed height and do not scroll. A day with more transactions than fit shows as many as it can plus a count of the rest, such as "+3 more". The full list lives in the day detail panel.

Cells do not scroll. A scroll container in each of ~35 cells would collide with the click and right-click handlers below, eat horizontal space in an already-tight cell, and still leave you reading one day at a time through a small box. A panel sized for reading does that job better. The grid stays a stable shape regardless of how busy a day is.

### Day Interaction

- **Left click** opens that day in the day detail panel.
- **Right click** opens a context menu. For now it has a single action: **Add transaction**. The menu is built to take more actions later.

The context menu is also reachable from the keyboard with the context-menu key or Shift+F10, which browsers deliver as the same event. Day cells are focusable and navigable with arrow keys.

Right click is a desktop convention and this is a desktop-first tool, but it is undiscoverable on its own, so it is never the only route to an action. The day detail panel carries an **Add transaction** button for the same purpose.

### Add/Edit Event Modal

Selecting "Add transaction" opens a modal for defining a transaction: type (income or expense), amount, label, date, recurrence, and business-day handling.

Business-day handling is a single control offering no shift (the default), shift to the previous business day, or shift to the next.

**The modal does not close on a backdrop click.** A stray click should never discard a partly entered transaction, and a backdrop click is the only realistic way that happens.

It closes via the X button or the Escape key. Escape is a deliberate keypress carrying no accidental-loss risk, and keyboard and screen reader users rely on it — blocking both exits would be an accessibility problem for no extra protection.

Standard dialog behaviour applies: focus moves into the modal on open, is trapped while open, and returns to the triggering element on close.

## Pay Period Summary Panel

A panel to the right of the calendar showing the financial shape of a single pay period.

This is the first of the anticipated side panels and is **in scope**.

### Which Period Is Shown

The panel defaults to the pay period containing today. Navigating the calendar to another month moves the panel to a period within that month, so the two views stay in agreement.

### The Chart

A **diverging bar chart**, one bar per day across the full pay period, including days with no activity.

- Income rises above a centre baseline; expenses fall below it.
- A day with both shows a bar in each direction.
- Empty days keep their slot on the axis, so the spacing reflects real time rather than only the days that happen to have transactions.

A diverging bar is the right form here because the reader's job is polarity — money in versus money out against a zero line — rather than comparing categories.

**Colours** (validated against the dark surface `#1a1a19` for colour-vision deficiency and contrast):

- Income: `#3987e5` (blue)
- Expense: `#e66767` (red)

These were run through a palette validator rather than picked by eye, and pass all six checks: lightness band, chroma floor, colour-vision separation (worst case ΔE 19.2 under protanopia against a ≥8 target), normal-vision separation, and contrast against the surface. An earlier, lighter blue failed the lightness band for a dark surface.

**Do not substitute other colours without re-running the validator.**

Direction above/below the baseline already distinguishes income from expense, so meaning never rests on colour alone.

**Marks and interaction:**

- Thin bars with 4px rounded data-ends anchored to the baseline.
- Recessive grid and axes; a slightly stronger zero line.
- Hovering a day shows a tooltip listing that day's transactions with amounts.
- Values are not printed on every bar. Label selectively.

### Totals

Below the chart, for the displayed period:

- **Total income**
- **Total expenses**
- **Remaining expenses** — expenses from today to the end of the period, **including anything due today**. A bill due today has not been paid yet as far as the calendar knows, so it still counts as owing.

The third figure only means "remaining" inside the current period. On a past or future period it shows that period's full expense total instead, relabelled to match — so the footer always has three figures and never changes shape as you navigate.

## Day Detail Panel

A panel below the pay period summary, in the same right-hand column, showing everything for one selected day.

Selecting a day in the calendar fills this panel. Both panels stay visible at once, so a day can be read without losing the period context above it.

Contents:

- The date, written out.
- The holiday name, if the day is one, and whether it affects payment processing.
- The day's net total.
- Every transaction for that day, with label, amount, and whether it is income or expense.
- Whether a transaction is a one-off or part of a series, and if recurring, its rule in plain words — "monthly on the 15th".
- For a shifted occurrence, its original date and why it moved — "moved from Sat 15 Mar".
- An **Add transaction** button.
- Per-transaction **edit** and **delete** actions.

This panel is where the edit and delete scopes are chosen. Selecting either action on a recurring transaction prompts for the scope — this occurrence, this and all future, or all occurrences. A one-off transaction skips the prompt, since all three scopes mean the same thing.

The panel scrolls if a day has more transactions than fit. One scroll container in a panel sized for reading is fine; it was scroll containers in every grid cell that were the problem.

When no day is selected, the panel shows today by default.

## Design Direction

Dark UI throughout. The reference point is Google Maps' dark theme — dark surfaces, restrained colour, content carrying the visual weight rather than chrome.

- Dark theme only. No light mode.
- Colour is used sparingly and purposefully, largely to separate income from expense.
- Layout is built around the calendar as the dominant element.

**Desktop is the primary target.** The tool is used at a desk, and a month grid with several transactions per day suits a large screen.

Mobile is not a target. Smaller screens are not designed for and no responsive layout work is planned. A dense month grid plus a two-panel side column does not reduce to a phone without a real redesign, and that is not a use case here.

## Technical Requirements

- Next.js with the App Router, TypeScript, deployed on Vercel.
- **No database.** All data is stored locally in the browser.
- **No authentication.** No login wall, no accounts.
- No backend persistence of any kind. The deployed app is a static client-side tool.

### Data Durability and Backup

All data lives in browser storage, so it is tied to one browser on one device. There is no server-side copy to fall back on, and storage is cleared by ordinary things — cleanup tools, privacy settings, some extensions — not just a deliberate wipe.

**JSON export and import are in scope** as the mitigation:

- **Export** downloads all data as a single JSON file.
- **Import** loads a previously exported file.
- Import **replaces** all existing data and asks for confirmation first. It does not merge — merging raises duplicate-detection questions that are not worth the complexity here.
- The export includes a schema version number so older files can be recognised, and migrated, if the data model changes.

This doubles as the way to move data between devices or browsers.

## Layout and Future Scope

The calendar is the primary view. A right-hand column holds the pay period summary on top and the day detail panel beneath it.

Further panels are anticipated — upcoming-transaction lists, longer-range summaries. Those are **out of scope for now**, but the right column should take another panel without being rebuilt.

A semi-monthly pay period is roughly 15 days, so the summary chart holds about 15 bars. That fits a side panel comfortably.

## Out of Scope

- Any backend, database, or server-side storage.
- Authentication, accounts, or multi-user support.
- Light mode.
- Panels beyond the pay period summary and day detail (anticipated, but not built yet).
- Multi-currency support or currency conversion.
- Merging on import. Import replaces all data.
- Bank integration, transaction import, or reconciliation against real account activity.
- Reporting, budgeting targets, or historical spend analysis.
- Mobile and small-screen layouts.

## Open Questions

_None outstanding._
