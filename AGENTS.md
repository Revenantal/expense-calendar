# Project Documentation Rules

- Use `docs/` as the source of truth for project documentation, requirements, organization, and planning.
- Read `docs/README.md` first to understand the documentation structure.
- Use `docs/maintainability/` for long-term built-project guidance.
- `docs/project/project-brief.md` is the single source of current requirements and a living document. There is no external client, so it is edited directly as requirements change. Keep it accurate, and keep the reasoning alongside the rules it explains.
- `docs/project/project-exceptions.md` holds approved departures from the project's own process rules. Application behaviour belongs in the brief, not there.
- Keep implementation and organization lightweight unless the client explicitly approves more complexity.
- Follow `docs/development/coding-practices.md` for project-wide coding and implementation practices.
- Follow `docs/development/git-workflow.md` for commit, branch, and pull request practices.
- Keep comments, documentation, and project notes simple, direct, and easy to read.
- Requirements and their reasoning live in `docs/project/project-brief.md`; read that file rather than duplicating details here.

# Framework Version

This project uses Next.js with the App Router. APIs, conventions, and file structure may differ from what a model has memorized.

Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. When in doubt, follow the installed docs over general memory or older framework conventions.

# Code Quality Pushback

- Follow the full pushback rules in `docs/development/coding-practices.md` before editing code.
- Do not blindly paste snippets into this project.
- Challenge off-architecture code before editing.
- If clarification is declined, cancelled, or unanswered, stop instead of implementing.
- For questionable implementation requests, respond with prose first: concern, recommended project-native alternative, and a specific confirmation question.
- Prefer scoped React/Next.js solutions over global scripts, direct DOM mutation, fragile selectors, broad listeners, timers, polling, click fallbacks, or History API monkey-patching.
