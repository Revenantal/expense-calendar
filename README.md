# Expense Calendar

A personal finance calendar for seeing upcoming income and expenses laid out by date. The main view is a full-month calendar showing what is coming in and what is going out, so it is easy to see at a glance whether a given stretch of days is tight or comfortable.

It is a planning tool, not an accounting tool. It shows what is scheduled to happen, not what actually happened — there is no reconciliation against a bank account and no tracking of whether a payment cleared.

Built by and for the project owner as a single-user tool: no accounts, no login, no server-side storage. All data lives in the browser, with JSON export/import for backup and moving between devices.

## Features

- **Month calendar** — income and expenses shown per day, with a net total per cell and past days de-emphasised.
- **Recurring transactions** — one-off, daily, weekly, monthly, semi-monthly, and yearly rules, including last-day-of-month and short-month clamping.
- **Business-day shifting** — transactions can shift to the nearest business day around weekends and payment-affecting holidays.
- **Pay period summary** — a diverging bar chart of income vs. expenses across the current pay period, with total income, total expenses, and remaining expenses.
- **Day detail panel** — every transaction for a selected day, with add/edit/delete and recurrence-scope prompts (this occurrence, this and future, or all).
- **Dark UI**, desktop-first, no light mode.

See `docs/project/project-brief.md` for the full requirements and the reasoning behind them.

## Technology

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- lucide-react
- Vitest and React Testing Library
- ESLint
- Prettier

The project uses the Next.js App Router under `app/`.

Node 22 or newer is required. The version is pinned in `.nvmrc`.

## Project Documentation

Project documentation lives in `docs/`.

Before making project, design, content, or implementation decisions, review:

1. `docs/README.md`
2. `docs/project/project-brief.md`
3. `docs/development/coding-practices.md`
4. Relevant files in `docs/maintainability/`

`docs/project/project-brief.md` is the single source of current requirements. It is a living document on this project — edit it directly as requirements change, keeping the reasoning alongside the rule it explains.

## Structure

```txt
app/
  _components/
    ui/         Shared primitives: buttons, cards, form fields
    sections/   Repeated page modules
    site/       Site chrome: header, nav, footer
  _content/     Shared content registries
  _design/      Design token metadata
  globals.css   Runtime design tokens and base styles
  layout.tsx
  page.tsx
docs/           Project documentation
public/
  images/
  documents/
```

Tests live next to the code they cover, such as `Button.tsx` and `Button.test.tsx`.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the local site at:

```txt
http://localhost:3000
```

## Build

```bash
npm run build
```

## Testing

```bash
npm run test       # watch mode
npm run test:run   # single run
```

See the testing section in `docs/development/coding-practices.md` for what is worth testing.

## Linting and Formatting

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Quality Checks

Run before committing implementation changes:

```bash
npm run format:check
npm run lint
npm run test:run
npm run build
```

CI runs these same checks on pull requests into `stage` and `main`.

## Git Workflow

See `docs/development/git-workflow.md`.

- Conventional Commits for commit messages and PR titles.
- Branches: `development`, `stage`, `main`.
- Squash merge into `stage` and `main`.
