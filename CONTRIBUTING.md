# Contributing to Clutch

Thanks for wanting to help. Code, docs, design ideas and bug reports are all welcome.

## How it works

1. **Start a [Discussion](https://github.com/laypatel13/clutch/discussions).** Questions and bugs go in **Q&A**, feature ideas in **Ideas**. Please search first.
2. **A maintainer opens an issue** once a bug is confirmed or an idea is accepted.
3. **Comment on the issue** to ask for it, and wait to be assigned.
4. **Open a pull request** to `main` that closes the issue.

Only maintainers open issues, and pull requests without an assigned issue are closed.

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

Then:

- Keep one issue per pull request.
- Title your pull request like a commit: `fix(cli): ...`, `feature(frontend): ...` or `docs(root): ...`. Pull requests are squash-merged, so the title becomes the commit on `main`.
- Match the existing style: typed Python, function components in React, the CSS variables in `frontend/src/styles/index.css`, and the plain Rich output in the CLI.
- Add tests for backend changes, and include a screenshot or terminal output for anything visible.

Setup steps are in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md).

## After you open a pull request

CI checks the backend, the web app and the CLI, and all three must pass before anything can merge. If `main` moves ahead while your pull request is open, click **Update branch** so the checks run against the latest code.

A maintainer then reviews it. Push fixes to the same branch instead of opening a new pull request. Once approved, it's squash-merged into `main` and deployed.

Please keep conversations in public threads rather than DMs, so everyone can benefit.
