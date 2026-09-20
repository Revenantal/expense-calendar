# Design System

Current design values and component rules for this project.

Replace the placeholder values below with the project's real design once it is decided. Keep this file in sync with `app/globals.css` and the registries in `app/_design/`.

## Where Values Live

- Runtime token definitions: `app/globals.css`
- Keyed token metadata: `app/_design/tokens.ts`, `typography.ts`, `spacing.ts`
- Shared components: `app/_components/`

When a token changes, update the runtime CSS and the matching registry entry together.

## Colour

| Token   | Value     | Usage                             |
| ------- | --------- | --------------------------------- |
| Surface | `#ffffff` | Page background                   |
| Panel   | `#f5f5f5` | Cards, sidebars, inset blocks     |
| Line    | `#e0e0e0` | Hairline borders and dividers     |
| Accent  | `#1a56db` | Primary actions and active states |
| Ink     | `#111827` | Headings and high-contrast text   |
| Body    | `#374151` | Default paragraph copy            |
| Muted   | `#6b7280` | Labels, captions, legal text      |

Check contrast for every text/background pair before adopting a real palette.

## Typography

Roles are defined in `app/_design/typography.ts`: display, page title, section, card title, lead, body, caption.

Guidance:

- One `h1` per page.
- Keep heading levels in order. Do not skip levels for visual size.
- Use the role registry rather than reinventing sizes per page.

## Spacing

The scale is defined in `app/_design/spacing.ts`, from `2xs` (4px) to `section` (80px).

Guidance:

- Use the scale instead of arbitrary values.
- Keep a consistent section rhythm across pages.

## Layout

- Container max width: `1280px`
- Desktop edge padding: `40px`
- Mobile edge padding: `20px`
- Column gutter: `24px`

## Components

Follow the component rules in `docs/development/coding-practices.md`.

Key rules:

- One component with variants instead of near-duplicate components.
- Variants describe visual type; states describe conditions such as disabled or loading.
- Build accessibility into base components: semantic elements, keyboard support, visible focus styles.
- Use tokens instead of hardcoded values.

## Icons

Icons come from `lucide-react`. Keep sizes on a small, consistent set (16 / 18 / 20 / 24) rather than picking arbitrary values per component, and let them inherit `currentColor`.

See the icon rules in `docs/development/coding-practices.md` for accessibility and usage.

## Interaction States

- Provide visible focus styles on all interactive elements.
- Use CSS for hover/focus/active where practical.
- Use props for semantic states such as `disabled` or `loading`.
- Respect `prefers-reduced-motion` if animation is added.
