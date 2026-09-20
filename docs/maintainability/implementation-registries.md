# Implementation Registries

Shared registries keep repeated design and content data keyed in one place so components do not drift from each other.

## Design Registries

Design registries live in:

```txt
app/_design/
```

Current files:

- `app/_design/tokens.ts` — Color, shadow, border, and layout token metadata.
- `app/_design/typography.ts` — Typography roles, class names, usage notes, and sample text.
- `app/_design/spacing.ts` — Spacing scale labels, pixel values, and usage notes.

The runtime CSS/Tailwind token definitions live in `app/globals.css`. The TypeScript registries are keyed metadata for implementation consistency.

When adding or changing a design token:

1. Update `app/globals.css` if the runtime Tailwind/CSS token changes.
2. Update the matching `app/_design/` registry entry.
3. Update `docs/maintainability/design-system.md` if the rule needs human-readable maintenance documentation.

## Content Registries

Content registries live in:

```txt
app/_content/
```

Current files:

- `app/_content/navigation.ts` — Main navigation, dropdown links, and footer navigation.

Add further registries as the project grows, such as resources, locations, products, or services.

When adding or changing repeated content:

1. Prefer updating the relevant registry before hardcoding content in components.
2. Keep registry data simple and typed.
3. Mark uncertain entries as draft in the registry rather than pretending they are final.
4. Update related pages from the registry where practical.

## What Belongs in a Registry

Use a registry for data that is repeated or shared across pages/components, such as:

- Design tokens and typography roles.
- Navigation and footer links.
- Resource/download metadata.
- Locations and contact details.
- Product or service listings.

Do not create a registry for one-off page copy that is easier to maintain in the page itself.

## Naming Rules

- Use stable camelCase keys, such as `creditApplication` or `prePaintedSteel`.
- Keep public labels human-readable, such as `Credit Application`.
- Keep route and asset paths centralized when the same path is used in multiple places.
- Use `as const` and exported TypeScript types to preserve predictable values.
