# Coding Practices

Project-wide coding practices for this Next.js project.

Keep the implementation simple and maintainable. Avoid patterns that make it feel like a complex application unless explicitly approved.

## Core Principles

- Keep the implementation lightweight and easy to understand.
- Prefer static/content-driven pages over dynamic application behaviour.
- Use reusable components for repeated layout patterns.
- Avoid unnecessary dependencies.
- Prioritize accessibility, responsive behaviour, SEO, and maintainability.
- Follow the client brief and approved exceptions in `docs/`.
- Where implementation guidance is unclear or conflicts with assumptions, defer to the local Next.js documentation for the installed version.

## Code Quality Pushback

### Critical Rules

1. Do not blindly paste snippets into this project.
2. Challenge off-architecture code before editing.
3. If clarification is declined, cancelled, or unanswered, stop instead of implementing.
4. Prefer scoped React/Next.js solutions over global scripts.

### Mandatory Fit Check Before Implementation

Before implementing any user-provided snippet, script, library, or approach, decide whether it fits this project.

If the request includes any of the following, stop and challenge it before editing files:

- Direct DOM mutation in React/Next.js.
- Global event listeners.
- Monkey-patching browser APIs such as `history.pushState` or `history.replaceState`.
- Timers, polling, timeout fallbacks, or click fallbacks.
- Fragile selectors or class-name-dependent behaviour.
- WordPress, jQuery, or CMS-style snippets.
- Broad scripts added to layouts or all pages.

Do not write files, create components, or make implementation edits until the user confirms a project-native approach or explicitly asks to proceed despite the concern.

For questionable implementation requests, the first response must be prose only. Do not call write/edit tools in the same turn. Use this format:

1. Concern.
2. Recommended project-native alternative.
3. Specific question for confirmation.

If a clarifying or quality-gate question is declined, cancelled, or not answered, do not proceed with implementation. Summarize the concern and wait for direction.

### General Guidance

Do not treat user requests as permission to blindly paste code into the project. Think through whether the request fits the project's goals, framework, maintainability needs, accessibility, SEO, performance, and documented requirements.

It is acceptable and expected to challenge the user when a request would add brittle, unnecessary, overcomplicated, insecure, inaccessible, or off-architecture code. The goal is to protect the project, not to be difficult.

Before implementing a questionable approach, briefly explain the concern, propose a cleaner project-native alternative, and ask for confirmation when the decision materially affects quality or direction.

Prefer solving the underlying problem over implementing the literal snippet or wording the user provided. Ask clarifying questions when the intended behaviour, target page, content model, or acceptance criteria are unclear.

Keep solutions scoped. Do not add global behaviour, dependencies, abstractions, or cross-project changes when a local component or simpler change is enough.

Examples that require pushback:

- Direct DOM mutation in React/Next.js when state, props, or classes would be cleaner.
- Monkey-patching browser APIs such as `history.pushState` or `history.replaceState`.
- Broad global listeners, polling, timeout fallbacks, or page-wide scripts when behaviour should be scoped to a component or route.
- Code that depends on fragile selectors when the relevant markup is controlled by the app.
- Snippets copied from WordPress, jQuery, or similar environments without adapting them to this codebase.
- New dependencies when the platform or existing tooling already solves the problem well.
- Large abstractions for one-off behaviour.
- Changes that weaken accessibility, metadata, responsiveness, or static-site simplicity.

If the user still wants the exact approach after the trade-off is explained, keep it isolated and document the risk briefly.

## Next.js Usage

This project uses Next.js with the App Router.

Before writing or changing Next.js code, read the relevant local Next.js documentation under:

```txt
node_modules/next/dist/docs/
```

Do not rely on older Next.js assumptions without checking the local docs first. When in doubt, follow the installed Next.js docs over general memory or older framework conventions.

Recommended approach:

- Use App Router conventions under `app/`.
- Use TypeScript for application code: prefer `.ts` and `.tsx` files over JavaScript files.
- Prefer Server Components by default.
- Only use Client Components when browser-only interactivity is required.
- Keep routing simple and aligned with the documented sitemap/URL plan.
- Use Next.js metadata features for page titles and descriptions.
- Use `next/link` for internal navigation.
- Use `next/image` for images when practical; use plain file links for documents/downloads.
- Use `next/script` for third-party scripts so loading strategy is explicit.
- Use file conventions such as `sitemap.ts`, `robots.ts`, icons, and metadata files where they fit.

## Simplicity Bias

Even though Next.js/Node tooling is available, implementation should avoid unnecessary backend complexity.

Avoid unless explicitly approved:

- Databases
- CMS integrations
- Authentication
- Server actions for user submissions
- Complex state management libraries
- API routes for nonessential behaviour
- Heavy animation frameworks
- Overly dynamic rendering patterns

## TypeScript

Use TypeScript throughout the project.

Guidance:

- Write React components in `.tsx` files.
- Write utilities, data definitions, constants, and config helpers in `.ts` files.
- Prefer explicit types for exported component props, shared data structures, and content data.
- Avoid `any` unless there is a clear reason and the scope is limited.
- Keep types close to the code they describe unless they are reused across multiple areas.
- Use `import type` for type-only imports where appropriate.

## Components

Use components where it makes sense, especially for repeated layout and content patterns. Do not force abstraction for one-off markup.

Use components for repeated pieces such as:

- Site header
- Primary navigation
- Footer
- Hero sections
- Page intro blocks
- Cards/link panels
- Resource/download cards
- Related links
- Content sections

Component guidance:

- Keep components small and purposeful.
- Prefer clear prop names and typed props.
- Build shared UI elements as reusable components with typed variants.
- For closely related styles or states, prefer one component with variant/state props over many near-duplicate components. For example, use one button component with variants such as `primary`, `outline`, or `secondary` instead of separate button components for each style.
- Do not turn shared components into oversized catch-all components. Reuse a component when the structure and purpose are the same; split components when the structure, content model, or purpose is meaningfully different.
- Keep variant names aligned with the design source where possible. Avoid inventing code-only names when the design already has clear labels.
- Separate variants from states. Variants describe the visual type, while states describe conditions such as disabled, loading, hover, focus, or active. Use CSS for interaction states where practical, and props for semantic states such as disabled or loading.
- Use shared design tokens for colour, spacing, radius, typography, shadows, and focus styles so components do not hardcode slightly different values.
- Support composition with `children` where practical, such as text-only buttons and icon-with-text buttons using the same base component.
- Build accessibility into base components, including semantic elements, keyboard support, disabled handling, visible focus styles, and ARIA attributes where needed.
- Avoid premature abstraction.
- If a component is only used once and is not complex, inline page markup is acceptable.
- Prefer composition over large configurable components with many optional props.
- Keep shared components in a predictable location such as `app/_components/`.
- Mark a component with `'use client'` only when it needs state, event handlers, effects, browser APIs, or client-only hooks.

Suggested component organization:

```txt
app/_components/
  ui/         Shared primitives: buttons, cards, form fields, badges
  sections/   Repeated page-level modules: heroes, feature grids, CTA blocks
  site/       Site chrome: header, nav, footer, breadcrumbs
```

## Icons

This project uses `lucide-react` for icons. Use it rather than adding a second icon library or hand-rolling SVGs.

Guidance:

- Import only the icons you use. Named imports keep the bundle small.
- Pass icons as `children` rather than adding an `icon` prop to every component.
- Set `aria-hidden="true"` on decorative icons so screen readers skip them.
- When an icon is the only content of a control, give the control an accessible name with `aria-label`.
- Use the `size` prop instead of overriding width and height in CSS.
- Let icons inherit `currentColor` rather than hardcoding a colour.

```tsx
import { ArrowRight, Download } from 'lucide-react'

// Decorative icon alongside a visible label.
;<Button href="/products">
  View products
  <ArrowRight aria-hidden="true" size={18} />
</Button>

// Icon-only control needs its own accessible name.
;<button type="button" aria-label="Download specification sheet">
  <Download aria-hidden="true" size={18} />
</button>
```

If a project needs an icon Lucide does not have, add a single local SVG component under `app/_components/ui/` rather than pulling in another library.

## Code Documentation and Comments

Use concise documentation comments for functions/methods and small inline comments where clarity helps.

Documentation guidance:

- All functions and methods should have brief TSDoc/JSDoc-style documentation blocks.
- Use standard doc-block tags where they add clarity: `@param`, `@returns`, `@throws`, `@example`, and `@remarks`.
- Include every parameter with `@param` when a function accepts parameters.
- Include `@returns` when the return value is not obvious or the function returns a computed/transformed value.
- Include `@throws` only when the function intentionally throws or propagates a meaningful error condition.
- Include `@example` only for shared utilities or APIs where usage may not be obvious.
- Keep descriptions short: usually one sentence, rarely more than two.
- Document what the function/method does, not obvious implementation details.
- Avoid circular comments that merely repeat the function name or code.
- Avoid references to external docs or other project docs unless explaining a specific quirk, compatibility issue, or intentional workaround.
- Comments should be understandable on their own when read near the code.

React/JSX component documentation:

- Use normal TypeScript/TSDoc-style comments. No special Next.js-only format is required.
- Document exported/shared components with a brief block comment when the component's purpose is not immediately obvious from its name and usage.
- Use named props types/interfaces for shared components.
- Add field-level prop comments only for non-obvious props, constraints, or values with side effects.
- Do not document obvious props such as `title`, `href`, or `children` unless there is a project-specific constraint.
- Do not add verbose doc blocks to tiny one-off page-local components unless they contain non-obvious behaviour.

Inline comment guidance:

- Add a short inline or leading comment before code sections that may not read clearly at a glance.
- Keep inline comments to one sentence maximum.
- Do not comment obvious JSX/HTML structure or simple assignments.
- Prefer making code clearer over adding comments to explain confusing code.

Example style:

```ts
/**
 * Builds the public URL for a locally hosted document.
 *
 * @param filename - Document filename stored in the public documents folder.
 * @returns Public URL path for the document.
 */
export function getDocumentUrl(filename: string): string {
  return `/documents/${filename}`
}

type ResourceCardProps = {
  title: string
  href: string
}

/** Renders a link card for a downloadable resource. */
export function ResourceCard({ title, href }: ResourceCardProps) {
  return <a href={href}>{title}</a>
}

// Keep document paths stable because PDFs may be shared externally.
const documentPath = getDocumentUrl('example.pdf')
```

## Styling

Styling should follow `docs/maintainability/design-system.md`. Also follow the installed Next.js styling documentation.

Use the styling tools already configured in this project unless there is a clear reason to add something else. This project has Tailwind CSS configured and can also use standard Next.js global CSS and CSS Modules without adding dependencies.

Recommended approach:

- Use global CSS for base styles, design tokens, resets, typography, and layout primitives.
- Use Tailwind utilities where they improve speed and consistency.
- Use CSS Modules for component-specific styles when Tailwind/global CSS would make the markup or stylesheet harder to read.
- Do not add Sass/SCSS unless the project explicitly decides it is needed.
- Do not mix styling approaches excessively.
- Use a consistent design token approach for colours, spacing, typography, and breakpoints.
- Keep styles organized and readable.
- Prefer simple responsive layouts using modern CSS.
- Avoid copying legacy WordPress/CMS CSS directly into the project.
- Avoid bringing over Bootstrap/jQuery patterns from reference sites.

## Content and Assets

Content should follow `docs/maintainability/content-model.md`.

Asset guidance:

- Use local assets for required images and documents.
- Do not hotlink third-party production assets.
- Store public assets under `public/` using clear folder names.
- Use descriptive filenames where practical.
- Keep document/download paths stable once published.

Suggested asset organization:

```txt
public/
  images/
  documents/
```

## Routing and URLs

- Prefer static routes that match the approved sitemap and redirect plan.
- Use descriptive route segments.
- Avoid dynamic routes unless they meaningfully reduce duplication without making the project harder to understand.
- Do not add route groups, parallel routes, intercepted routes, or API routes unless there is a clear need.

## Error Pages

Build simple branded error pages as part of the implementation.

Guidance:

- Include a custom `app/not-found.tsx` page for missing routes and explicit `notFound()` cases.
- Include framework-supported general error/fallback pages where appropriate, such as `app/error.tsx` and `app/global-error.tsx`.
- Keep normal error pages visually consistent with the design and shared components.
- Keep `global-error.tsx` especially simple because it replaces the root layout, must be a Client Component, and must define its own `<html>` and `<body>` tags.
- Provide clear recovery actions, such as links back to key pages.
- Use short, plain-language messages.
- Avoid contact forms, heavy interactivity, or complex error reporting flows.

## Internal-Only Routes

If the project needs routes that should exist in development and staging but not production:

- Keep the route in the codebase and return `notFound()` when `APP_ENV` is `production`.
- Use a clear environment convention such as `APP_ENV=development | staging | production`.
- Do not link to internal routes from public navigation.
- Disallow the internal path prefix in `app/robots.ts`.

## SEO

Each page should have:

- Unique page title
- Appropriate meta description
- One clear `h1`
- Descriptive headings
- Meaningful link text
- Useful image alt text
- Stable URL slug

Maintain the redirect map in `docs/project/sitemap-and-redirects.md` when replacing an existing site.

## Accessibility

Follow basic accessibility practices throughout:

- Use semantic HTML.
- Ensure each page has a unique, descriptive title.
- Ensure each page has a clear `h1`.
- Provide alt text for meaningful images.
- Use sufficient colour contrast.
- Ensure navigation is keyboard accessible.
- Do not rely on colour alone to communicate meaning.
- Respect `prefers-reduced-motion` if animations are added.

## Responsive Behaviour

The project must work well on desktop, tablet, and mobile.

Responsive guidance:

- Navigation should collapse on smaller screens.
- Cards/columns should stack cleanly.
- Text should remain readable without horizontal scrolling.
- Buttons and links should be touch-friendly.

## Analytics

If the project requires analytics:

- Keep analytics isolated in a small utility/component.
- Do not scatter analytics snippets throughout page code.
- Use environment/config values where appropriate.
- Avoid blocking page rendering with analytics scripts.

## Formatting and Linting

This project uses ESLint for code quality and Prettier for consistent formatting.

Available commands:

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

Guidance:

- Run `npm run format` before committing broad documentation or code changes.
- Run `npm run lint:fix` to apply safe ESLint fixes.
- Use `npm run format:check` in review/CI contexts when files should not be modified.
- Do not hand-format files in a way that fights Prettier.

## Testing

This project uses Vitest with React Testing Library. Configuration is in `vitest.config.mts` and `vitest.setup.ts`.

```bash
npm run test       # watch mode
npm run test:run   # single run, used by CI
```

Colocate test files next to the code they cover, such as `Button.tsx` and `Button.test.tsx`.

### What To Test

Do not chase a coverage number. On a content-driven project, most pages are static markup and testing them adds maintenance cost without catching real problems.

Worth testing:

- Shared components with variants, states, or conditional rendering.
- Utilities and data transforms, especially anything parsing or formatting.
- Registry-derived logic, such as filtering or grouping content entries.
- Accessible behaviour of interactive components: roles, labels, keyboard handling, disabled states.
- Any bug you fix. Add the failing case first so it cannot come back.

Not worth testing:

- Static page markup with no logic.
- Class names and styling. These change often and the test just restates the code.
- Third-party library behaviour.

### How To Write Tests

- Query by role and accessible name rather than test IDs or class names. This tests what users and assistive technology actually encounter.
- Test behaviour consumers depend on, not implementation detail.
- Keep each test focused on one thing, with a name that says what it expects.
- Avoid snapshot tests for components that change often.

Vitest does not support `async` Server Components. Keep logic that needs testing in plain functions those components call, and test the functions directly.

## Quality Checks

Before considering implementation work complete, run:

```bash
npm run format:check
npm run lint
npm run test:run
npm run build
```

CI runs these same checks on pull requests into `stage` and `main`.

Also manually check:

- Primary navigation
- Mobile navigation
- Footer links
- Download links
- Page metadata
- Responsive layouts

## Documentation Expectations

Use simple, readable language in code comments, documentation, and project notes.

Writing guidance:

- Prefer plain language over formal or technical-sounding wording.
- Keep sentences short where possible.
- Explain ideas directly.
- Avoid inflated language, buzzwords, or overly intense phrasing.
- Use technical terms when they are accurate and helpful, but do not overuse them.
- Write for quick understanding by another developer or project stakeholder.

When implementation decisions affect requirements, sitemap, content, design, or exceptions:

- Update the appropriate file in `docs/`.
- Do not edit `docs/project/project-brief.md`.
- Use `docs/project/project-exceptions.md` for approved deviations or clarifications.
