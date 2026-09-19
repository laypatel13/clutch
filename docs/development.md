# Running Clutch locally

The full setup for working on Clutch: the backend, the frontend, the CLI and the tests. For how changes get proposed and reviewed, see [CONTRIBUTING.md](../CONTRIBUTING.md).

**You'll need** Python 3.11+, Node.js 20.19+, a [GitHub OAuth app](https://github.com/settings/developers), and optionally a [Groq API key](https://console.groq.com) for AI insights.

Clutch runs on fixed local ports so they don't collide with other projects: the API on **8020** and the web app on **5180**. Both are pinned, so keep them consistent across the OAuth app, `backend/.env` and Vite.

## 1. Create a GitHub OAuth app

Register a new OAuth app at [github.com/settings/developers](https://github.com/settings/developers) with these values:

| Field | Value |
|:--|:--|
| Homepage URL | `http://localhost:5180` |
| Authorization callback URL | `http://localhost:8020/auth/github/callback` |

Keep the **Client ID** and generate a **Client Secret**.

## 2. Start the backend

From the repository root, go to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on macOS or Linux:

```bash
source venv/bin/activate
```

Or on Windows:

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

Then fill in these values in `backend/.env`:

| Variable | Example | Notes |
|:--|:--|:--|
| `DATABASE_URL` | `sqlite:///./clutch.db` | |
| `SECRET_KEY` | any long random string | Signs the JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Seven days |
| `GITHUB_CLIENT_ID` | from your OAuth app | |
| `GITHUB_CLIENT_SECRET` | from your OAuth app | |
| `GITHUB_REDIRECT_URI` | `http://localhost:8020/auth/github/callback` | Must match the OAuth app exactly |
| `FRONTEND_URL` | `http://localhost:5180` | Used for CORS and the post-login redirect |
| `GROQ_API_KEY` | optional | Add it to enable AI insights |

Start the API on port 8020:

```bash
uvicorn app.main:app --reload --port 8020
```

The API is now at `http://localhost:8020`, with interactive docs at [`/docs`](http://localhost:8020/docs). The endpoint reference is in [docs/api.md](./api.md).

## 3. Start the frontend

In a new terminal, from the repository root, go to the frontend:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Point the app at your local API:

```bash
echo "VITE_API_URL=http://localhost:8020" > .env
```

Start the dev server:

```bash
npm run dev
```

Vite is pinned to port 5180 in `vite.config.ts`, so this always serves on `http://localhost:5180`. Open it and sign in with GitHub.

## 4. Run the tests

Backend tests, from `backend/` with the virtual environment active:

```bash
pytest
```

Frontend build, from `frontend/`:

```bash
npm run build
```

Frontend lint, from `frontend/`:

```bash
npm run lint
```

## 5. Point the CLI at your local backend

From `cli/`, install the package in editable mode:

```bash
pip install -e .
```

Tell the CLI where the local API is:

```bash
export CLUTCH_API_URL=http://localhost:8020
```

Then sign in against it:

```bash
clutch login
```

Login opens a temporary local server on port `9876` to catch the OAuth redirect. The full command reference is in [cli/README.md](../cli/README.md).

## Project structure

```text
clutch/
├── backend/                  FastAPI service
│   ├── app/
│   │   ├── main.py           app, CORS, routers, health checks
│   │   ├── configuration.py  settings from .env
│   │   ├── dependencies.py   JWT auth and the GitHub client
│   │   ├── models/           users, activity, events, pull requests, insights
│   │   ├── routers/          auth, github, users, insights
│   │   └── services/         activity sync, timeline, waiting, GitHub, AI insights
│   └── tests/
├── frontend/                 React + TypeScript web app
│   ├── public/               favicon, icons, paper textures
│   └── src/
│       ├── pages/            Landing, Today, Waiting, public profile
│       ├── components/       timeline, waiting, layout, shared UI
│       ├── hooks/ contexts/  data fetching and auth state
│       └── styles/index.css  the design system
├── cli/                      the myclutch package (Typer + Rich)
│   └── clutch_cli/           auth, activity, repositories, insights, system
└── docs/                     this guide and the API reference
```
