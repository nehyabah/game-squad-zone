# SquadPot Backend Requirements

This repository contains the **frontend** for SquadPot, a game where users create squads and make weekly picks for NFL matchups. To make the application production ready we need a dedicated backend service. This document outlines everything required to build, test and scale that backend.

## 1. Core Responsibilities

The backend must provide:

1. **User Authentication & Profiles** – secure sign‑up/login, password hashing, JWT sessions, profile management.
2. **Game Data Service** – fetch schedules/teams from API‑Sports (NFL) and cache them; normalize structure to support multiple leagues.
3. **Squads** – create/join squads via invitation code, manage members, and control private/public settings.
4. **Picks** – each user submits 3 spread picks per week; service stores selections, enforces deadlines and validates against game results.
5. **Leaderboard & Stats** – compute weekly and season standings, win/loss records and points system used in the UI.
6. **Admin/Config** – endpoints to manage seasons, weeks, leagues and to trigger manual score recalculations.

## 2. Suggested Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express or Fastify
- **Database**: PostgreSQL (Prisma or TypeORM for ORM)
- **Authentication**: JWT + bcrypt
- **Caching/Queues**: Redis for caching schedules and background jobs
- **Testing**: Jest & Supertest for integration tests
- **Deployment**: Docker containers behind a reverse proxy (NGINX) or managed Kubernetes

## 3. Data Models

| Entity       | Notes |
|--------------|------|
| `User`       | id, username, email, passwordHash, createdAt |
| `Squad`      | id, name, joinCode, ownerId, createdAt |
| `SquadMember`| userId, squadId, role |
| `Game`       | id, league, season, week, homeTeam, awayTeam, spread, startTime, result |
| `Pick`       | id, userId, squadId, gameId, choice(home/away), createdAt |
| `Result`     | gameId, winningTeam, processedAt |

## 4. REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/signup` | Create new account |
| POST   | `/auth/login`  | Authenticate user and issue JWT |
| POST   | `/auth/logout` | (Optional) invalidate refresh token |
| GET    | `/users/me`    | Retrieve current user profile |

### Squads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/squads` | Create squad; returns join code |
| POST   | `/squads/join` | Join squad using join code |
| GET    | `/squads/:id` | Squad details & member list |
| GET    | `/squads/:id/leaderboard` | Weekly/season rankings |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/games` | List games for season/week & league |
| GET    | `/games/:id` | Game details |

### Picks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/picks` | Submit or update picks for a week |
| GET    | `/picks/me` | Get current user’s picks |
| GET    | `/squads/:id/picks` | View squad picks (if allowed) |

### Admin/Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/admin/recalculate` | Trigger leaderboard recomputation |
| PUT    | `/admin/games/:id/result` | Manually set game result |

## 5. Integration with API‑Sports

- Use server‑side cron job or queue worker to fetch upcoming games and final scores.
- Store API key in `NFL_API_KEY` environment variable.
- Normalize data into `Game` records. Add a `league` field so that future leagues (e.g., PFL) are just another value.

## 6. Preparing for Other Leagues (PFL, etc.)

1. **League‑agnostic schema** – `Game`, `Team` and `Pick` must include `league` identifiers.
2. **Modular data fetchers** – implement provider interface; NFL uses API‑Sports today, but PFL might use a different source.
3. **Rules engine** – expose rules (number of picks, scoring) per league so new leagues only require config.
4. **Front‑end coordination** – expose `/leagues` endpoint to list supported leagues so UI can switch context.

## 7. Scaling Notes

- **Stateless services** with JWT allow horizontal scaling behind a load balancer.
- **Database scaling**: start with single Postgres, move to managed cluster with read replicas as traffic grows.
- **Caching**: cache schedule and leaderboard queries in Redis; apply HTTP cache headers for public data.
- **Background workers**: process game result ingestion and leaderboard recalculation asynchronously.
- **Logging & monitoring**: use structured logging (pino/winston), collect metrics (Prometheus + Grafana), configure alerts.
- **CI/CD**: automated tests and linting on each commit, staged deployments.

## 8. Testing Checklist

- Unit tests for services and utility functions.
- Integration tests for each endpoint using mocked DB.
- End‑to‑end tests simulating user flows (signup -> create squad -> submit picks -> view leaderboard).
- Load tests for high‑traffic scenarios (e.g., game‑day submissions).

## 9. Local Development Setup

```bash
# install dependencies
npm install

# run tests
npm test

# lint
npm run lint

# start backend server in dev mode
npm run dev
```

## 10. Deployment & Environment Variables

| Variable        | Description |
|-----------------|------------|
| `DATABASE_URL`  | Postgres connection string |
| `NFL_API_KEY`   | API key for API‑Sports football API |
| `JWT_SECRET`    | Secret for signing tokens |
| `REDIS_URL`     | Redis connection for caching/queues |

Ensure secrets are stored securely (e.g., using environment variables or a secrets manager).

---

This plan should enable the current React frontend to communicate with a robust backend and sets the stage for expanding into additional leagues and large‑scale usage.
