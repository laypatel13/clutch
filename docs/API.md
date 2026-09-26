# Clutch API

The backend is a FastAPI service. The web app and the `myclutch` CLI both use it, with the same sign-in.

The running service also has interactive docs at [`/docs`](https://clutch-api-7lw4.onrender.com/docs).

| Where | Base URL |
|:--|:--|
| Hosted | `https://clutch-api-7lw4.onrender.com` |
| Local | `http://localhost:8020` |

## Signing in

Clutch uses GitHub OAuth. Opening `/auth/github` in a browser starts it. GitHub then sends the user back to `/auth/github/callback`, which creates or updates their account and returns a login token (a JWT).

Endpoints marked **Required** below need that token in the request header:

```
Authorization: Bearer <token>
```

A token lasts seven days, set by `ACCESS_TOKEN_EXPIRE_MINUTES`.

| Method | Endpoint | Auth | What it does |
|:--|:--|:--|:--|
| `GET` | `/auth/github` | | Starts GitHub sign-in |
| `GET` | `/auth/github/callback` | | Finishes sign-in and returns a token |

## Users

| Method | Endpoint | Auth | What it does |
|:--|:--|:--|:--|
| `GET` | `/users/me` | Required | The signed-in user's profile |
| `GET` | `/users/{username}` | | A user's public profile |
| `PATCH` | `/users/me/settings` | Required | Updates settings, such as `is_public` |

`/users/{username}` only returns users whose `is_public` setting is on. It is on for new accounts, and can be turned off with `PATCH /users/me/settings`.

## GitHub

| Method | Endpoint | Auth | What it does |
|:--|:--|:--|:--|
| `GET` | `/github/timeline` | Required | One page of the activity timeline |
| `POST` | `/github/events/sync` | Required | Saves new GitHub events for the timeline |
| `GET` | `/github/waiting` | Required | Pull requests waiting on the user, and recent merges |
| `GET` | `/github/streak` | Required | Current and longest streak |
| `GET` | `/github/heatmap` | Required | Contribution heatmap |
| `GET` | `/github/activity` | Required | Daily activity totals |
| `GET` | `/github/languages` | Required | Languages across the user's repositories |
| `GET` | `/github/repos` | Required | Recently updated repositories |
| `POST` | `/github/sync` | Required | Saves daily activity totals |
| `POST` | `/github/pulls/sync` | Required | Saves the user's pull requests |

The timeline is read from events saved in the database, which `POST /github/events/sync` keeps up to date. Every other `GET` here asks GitHub live on each request.

| Endpoint | Parameter | Default | Notes |
|:--|:--|:--|:--|
| `/github/timeline` | `cursor` | none | The `next_cursor` from the previous page |
| `/github/timeline` | `limit` | `40` | Between 1 and 100 |
| `/github/activity` | `days` | `30` | How many days back to count |

## Insights

| Method | Endpoint | Auth | What it does |
|:--|:--|:--|:--|
| `GET` | `/insights/weekly` | Required | An AI summary of the user's week |
| `GET` | `/insights/patterns` | Required | The user's coding patterns |
| `GET` | `/insights/summary` | Required | Not implemented yet |

`/insights/weekly` needs `GROQ_API_KEY` set on the backend. Everything else works without it.

## System

| Method | Endpoint | Auth | What it does |
|:--|:--|:--|:--|
| `GET` | `/` | | Service name and version |
| `GET` | `/health` | | Whether the service is running |
| `GET` | `/ready` | | Whether the service can reach its database |
