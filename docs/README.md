# Project Documentation

This folder is the source of truth for project requirements, implementation rules, and long-term maintenance notes.

## Required Reading Order

1. `project/project-brief.md` — Project brief and current requirements. Living document.
2. `development/coding-practices.md` — Project-wide implementation guidance.
3. Relevant maintainability docs for the task.

## Folder Structure

```txt
docs/
  project/
    project-brief.md
    project-exceptions.md
    sitemap-and-redirects.md
    asset-checklist.md
    build-plans/
  development/
    coding-practices.md
    git-workflow.md
  maintainability/
    project-overview.md
    design-system.md
    implementation-registries.md
    content-model.md
    assets-and-resources.md
    deployment-checklist.md
  archive/
    README.md
```

## Documentation Lifecycle

- `project/` contains client requirements, approved exceptions, sitemap, redirect planning, launch asset planning, and active build plans.
- `development/` contains coding and workflow rules.
- `maintainability/` contains long-term documentation for maintaining the built project.
- `archive/` contains superseded documents retained only for context. Do not use archived files as source of truth.

If a project comes with design or copy handoff material, add a `docs/original-build/` folder for it and note in this file that those documents are historical references, not current requirements.

## Project Docs

- `project/project-brief.md` — Project brief and the single source of current requirements. This is an internal project with no external client, so the brief is edited directly as requirements change, and carries the reasoning behind its own rules.
- `project/project-exceptions.md` — Approved departures from the project's own process rules. Not a place for application behaviour; that goes in the brief.
- `project/sitemap-and-redirects.md` — Working sitemap and legacy-to-new URL redirect planning document.
- `project/asset-checklist.md` — Short checklist for confirming required assets before launch.
- `project/build-plans/` — Build plans and progress trackers for distinct phases of work. Keep completed plans as reference records rather than deleting them.

## Development Docs

- `development/coding-practices.md` — Project-wide coding and implementation practices.
- `development/git-workflow.md` — Commit, branch, and pull request practices using Conventional Commits.

## Maintainability Docs

- `maintainability/project-overview.md` — Long-term overview of the built project and documentation sources of truth.
- `maintainability/design-system.md` — Current design values and component rules for implementation and maintenance.
- `maintainability/implementation-registries.md` — Shared `app/_design/` and `app/_content/` registry conventions.
- `maintainability/content-model.md` — Long-term notes for maintaining content.
- `maintainability/assets-and-resources.md` — Long-term notes for public assets and downloadable resources.
- `maintainability/deployment-checklist.md` — Launch and production-update checklist.

## Archive Rules

- Archive only superseded material that may still be useful for context.
- Use dated folders: `YYYY-MM-DD-short-reason/`.
- Include a short README in each archive folder explaining what was archived and why.
- Archived files are not active requirements.

## Working Rules

- Read `project/project-brief.md` before making planning, design, or implementation decisions. It is the single source of current requirements.
- Keep the brief accurate as requirements change, and keep reasoning alongside the rules it explains.
- Use `project/project-exceptions.md` only for approved departures from the project's process rules. Application behaviour goes in the brief.
- Prefer clear documentation and lightweight organization over unnecessary process.

## Keeping This Structure Accurate

If a doc is added or removed, update the references to it here and in `AGENTS.md` and `CLAUDE.md`. Those files point agents at this structure, so a stale reference sends them looking for a file that is not there.

Still to fill in as the project takes shape: `maintainability/design-system.md`, `maintainability/project-overview.md`, and `project/sitemap-and-redirects.md`.
