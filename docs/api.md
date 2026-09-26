# The Clutch API

Clutch's backend is a FastAPI service. The web app and the `myclutch` CLI are both clients of it, and they share the same authentication.

Interactive documentation is generated from the running service at [`/docs`](https://clutch-api-7lw4.onrender.com/docs).

| Environment | Base URL |
|:--|:--|
| Hosted | `https://clutch-api-7lw4.onrender.com` |
| Local | `http://localhost:8020` |

## Authentication

Clutch uses GitHub OAuth 2.0. Sending a browser to `/auth/github` starts the flow; GitHub redirects back to `/auth/github/callback`, which creates or updates the user and issues a JWT.

Every protected endpoint expects that token as a bearer credential:

```
Authorization: Bearer <token>
```

Tokens are valid for seven days by default, set by `ACCESS_TOKEN_EXPIRE_MINUTES`.

## Authentication endpoints

| Method | Endpoint | Auth | Description |
|:--|:--|:--|:--|
| `GET` | `/auth/github` | — | Start the GitHub OAuth flow |
| `GET` | `/auth/github/callback` | — | Finish OAuth and issue a JWT |

## Users

| Method | Endpoint | Auth | Description |
|:--|:--|:--|:--|
| `GET` | `/users/me` | Required | The signed-in user's profile and sync state |
| `GET` | `/users/{username}` | — | A public profile, if that user has made theirs public |
| `PATCH` | `/users/me/settings` | Required | Update settings, including `is_public` |

Profiles are private by default. `/users/{username}` only returns a user who has opted in through `PATCH /users/me/settings`.

## GitHub activity

| Method | Endpoint | Auth | Description |
|:--|:--|:--|:--|
| `GET` | `/github/timeline` | Required | One page of the activity timeline |
| `GET` | `/github/waiting` | Required | Open pull request loops and recent merges, checked live |
| `GET` | `/github/streak` | Required | Current and longest streak, and whether today counts yet |
| `GET` | `/github/heatmap` | Required | Contribution heatmap |
| `GET` | `/github/activity` | Required | Daily activity totals |
| `GET` | `/github/languages` | Required | Language breakdown across repositories |
| `GET` | `/github/repos` | Required | Recently updated repositories |
| `POST` | `/github/events/sync` | Required | Fetch new GitHub events into the timeline |
| `POST` | `/github/sync` | Required | Sync daily activity to the database |
| `POST` | `/github/pulls/sync` | Required | Sync pull requests to the database |

### Query parameters

| Endpoint | Parameter | Default | Notes |
|:--|:--|:--|:--|
| `/github/timeline` | `cursor` | none | Opaque cursor from the previous page |
| `/github/timeline` | `limit` | `40` | Between 1 and 100 |
| `/github/activity` | `days` | `30` | How far back to total |

`/github/waiting` is deliberately not cached. It runs a live GraphQL query against GitHub on every request, because a stale "waiting on you" list is worse than no list at all. Everything else reads from the synced local database.

## Insights

| Method | Endpoint | Auth | Description |
|:--|:--|:--|:--|
| `GET` | `/insights/weekly` | Required | AI weekly insight |
| `GET` | `/insights/summary` | Required | One-line AI summary |
| `GET` | `/insights/patterns` | Required | Detected coding patterns |

These require `GROQ_API_KEY` to be set on the backend. Without it the rest of the API works normally and only these three endpoints are unavailable.

## System

| Method | Endpoint | Auth | Description |
|:--|:--|:--|:--|
| `GET` | `/` | — | Service name and version |
| `GET` | `/health` | — | Liveness |
| `GET` | `/ready` | — | Readiness, including the database connection |
