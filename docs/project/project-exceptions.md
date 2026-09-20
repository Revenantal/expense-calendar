# Project Exceptions

Approved departures from the documented process rules in `AGENTS.md`, `CLAUDE.md`, `docs/README.md`, and `docs/development/`.

This file is only for exceptions to how the project is _run_. How the application behaves belongs in `project-brief.md`, and implementation practice belongs in `docs/development/` or `docs/maintainability/`.

## Entry Format

```md
## Short title

**Date:** YYYY-MM-DD
**Rule:** The documented rule being departed from.
**Exception:** What is done instead.
**Why:** The reason.
```

## Exceptions

## Brief is a living document

**Date:** 2026-09-20

**Rule:** `docs/project/project-brief.md` is a client-provided baseline and must never be modified, with deviations recorded separately.

**Exception:** The brief is edited directly as requirements change, and is the single source of current requirements. Reasoning is kept alongside the rules it explains.

**Why:** There is no external client. The read-only rule protects a third party's baseline from silent drift; with the owner setting requirements directly, it only adds friction. Git history records what changed.
