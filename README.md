# Next.js Project Template

Starting point for Next.js projects. It carries the documentation structure, coding practices, git workflow, tooling config, and component organization used across these projects, with a minimal runnable app.

## What's Included

- Next.js 16 App Router with React 19 and TypeScript
- Tailwind CSS 4, ESLint, and Prettier already configured
- `lucide-react` for icons
- Vitest and React Testing Library with an example test
- GitHub Actions CI running format, lint, test, and build
- `docs/` structure for requirements, practices, and maintenance notes
- `AGENTS.md` and `CLAUDE.md` with project rules for AI coding agents
- Design and content registries under `app/_design/` and `app/_content/`
- Error pages, `sitemap.ts`, and `robots.ts`
- Pull request template and Conventional Commits workflow

## Starting A New Project

1. Copy this repository, or use it as a GitHub template.
2. Update `name` in `package.json`.
3. Replace this README with a real project README.
4. Replace `docs/project/project-brief.md` with the client brief, or delete it.
5. Replace the placeholder tokens in `app/globals.css` and `app/_design/` with the real design values.
6. Update `docs/maintainability/design-system.md` and `project-overview.md`.
7. Copy `.env.example` to `.env` and fill in the values.
8. Delete anything the project does not need, then update the references to it in `docs/README.md`, `AGENTS.md`, and `CLAUDE.md`.

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
3. `docs/project/project-exceptions.md`
4. `docs/development/coding-practices.md`
5. Relevant files in `docs/maintainability/`

Important: `docs/project/project-brief.md` is client-provided and should not be modified. Record deviations in `docs/project/project-exceptions.md`.

## Structure

```txt
app/
  _components/
    ui/         Shared primitives: buttons, cards, form fields
    sections/   Repeated page modules: heroes, feature grids, CTA blocks
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

## Coding Practices

See `docs/development/coding-practices.md` for full guidance.

Key practices:

- Use TypeScript for application code.
- Prefer Server Components by default.
- Use Client Components only when browser interactivity is required.
- Use one component with variant props instead of near-duplicate components.
- Use design tokens instead of hardcoded values.
- Keep the project lightweight and easy to maintain.
- Avoid unnecessary backend features, databases, CMS functionality, and complex application patterns unless explicitly approved.
- Use the styling tools already configured: Tailwind CSS, global CSS, and CSS Modules.

## Git Workflow

See `docs/development/git-workflow.md`.

- Conventional Commits for commit messages and PR titles.
- Branches: `development`, `stage`, `main`.
- Squash merge into `stage` and `main`.
