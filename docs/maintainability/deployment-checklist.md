# Deployment Checklist

Use this before a launch or a production update.

## Build Checks

```bash
npm run format:check
npm run lint
npm run test:run
npm run build
```

All four must pass. CI runs these same checks on pull requests into `stage` and `main`.

## Environment

- [ ] All required variables from `.env.example` are set in the deployment environment.
- [ ] `NEXT_PUBLIC_SITE_URL` points at the real production URL.
- [ ] `APP_ENV` is set to `production`.
- [ ] No secrets are committed to the repository.

## Content and Assets

- [ ] No placeholder or lorem ipsum copy remains.
- [ ] All images load and have appropriate alt text.
- [ ] All document/download links resolve.
- [ ] Contact details and legal text are correct.

## SEO

- [ ] Every page has a unique title and meta description.
- [ ] Every page has exactly one `h1`.
- [ ] `sitemap.xml` lists the real routes.
- [ ] `robots.txt` is correct and does not block production.
- [ ] Redirects from any previous site are in place and tested.

## Accessibility and Responsive

- [ ] Keyboard navigation works across the site.
- [ ] Focus styles are visible.
- [ ] Colour contrast passes on text and interactive elements.
- [ ] Layouts work on desktop, tablet, and mobile.
- [ ] No horizontal scrolling at common mobile widths.

## Functional

- [ ] Primary navigation works.
- [ ] Mobile navigation opens, closes, and traps focus correctly.
- [ ] Footer links work.
- [ ] 404 page renders for an unknown route.
- [ ] Internal-only routes return 404 in production.

## Post-Deploy

- [ ] Spot-check the live site on a real mobile device.
- [ ] Confirm analytics is recording, if configured.
- [ ] Confirm the production URL serves over HTTPS.
