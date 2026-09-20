# Sitemap and Redirects

Working sitemap and legacy-to-new URL planning.

## URL Conventions

- Use lowercase, hyphenated, extensionless paths.
- Keep slugs short and descriptive.
- Do not change a published URL without adding a redirect.

## Sitemap

Keep this table aligned with `app/sitemap.ts`.

| Path | Page | Status |
| ---- | ---- | ------ |
| `/`  | Home | Built  |

## Redirects

Fill this in when replacing an existing site. Every legacy URL that has inbound links or search visibility needs a permanent redirect.

| Legacy URL | New URL | Status |
| ---------- | ------- | ------ |
| _none_     |         |        |

Implement redirects in `next.config.ts` under `redirects()`. Use `permanent: true` for moved pages.

## Before Launch

- [ ] Every legacy URL with traffic maps to a new URL.
- [ ] Redirects are tested against the live legacy list.
- [ ] `app/sitemap.ts` lists the real routes.
- [ ] No redirect chains or loops.
