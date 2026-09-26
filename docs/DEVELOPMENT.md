# Running Clutch locally

How to run the backend, the web app and the CLI on your own machine, and how to run the checks. For how changes get proposed and reviewed, see [CONTRIBUTING.md](../CONTRIBUTING.md).

**You'll need** Python 3.11+, Node.js 20.19+ or 22.12+, and a GitHub account. A [Groq API key](https://console.groq.com) is optional and only needed for the AI weekly insight.

Locally, the API runs on port **8020** and the web app on port **5180**.

## 1. Create a GitHub OAuth app

Sign-in goes through GitHub, so Clutch needs its own OAuth app. Create one at [github.com/settings/developers](https://github.com/settings/developers) with these values:

| Field | Value |
|:--|:--|
| Homepage URL | `http://localhost:5180` |
| Authorization callback URL | `http://localhost:8020/auth/github/callback` |

Copy the **Client ID**, then generate and copy a **Client Secret**.

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

Install the dependencies, including the test and lint tools:

```bash
pip install -r requirements-dev.txt
```

Create your settings file:

```bash
cp .env.example .env
```

Open `backend/.env` and fill in these values. The rest are already set for local use.

| Variable | Value |
|:--|:--|
| `GITHUB_CLIENT_ID` | The Client ID from step 1 |
| `GITHUB_CLIENT_SECRET` | The Client Secret from step 1 |
| `SECRET_KEY` | Any long random string. It signs login tokens. |
| `GROQ_API_KEY` | Optional. Add this line to enable the AI weekly insight. |

Start the API:

```bash
uvicorn app.main:app --reload --port 8020
```

The API is now running at `http://localhost:8020`, with interactive docs at [`/docs`](http://localhost:8020/docs). The endpoints are listed in [API.md](./API.md).

## 3. Start the web app

In a second terminal, from the repository root, go to the frontend:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5180` and sign in with GitHub. The web app talks to the API at `http://localhost:8020` by default.

## 4. Use the CLI (optional)

From `cli/`, install the CLI from your local copy:

```bash
pip install -e .
```

Point it at your local API:

```bash
export CLUTCH_API_URL=http://localhost:8020
```

Then sign in:

```bash
clutch login
```

Every command is listed in [cli/README.md](../cli/README.md).

## 5. Run the checks

These are the same checks CI runs on every pull request.

Set up the Git hooks once, from the repository root, so lint and formatting run on every commit:

```bash
pre-commit install
```

Run every hook across the whole repository:

```bash
pre-commit run --all-files
```

Run the backend tests, from `backend/`:

```bash
pytest
```

Lint the web app, from `frontend/`:

```bash
npm run lint
```

Type-check and build the web app, from `frontend/`:

```bash
npm run build
```

## Project structure

```text
clutch/
├── backend/                  FastAPI service
│   ├── app/
│   │   ├── main.py           app setup, routers and health checks
│   │   ├── configuration.py  settings from .env
│   │   ├── dependencies.py   sign-in checks and the GitHub client
│   │   ├── models/           database tables
│   │   ├── routers/          auth, stats, timeline, waiting, users, insights
│   │   └── services/         the logic behind each router, plus shared GitHub helpers
│   └── tests/
├── frontend/                 React + TypeScript web app
│   ├── public/               favicon, home-screen icon, paper textures
│   └── src/
│       ├── pages/            Landing, Today, Waiting, public profile
│       ├── components/       dashboard, timeline, waiting, layout, shared UI
│       ├── hooks/ contexts/  data loading and sign-in state
│       └── styles/index.css  the design system
├── cli/                      the myclutch package (Typer + Rich)
│   └── clutch_cli/           one folder per command group
└── docs/                     this guide and the API reference
```
