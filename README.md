# SquadPot Backend Requirements & Architecture

This repository currently hosts the **frontend** for SquadPot.  To deliver a production‑grade experience we need a dedicated backend platform.  The following document captures the requirements, architecture, and operational plan for that service.

## 1. Core Responsibilities
The backend is responsible for the complete game lifecycle:

1. **Authentication & Profiles** – secure sign up/login, password management, email verification and optional 2FA.
2. **Squads & Membership** – create/join squads via invite codes, manage member roles, and expose squad leaderboards.
3. **Picks & Results** – accept weekly spread picks, snapshot lines, lock them at kickoff, and settle against final scores.
4. **Leaderboard & Stats** – compute weekly and season rankings, support global and squad scopes, and expose historical views.
5. **Admin Tools** – manage leagues/seasons/weeks, trigger recalculations, and inspect provider health.

## 2. Suggested Tech Stack
| Layer | Choice | Rationale |
|------|--------|-----------|
| Runtime | **Node.js + TypeScript** | First‑class ecosystem, shared types with frontend. |
| Framework | **Fastify** | High performance, built‑in schema validation, easy plugin model. |
| ORM | **Prisma** | Type‑safe queries and migrations. |
| Database | **PostgreSQL** | Strong relational features, JSON support for audit trails. |
| Cache/Queue | **Redis** + **BullMQ** | Fast caching, background job handling. |
| Auth | **JWT (access) + rotating refresh tokens** | Stateless scaling, revocation support. |
| Validation | **Zod** schemas | Compile‑time + runtime safety. |
| Testing | **Vitest/Jest**, **Supertest**, **k6** | Unit, integration and load tests. |
| Deployment | **Docker** images in Kubernetes or container platform | Predictable, scalable deployment. |

## 3. Data Model
The schema separates core domains and keeps league information normalized.

### Core Entities
| Table | Key Fields & Notes |
|-------|-------------------|
| **User** | `id`, `email`, `passwordHash`, `createdAt`. Constraints: `UNIQUE(email)`; minimal PII. |
| **Squad** | `id`, `name`, `ruleSetId`, `ownerId`, `createdAt`. |
| **SquadMember** | `userId`, `squadId`, `role`, `joinedAt`. Constraints: `UNIQUE(userId, squadId)`; role enum (`owner`, `admin`, `member`). |
| **SquadInvite** | `id`, `squadId`, `code`, `createdBy`, `expiresAtUtc`, `maxUses`, `uses`. |
| **League** | `id`, `code` (e.g., `nfl`), `name`. |
| **Season** | `id`, `leagueId`, `year`. |
| **Week** | `id`, `seasonId`, `number`, `lockAtUtc`. |
| **Team** | `id`, `leagueId`, `name`, `abbrev`, `externalRef`. |
| **Game** | `id`, `seasonId`, `weekId`, `homeTeamId`, `awayTeamId`, `startAtUtc`, `status`, `externalRef`, `homeScore?`, `awayScore?`, `winnerTeamId?`, `finalizedAtUtc?`. |
| **GameLine** | `id`, `gameId`, `source`, `spread`, `total`, `fetchedAtUtc`. Lines are immutable snapshots. |
| **PickSet** | `id`, `userId`, `squadId`, `weekId`, `submittedAtUtc`, `lockedAtUtc`, `tiebreakerScore?`, `status`. Constraints: `UNIQUE(userId, squadId, weekId)` to enforce one submission per user/week. |
| **Pick** | `id`, `pickSetId`, `gameId`, `choice`(`home`/`away`), `spreadAtPick`, `lineSource`, `createdAt`. Constraints: `UNIQUE(pickSetId, gameId)` so a game is picked only once. |
| **GameResultAudit** | `gameId`, `payloadJson`, `processedAtUtc` – immutable trail of provider data. |

### Rules as Data
| Table | Purpose |
|-------|---------|
| **LeagueRuleSet** | `id`, `leagueId`, `name`, `isActive`, `createdAt`. |
| **ScoringRule** | `ruleSetId`, `key`, `value` (e.g., `picksPerWeek`, `winPoints`, `lockOffsetMinutes`). Squads reference a `ruleSetId` to vary formats without code changes. |

### Notable Constraints & Checks
- Foreign keys with `ON UPDATE CASCADE` and `ON DELETE RESTRICT` for all relationships.
- `CHECK(choice IN ('home','away'))` on `Pick`.
- `CHECK(spreadAtPick IS NOT NULL)` for settled picks.
- Store evaluated lock time on `PickSet` so shifting schedules do not reopen picks.

## 4. REST API Surface
All endpoints are versioned under `/v1` and return RFC 7807 `application/problem+json` errors.  List endpoints use `?limit=&cursor=` for pagination and mutating `POST`s honor `Idempotency-Key` headers.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/auth/signup` | Create account. |
| `POST` | `/v1/auth/login` | Issue access & refresh tokens. |
| `POST` | `/v1/auth/refresh` | Rotate refresh token. |
| `POST` | `/v1/auth/forgot-password` | Send password reset email. |
| `POST` | `/v1/auth/reset-password` | Reset password via token. |
| `POST` | `/v1/auth/verify-email` | Confirm email address. |
| `POST` | `/v1/auth/2fa/verify` | Verify TOTP code (optional). |
| `GET`  | `/v1/leagues` | List supported leagues. |
| `GET`  | `/v1/seasons?league=` | Seasons for a league. |
| `GET`  | `/v1/weeks?season=` | Weeks for a season. |
| `GET`  | `/v1/teams?league=` | Team directory. |
| `POST` | `/v1/squads` | Create a squad. |
| `POST` | `/v1/squads/:id/invites` | Generate invite code with expiry/uses. |
| `GET`  | `/v1/squads/:id/members` | List squad members. |
| `POST` | `/v1/squads/:id/members/:userId/role` | Update member role. |
| `GET`  | `/v1/games?weekId=&teamId=&status=` | Query games. |
| `POST` | `/v1/picks` | Submit weekly picks (uses `Idempotency-Key`). |
| `GET`  | `/v1/picks/me?season=&week=&squadId=` | Retrieve user picks. |
| `GET`  | `/v1/leaderboards?scope=squad|global&week=` | Leaderboard views (cacheable). |
| `POST` | `/v1/admin/weeks/:id/lock` | Force lock a week. |
| `POST` | `/v1/admin/recalc/:scope` | Trigger leaderboard recalculation. |
| `GET`  | `/v1/admin/provider/health` | Proxy check to external data provider. |
| `GET`  | `/healthz` / `/readyz` | Liveness/readiness checks. |
| `GET`  | `/metrics` | Prometheus metrics endpoint. |

## 5. External Data Integration
- Primary source: **API‑Sports NFL API**.  Credentials supplied via `API_SPORTS_KEY`.
- Workers poll schedules and results, writing raw payloads to `GameResultAudit`.
- Implement a provider interface so additional leagues can plug in new APIs without schema changes (`DataProvider(leagueId, name, baseUrl)`).
- Snapshot point spreads through `GameLine` and embed the used line on each pick.

## 6. Multi‑League Readiness
- League/Season/Week/Team tables isolate league information; games reference seasons to avoid drift.
- Rule sets are data‑driven, allowing different pick counts or scoring per squad or league.
- Provider transformers convert upstream payloads into canonical models so PFL or other leagues can be added with configuration only.

## 7. Scaling, Caching & Background Jobs
- **Stateless services** with short‑lived access tokens enable horizontal scaling behind a load balancer.
- **Redis caching** patterns:
  - `sched:{league}:{season}:{week}` – schedules.
  - `lb:{scope}:{squadId|global}:{season}:{week|all}` – leaderboards (Redis sorted sets).
  - `user:{id}` – user profile snapshots.
  - `idem:{key}` – idempotency keys (TTL 24h).
- **BullMQ jobs**:
  - `fetch:schedules` & `fetch:results` (cron).
  - `settle:game:{gameId}` on final scores.
  - `recalc:{scope}` for admin/manual recalculations.
- **Observability**: structured logs (pino), OpenTelemetry traces with `x-request-id`, Prometheus metrics and alerting on queue lag or error rates.
- **Graceful shutdown**: handle `SIGTERM`, drain HTTP, pause workers, flush logs and close DB/Redis pools.

## 8. Validation & Security Notes
- Request validation via Zod schemas compiled to Fastify routes.
- Short‑lived access JWTs (5–15 m) with refresh tokens stored as httpOnly cookies; server stores hashed token with device info for revocation.
- Role‑based access control enforced server‑side; JWT carries minimal role claims.
- Rate limiting per IP + user, helmet headers, strict CORS allowlist, and CSRF tokens if cookies are used for auth.

## 9. Testing Checklist
- **Unit** – services, utilities, rule evaluation.
- **Integration** – REST endpoints with Postgres test db and mocked providers.
- **End‑to‑End** – full flow (auth → create squad → submit picks → leaderboard).
- **Contract** – OpenAPI schema fuzzing via Schemathesis.
- **Property‑based** – scoring/settlement invariants using fast-check.
- **Time‑travel** – fake timers to test locking logic.
- **Load** – k6 scripts targeting pick submissions during pre‑kickoff spikes.

## 10. Local Development
```bash
# install deps
npm install

# start services (Postgres, Redis, Mailhog, fake provider)
docker compose up -d

# run database migrations
npm run prisma:migrate

# seed demo data
npm run seed

# run linting & type checks
npm run lint
npm run typecheck

# start dev server
npm run dev
```

## 11. Deployment & Environment Variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. |
| `REDIS_URL` | Redis connection for cache and BullMQ. |
| `JWT_SECRET` | Signing secret for access tokens. Rotate regularly. |
| `REFRESH_TOKEN_SECRET` | Separate secret for refresh tokens. |
| `API_SPORTS_KEY` | API‑Sports provider key. |
| `NODE_ENV` | `development`, `test`, or `production`. |
| `PORT` | HTTP port (default 3000). |

Secrets should be managed via an external secret manager and never committed.  Production deployments run as Docker containers with environment variables injected at runtime.

## 12. Backend File Structure
The backend repository is organized for production readiness and scale:

```text
backend/
├── package.json
├── tsconfig.json
├── openapi.yaml
├── Dockerfile                     # multi-stage build
├── docker-compose.yml             # Postgres, Redis, Mailhog, fake provider
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts                     # build Fastify instance
│   ├── main.server.ts             # HTTP server bootstrap
│   ├── main.worker.ts             # background job runner
│   ├── core/                      # shared utilities
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── rbac.ts
│   ├── config/                    # centralized env & config loading
│   │   ├── env.ts                 # zod schema + parsing
│   │   └── index.ts               # no direct process.env elsewhere
│   ├── plugins/                   # Fastify plugins
│   │   ├── swagger.ts
│   │   ├── auth-jwt.ts
│   │   ├── cors.ts
│   │   ├── helmet.ts
│   │   ├── rate-limit.ts
│   │   ├── metrics.ts
│   │   └── health.ts
│   ├── modules/                   # feature modules
│   │   ├── auth/
│   │   │   ├── auth.schema.ts
│   │   │   ├── auth.dto.ts
│   │   │   ├── auth.repo.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   ├── squads/
│   │   │   ├── squads.schema.ts
│   │   │   ├── squads.dto.ts
│   │   │   ├── squads.repo.ts
│   │   │   ├── squads.service.ts
│   │   │   ├── squads.controller.ts
│   │   │   └── squads.routes.ts
│   │   ├── picks/
│   │   │   ├── picks.schema.ts
│   │   │   ├── picks.dto.ts
│   │   │   ├── picks.repo.ts
│   │   │   ├── picks.service.ts
│   │   │   ├── picks.controller.ts
│   │   │   └── picks.routes.ts
│   │   ├── leaderboards/
│   │   │   ├── leaderboards.schema.ts
│   │   │   ├── leaderboards.dto.ts
│   │   │   ├── leaderboards.repo.ts
│   │   │   ├── leaderboards.service.ts
│   │   │   ├── leaderboards.controller.ts
│   │   │   └── leaderboards.routes.ts
│   │   ├── games/
│   │   │   ├── games.schema.ts
│   │   │   ├── games.dto.ts
│   │   │   ├── games.repo.ts
│   │   │   ├── games.service.ts
│   │   │   ├── games.controller.ts
│   │   │   └── games.routes.ts
│   │   └── ...additional modules...
│   ├── jobs/                      # BullMQ queues and workers
│   │   ├── queues.ts
│   │   ├── workers/
│   │   │   ├── settleGame.worker.ts
│   │   │   └── ...
│   │   ├── schedulers/
│   │   │   ├── fetchSchedules.scheduler.ts
│   │   │   └── fetchResults.scheduler.ts
│   │   └── utils/
│   │       └── jobHelpers.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── load/
│   ├── factories/
│   └── mocks/
└── scripts/
    ├── seed.ts
    ├── migrate.ts
    └── recalc.ts
```

This layout separates concerns for easier scaling:
- Dedicated `app.ts`, `main.server.ts`, and `main.worker.ts` keep HTTP and background workloads isolated.
- A `core/` layer centralizes cross-cutting utilities and enforces a single place for auth, validation, RBAC, and logging.
- Environment variables are parsed once in `config/` with Zod, avoiding unchecked `process.env` reads.
- Fastify plugins live under `plugins/` so middleware like CORS, Helmet, rate limiting, metrics, and Swagger remain composable.
- Feature `modules/` follow a repeatable schema–dto–repo–service–controller–routes pattern, keeping business logic testable and encapsulated.
- Background jobs are idempotent and organized into `queues.ts`, `workers/`, `schedulers/`, and shared `utils/`.
- `tests/` holds unit, integration, e2e, and load suites plus factories and mocks for rich test coverage.
- `scripts/` contains developer DX helpers, while `openapi.yaml` drives a contract-first workflow.

---
This plan elevates the backend from a minimal prototype to a robust, league‑agnostic platform capable of powering SquadPot as it grows.

