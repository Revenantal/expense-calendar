# Git Workflow

Project-wide Git, branch, commit, and pull request practices.

## Commit Messages

Use Conventional Commits for all commit messages.

Format:

```txt
type: short description
```

Optional scope:

```txt
type(scope): short description
```

Examples:

```txt
docs: add project documentation structure
feat(home): add hero layout
fix(resources): correct document link
chore: update formatting config
```

## Commit Types

Use these common types:

- `feat` — New user-facing feature or page.
- `fix` — Bug fix or correction.
- `docs` — Documentation-only change.
- `style` — Formatting or visual/code style change with no logic change.
- `refactor` — Code change that is not a feature or bug fix.
- `perf` — Performance improvement.
- `test` — Test additions or changes.
- `build` — Build tooling, dependencies, or package changes.
- `ci` — CI configuration or automation.
- `chore` — Maintenance that does not fit another type.
- `revert` — Reverts a previous commit.

Keep commit descriptions:

- Lowercase after the type where practical.
- Short and clear.
- Written as an action or result, not a sentence with a period.
- Keep the primary commit line brief and descriptive.
- Use the optional commit body for extra context, details, reasoning, or notes when needed.

## Branches

Main long-lived branches:

- `development` — Active working branch during early build/design work.
- `stage` — Staging branch used once work is ready for staged review.
- `main` — Production branch.

Branch protection expectations:

- `development` may be used more freely while the project is still being shaped.
- `stage` and `main` should be treated as protected branches.
- Do not commit directly to `stage` or `main`.
- Work targeting `stage` or `main` should happen on a short-lived branch created from the target branch.
- Merge back through a pull request.

> **Exception on this project:** commits go directly to `main` — see `docs/project/project-exceptions.md`. Run the quality checks before committing, since there is no PR gate to catch a failure.

## Branch Naming

Use short, descriptive branch names with a type prefix.

Format:

```txt
type/short-description
```

Examples:

```txt
docs/project-setup
feat/homepage-design
fix/homepage-typo
chore/prettier-config
```

Recommended branch types should match commit types where possible:

- `docs/`
- `feat/`
- `fix/`
- `chore/`
- `refactor/`

Branch names should describe the work in plain language using kebab-case. For example, use `fix/homepage-typo`, not `fix typo on homepage`.

## Pull Requests

Conventional Commits defines commit message structure, not pull request standards. For this project, apply the same style to PR titles so squash merges create clean conventional commits.

PR title format:

```txt
type(scope): short description
```

Examples:

```txt
docs: add project briefs and references
feat(home): add homepage design direction
fix(resources): update local document paths
```

PR descriptions should use the project pull request template in `.github/pull_request_template.md`.

Required PR sections:

- `Context` — Where the change comes from and who requested it.
- `What` — What changed at a high level.
- `Why` — Why the change is needed.
- `How` — How the change was implemented and why that approach was used.
- `Additional Notes` — Optional extra context.

Use only those H1 sections in the PR description. Add H2/H3 subsections under them when helpful.

## Merge Behaviour

Use squash merge by default for pull requests into `stage` and `main`.

Reason:

- The target branch receives one clean commit per completed branch.
- The commit history stays easy to read.
- The squash commit can use the PR title as the final Conventional Commit message.

Default expectation:

1. Create a short-lived branch from the target branch.
2. Make one or more working commits on that branch.
3. Open a PR back into the target branch.
4. Squash merge the PR after review/checks pass.
5. Use a Conventional Commit message for the squash commit.

Regular merge commits should only be used when preserving the branch history is important. Rebase merge should only be used when the team intentionally wants each branch commit kept in the target branch history.

## Continuous Integration

CI runs on every pull request into `stage` and `main`, and on pushes to those branches. It checks formatting, lint, tests, and the production build.

The workflow lives in `.github/workflows/ci.yml`. Keep its steps in sync with the quality checks in `docs/development/coding-practices.md`.

Do not merge a pull request with a failing check. Fix the cause rather than disabling the check.

## Before Opening A PR

Run the relevant checks:

```bash
npm run format:check
npm run lint
npm run test:run
npm run build
```

If only documentation changed, `npm run format:check` is usually enough unless code/config files were also touched.
