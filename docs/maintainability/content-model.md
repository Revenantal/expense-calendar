# Content Model

Long-term notes for maintaining project content.

## Where Content Lives

- Repeated or shared content: `app/_content/` registries.
- One-off page copy: the page file itself.

Prefer a registry when the same content appears in more than one place, such as navigation labels, resource metadata, or listings. Do not create a registry for copy that only appears once.

## Editing Content

1. Find whether the content is in a registry or a page.
2. Update it in one place only.
3. Check every page that consumes the registry entry.
4. Run `npm run format:check`, `npm run lint`, and `npm run build`.

## Content Rules

- Keep registry data simple and typed.
- Use `as const` so values stay predictable.
- Mark unconfirmed entries as draft rather than presenting placeholder text as final.
- Keep public labels human-readable.
- Keep URLs stable once published.

## Writing Guidance

- Use plain, direct language.
- Keep headings descriptive.
- Use meaningful link text rather than "click here".
- Write useful alt text for images that carry meaning; use empty alt for decorative images.
