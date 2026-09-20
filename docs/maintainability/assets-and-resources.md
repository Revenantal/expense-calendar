# Assets and Resources

Long-term notes for public assets and downloadable resources.

## Where Assets Live

```txt
public/
  images/
  documents/
```

Anything under `public/` is served at the matching URL path. `public/images/logo.png` is available at `/images/logo.png`.

## Rules

- Use local assets. Do not hotlink third-party production files.
- Use descriptive, lowercase, hyphenated filenames.
- Keep document paths stable once published, because they may be linked externally.
- Use `next/image` for images where practical.
- Use plain file links for documents and downloads.

## Adding a Document

1. Add the file under `public/documents/` with a descriptive filename.
2. Add or update the matching entry in the relevant `app/_content/` registry.
3. Link to it from the registry rather than hardcoding the path in multiple places.

## Image Guidance

- Provide meaningful alt text for images that carry information.
- Use empty alt text for purely decorative images.
- Size and compress images before committing them.
- Prefer modern formats where the source allows it.

## Before Launch

Confirm every asset referenced by the project actually exists and is licensed for use. Track outstanding items in `docs/project/asset-checklist.md`.
