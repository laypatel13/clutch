# Contributing to Clutch

Thanks for wanting to contribute. Clutch is an open source developer activity dashboard, and all contributions — code, docs, design, bug reports — are welcome.

Please read this fully before picking up an issue. It explains exactly how issues are assigned, which is different depending on difficulty.

---

## Issue Labels & Assignment Rules

Every issue is labeled with a difficulty. **The assignment process is different per label — read carefully.**

### 🟢 `good-first-issue`
**First to comment gets assigned. One person only.**

- Comment on the issue saying you want to work on it.
- The **first valid comment** gets assigned by a maintainer.
- Do not start working until you are assigned.
- Only one person assigned per issue.
- These exist so new contributors can get a fast, frictionless first PR merged.

### 🟡 `intermediate` and 🔴 `advanced`
**Must be assigned before you start. No exceptions.**

- Comment on the issue saying you'd like to work on it. Try explaining your solution in 5-6 points if possible.
- A maintainer will assign it to you — wait for the assignment before starting work.
- You have **5 days** from assignment to open a draft PR or post a progress update in the issue thread. No update after 5 days → you'll be unassigned and the issue reopens for others.
- Only one person is assigned per issue at a time.
- PRs submitted for an `intermediate`/`advanced` issue without an assignment may be closed and asked to follow the process, even if the code is good — this keeps things fair for contributors who asked first.

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/clutch.git`
3. Create a branch: `git checkout -b feature/your-feature` (or `fix/your-fix`)
4. Make your changes
5. Push and open a Pull Request to `develop` (not `main`)

---

## Branch Strategy

- `main` — stable, deployed, protected
- `develop` — active development, **all PRs go here**
- `feature/xyz`, `fix/xyz` — your working branches, deleted after merge

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) prefixes:

```
feature(scope): add wakatime integration
fix(scope): correct streak calculation on day boundaries
docs(scope): update setup instructions
refactor(scope): simplify github service auth flow
chore(scope): bump dependencies
test(scope): add github service unit tests
```

---

## Code Style

- **Python** — PEP8, type hints where possible
- **TypeScript** — strict mode, functional components, hooks
- **CSS** — use existing CSS variables in `index.css`, avoid hardcoded values
- **CLI** — follow the existing Rich-based visual system (`rule()` headers, `box.SIMPLE` tables, one accent color)

---

## Pull Request Guidelines

- Keep PRs focused — one issue, one PR
- Fill out the PR template completely
- Link the issue using `Closes #123` in the PR description
- Add tests for new backend functionality where applicable
- Screenshots or terminal recordings are required for any UI/CLI changes
- Make sure `develop` is up to date with your branch before requesting review

---

## What Happens After You Open a PR

1. A maintainer reviews within a few days
2. You may get review comments — please respond/address rather than opening a new PR
3. Once approved, it's merged into `develop`
4. Periodically, `develop` is merged into `main` and deployed

---

## Reporting Bugs / Requesting Features

Use the issue templates. Include reproduction steps for bugs, and rationale for feature requests.

---

## Questions?

Open a GitHub Discussion or comment on the relevant issue. Please don't DM maintainers directly for general questions — keeping things in public threads helps everyone.
