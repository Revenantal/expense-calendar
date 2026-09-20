# Expense Calendar

Track expenses on a calendar.

Built from the [nextjs-ai-template](https://github.com/Revenantal/nextjs-ai-template) starting point.

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
