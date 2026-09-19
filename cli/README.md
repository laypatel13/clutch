# myclutch

**GitHub tracks your work. Clutch tracks you.**

[![PyPI](https://img.shields.io/pypi/v/myclutch?style=flat-square)](https://pypi.org/project/myclutch/)
[![Python](https://img.shields.io/badge/python-3.11+-blue?style=flat-square)](https://python.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](https://github.com/laypatel13/clutch/blob/main/LICENSE)

`myclutch` is the terminal companion for [Clutch](https://clutch-woad.vercel.app), an open-source GitHub activity dashboard. It gives you your streaks, stats, contribution heatmap, coding patterns and AI weekly insight without leaving your shell.

## Install

```bash
pip install myclutch
```

## Sign in

```bash
clutch login
```

This opens GitHub in your browser and hands the token back to the terminal automatically. See [how login works](#how-login-works) for the details.

## Commands

### Authentication

| Command | What it does |
|:--|:--|
| `clutch login` | Sign in with GitHub OAuth |
| `clutch logout` | Sign out and clear saved credentials |
| `clutch whoami` | Show who's currently signed in |

### Activity

| Command | What it does |
|:--|:--|
| `clutch streak` | Current and longest streak, with progress toward your best |
| `clutch stats` | Commits, pull requests, issues and active days |
| `clutch stats --days 7` | The same totals over a custom window, default 30 |
| `clutch heatmap` | Contribution heatmap for the last 12 weeks |
| `clutch heatmap --weeks 26` | Heatmap over a custom number of weeks |
| `clutch patterns` | Best day, consistency score and weekday distribution |

### Repositories and insights

| Command | What it does |
|:--|:--|
| `clutch repos` | Your most recently active repositories |
| `clutch lang` | Language breakdown across your repositories |
| `clutch insight` | AI-generated weekly insight, powered by Llama 3.1 on Groq |

### System

| Command | What it does |
|:--|:--|
| `clutch status` | Sign-in status and API health check |
| `clutch --version` | Show the installed version, also `-v` |

Running `clutch` with no command prints the banner and the full help.

## How login works

`clutch login` starts a temporary local server on port `9876`, opens GitHub OAuth in your browser, and captures the token when GitHub redirects back. There is nothing to copy and paste.

```
$ clutch login

Clutch Login
Opening GitHub in your browser...
Waiting for GitHub authorization...

Logged in as @laypatel13
Welcome to Clutch, Lay Patel!
```

Your token is then saved to `~/.clutch/config.json`, and every other command works without prompting.

## Configuration

By default the CLI talks to the hosted Clutch API at `https://clutch-api-7lw4.onrender.com`.

To point it at a backend you're running locally, set `CLUTCH_API_URL` before signing in:

```bash
export CLUTCH_API_URL=http://localhost:8020
```

Then sign in against it:

```bash
clutch login
```

| Variable | Default | What it's for |
|:--|:--|:--|
| `CLUTCH_API_URL` | `https://clutch-api-7lw4.onrender.com` | The Clutch API the CLI talks to |

Setting up that local backend is covered in [docs/development.md](https://github.com/laypatel13/clutch/blob/main/docs/development.md).

## Links

- [Live dashboard](https://clutch-woad.vercel.app)
- [Source and full documentation](https://github.com/laypatel13/clutch)
- [Questions, bugs and ideas](https://github.com/laypatel13/clutch/discussions)

## License

MIT, © [Lay Patel](https://github.com/laypatel13).
