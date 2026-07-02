<div align="center">

# ⚡ clutch-cli

### *The CLI companion for Clutch — GitHub tracks your work. Clutch tracks you.*

[![PyPI](https://img.shields.io/pypi/v/clutch-cli?style=for-the-badge&color=green)](https://pypi.org/project/clutch-cli)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](https://github.com/laypatel13/clutch/blob/main/LICENSE)

</div>

---

`clutch-cli` is the terminal companion for [Clutch](https://clutch-woad.vercel.app) — an open-source AI-powered developer activity dashboard. Get your GitHub streaks, stats, coding patterns, and AI insights without leaving your terminal.

## Installation

```bash
pip install clutch-cli
```

## Quick Start

```bash
# Login via GitHub (opens browser automatically, no copy-paste needed)
clutch login

# Check your streak
clutch streak

# View your stats
clutch stats

# Get your AI weekly insight
clutch insight
```

## Commands

| Command | Description |
|---|---|
| `clutch login` | Login via GitHub OAuth (fully automatic) |
| `clutch logout` | Logout and clear saved credentials |
| `clutch whoami` | Show currently logged-in user |
| `clutch streak` | Current and longest commit streak |
| `clutch stats` | Activity stats — commits, PRs, issues, active days |
| `clutch stats --days 7` | Stats for a custom time range |
| `clutch heatmap` | ASCII contribution heatmap for the last 12 weeks |
| `clutch heatmap --weeks 20` | Contribution heatmap for a custom number of weeks |
| `clutch repos` | Your most recently active repositories |
| `clutch insight` | AI-generated weekly insight (powered by Groq Llama) |
| `clutch patterns` | Coding patterns — best day, consistency score, day distribution |
| `clutch status` | Login status and API health check |
| `clutch --version` | Show installed version |

## How Login Works

`clutch login` spins up a temporary local server on port `9876`, opens GitHub OAuth in your browser, and automatically captures the token when GitHub redirects back. No copy-pasting required.

```
$ clutch login

⚡ Clutch Login
Opening GitHub in your browser...
Waiting for GitHub authorization...

✅ Logged in as @laypatel13
Welcome to Clutch, Lay Patel!
```

After the first login, your token is saved in `~/.clutch/config.json` and all commands work silently.

## Configuration

By default the CLI talks to the hosted Clutch API. To point it at a local backend:

```bash
export CLUTCH_API_URL=http://localhost:8000
clutch login
```

## Links

- 🌐 [Live Dashboard](https://clutch-woad.vercel.app)
- 📖 [Full Documentation](https://github.com/laypatel13/clutch)
- 🐛 [Report a Bug](https://github.com/laypatel13/clutch/issues)

## License

MIT © [Lay Patel](https://github.com/laypatel13)
