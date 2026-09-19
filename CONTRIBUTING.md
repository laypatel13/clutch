# Contributing to Clutch

Thanks for wanting to help. Code, docs, design ideas and bug reports are all welcome.

## How it works

1. **Start a [Discussion](https://github.com/laypatel13/clutch/discussions).** Questions and bugs go in **Q&A**, feature ideas in **Ideas**. Please search first.
2. **A maintainer creates an issue** if the bug is confirmed or the idea is accepted.
3. **Comment on the issue** to say you'd like to work on it, and wait to be assigned.
4. **Open a pull request** to `develop` that closes the issue.

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

Create a branch from `develop`:

```bash
git checkout -b fix/short-description origin/develop
```

- Branch from `develop` and target `develop` (`main` is the deployed branch).
- Keep one issue per pull request.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `fix(cli): ...`, `feature(frontend): ...`, `docs(root): ...`.
- Match the existing style: typed Python, functional React components, the CSS variables in `frontend/src/styles/index.css`, and the monochrome Rich output in the CLI.
- Add tests for backend changes, and include screenshots or terminal output for anything visible.

Setup steps are in [docs/development.md](./docs/development.md).

## After you open a pull request

A maintainer reviews it. Push fixes to the same branch rather than opening a new PR. Once approved, it's merged into `develop` and ships with the next release to `main`.

Please keep conversations in public threads rather than DMs, so everyone can benefit.
