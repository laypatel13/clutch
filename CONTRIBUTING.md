# Contributing to Clutch

Thanks for wanting to help. Code, docs, design ideas and bug reports are all welcome.

## How it works

1. **Start a [Discussion](https://github.com/laypatel13/clutch/discussions).** Questions and bugs go in **Q&A**, feature ideas in **Ideas**. Please search first.
2. **A maintainer creates an issue** if the bug is confirmed or the idea is accepted.
3. **Comment on the issue** to say you'd like to work on it, and wait to be assigned.
4. **Open a pull request** to `main` that closes the issue.

Issues are opened by maintainers only, and pull requests without an assigned issue are closed.
Security problems are reported privately under **Security → Report a vulnerability**, never in public.

## Making your change

Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/clutch.git
```

Go into it:

```bash
cd clutch
```

Create a branch for your change:

```bash
git switch -c fix/short-description
```

- Branch from `main` and target `main`. It's the only long-lived branch, and every merge to it deploys.
- Keep one issue per pull request.
- Use [Conventional Commits](https://www.conventionalcommits.org/) with Clutch's types: `fix(cli): ...`, `feature(frontend): ...`, `docs(root): ...`. Pull requests are squash-merged, so your **pull request title becomes the commit on `main`** and must follow this format too.
- Match the existing style: typed Python, functional React components, the CSS variables in `frontend/src/styles/index.css`, and the monochrome Rich output in the CLI.
- Add tests for backend changes, and include screenshots or terminal output for anything visible.

Setup steps are in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## After you open a pull request

CI lints, tests and builds the backend, frontend and CLI, and all three checks must pass before anything can merge. If `main` moves on while your pull request is open, use **Update branch** so the checks run against the latest code.

A maintainer then reviews it. Push fixes to the same branch rather than opening a new PR. Once approved, it's squash-merged into `main` and deploys.

Please keep conversations in public threads rather than DMs, so everyone can benefit.
