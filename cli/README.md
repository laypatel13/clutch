# myclutch

**GitHub tracks your work. Clutch tracks you.**

[![PyPI](https://img.shields.io/pypi/v/myclutch)](https://pypi.org/project/myclutch/)
[![Python](https://img.shields.io/pypi/pyversions/myclutch)](https://pypi.org/project/myclutch/)
[![License](https://img.shields.io/github/license/laypatel13/clutch)](https://github.com/laypatel13/clutch/blob/main/LICENSE)

`myclutch` is the command line for [Clutch](https://www.myclutch.xyz). It shows your GitHub streaks, stats, heatmap, coding patterns and AI weekly insight in your terminal.

## Install

```bash
pip install myclutch
```

## Sign in

```bash
clutch login
```

This opens GitHub in your browser. Once you approve, the CLI signs you in by itself, so there's nothing to copy and paste.

## Commands

| Command | What it does |
|:--|:--|
| `clutch login` | Sign in with GitHub |
| `clutch logout` | Sign out |
| `clutch whoami` | Show who's signed in |
| `clutch streak` | Your current and longest streak |
| `clutch stats` | Commits, pull requests, issues and active days over the last 30 days. Change the window with `--days 7`. |
| `clutch heatmap` | Your contribution heatmap for the last 12 weeks. Change it with `--weeks 26`. |
| `clutch patterns` | Your best day, consistency score and weekday breakdown |
| `clutch repos` | Your most recently active repositories |
| `clutch lang` | The languages across your repositories |
| `clutch insight` | An AI summary of your week |
| `clutch status` | Whether you're signed in and the API is up. Add `--json` for machine-readable output. |
| `clutch --version` | The installed version |

Run `clutch` on its own to see the help.

## How sign-in works

`clutch login` starts a small local server on port `9876` and opens GitHub in your browser. When GitHub sends you back, the server catches your login token and saves it to `~/.clutch/config.json`. Every other command then uses that token.

## Using your own backend

The CLI talks to the hosted Clutch API at `https://clutch-api-7lw4.onrender.com`.

To use a backend running on your own machine, set `CLUTCH_API_URL` first:

```bash
export CLUTCH_API_URL=http://localhost:8020
```

Then sign in against it:

```bash
clutch login
```

Setting up a local backend is covered in [docs/DEVELOPMENT.md](https://github.com/laypatel13/clutch/blob/main/docs/DEVELOPMENT.md).

## Links

- [Clutch web app](https://www.myclutch.xyz)
- [Source code](https://github.com/laypatel13/clutch)
- [Questions, bugs and ideas](https://github.com/laypatel13/clutch/discussions)

## License

MIT, made by [Lay Patel](https://github.com/laypatel13).
