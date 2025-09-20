# RedditPilot – Deep Project Context

Date: 2025-09-20

This document captures the project architecture, data models, endpoints, environment, and key flows so future changes are safe and consistent. Treat it as the single source of truth for how things work.

## Non‑negotiable operating rules (read first)

1) Supabase CRUD from frontend only
- All create/read/update/delete operations against Supabase MUST be performed directly from the frontend (via `@supabase/supabase-js`).
- Backend/API routes MUST NOT perform Supabase CRUD unless explicitly approved in writing for a specific exception.

2) API routes are only for Reddit/external fetches
- API routes (both Vercel serverless and local Express) exist solely to interact with Reddit.
- Do not add business logic or database CRUD to API routes unless explicitly specified otherwise.

3) No rewrites or alternatives unless asked
- Do not rewrite existing functionality/flows or introduce alternative implementations unless explicitly requested.
- If a change appears to conflict with these rules, surface it for approval instead of implementing it.

Enforcement notes
- Code reviews should reject any new server-side Supabase CRUD.
- Prefer updating frontend flows using the established Supabase client and RLS.
- Existing server-side CRUD endpoints (documented below) are considered legacy/frozen. Maintain only if explicitly asked.

## High-level architecture

- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui
- Auth: Supabase Auth (client-side) via `src/lib/supabase.ts` and `src/contexts/AuthContext.tsx`
- Data store: Supabase (Postgres) with RLS
- Backend:
  - Serverless functions under `api/` (Vercel functions) – external integrations only (e.g., Reddit). No Supabase CRUD per rules above.
  - Local Express server under `server/` – utility/external-API proxy (Reddit analytics and timeline suggestion helper) used in dev
- Deployment: Vercel with rewrites serving `index.html` for SPA routes

Key implication: There are two “backend surfaces” in this repo. They are used only for Reddit/external access per rules above. Supabase data access occurs from the frontend, not the backend. Existing serverless CRUD is legacy/frozen and must not be extended without explicit approval.

## Folder map

- `api/` – Vercel Serverless API routes (production)
  - `_lib/auth.ts` – shared auth + Supabase client and rate limit helpers
  - `projects.ts` – POST create project + background analytics + timeline save
  - `projects-list.ts` – GET list projects with progress
  - `timeline.ts` – GET timeline by projectId
  - `timeline-update.ts` – PATCH update a timeline item status
  - `analytics.ts` – GET subreddit analytics (from Supabase cache)
- `server/` – Express server for dev/external endpoints
  - `index.ts` – app bootstrap and auth shim, health
  - `routes/projects.ts` – POST `/api/reddit/subreddit-analytics` (fetches comprehensive analytics from Reddit API)
  - `routes/timeline.ts` – POST `/api/reddit/generate-timeline` (generates phases/tasks suggestions)
  - `routes/analytics.ts` – (present; see file for details)
- `src/` – Frontend application
  - `contexts/AuthContext.tsx` – Supabase auth provider (Google OAuth)
  - `lib/supabase.ts` – Supabase client; requires VITE_SUPABASE_URL/ANON_KEY
  - `lib/api-client.ts` – typed client for talking to backend (`/api` in prod, `http://localhost:3001/api` in dev)
  - `lib/api/*` – source utilities used by serverless functions (reddit client, timeline generator)
  - `pages/*` – app pages (Dashboard, Timeline, Analytics, etc.)
- `supabase/migrations/001_initial_schema.sql` – database schema + RLS

## Runtime routing

- Vercel (`vercel.json`):
  - `functions: api/*.ts` with @vercel/node runtime
  - Rewrites:
    - `/api/(.*)` → serverless functions
    - SPA fallback → `index.html`
- Local dev scripts (`package.json`):
  - `npm run dev` → Vite frontend on port 2040
  - `npm run dev:server` → Nodemon running Express server on port 3001
  - `npm run dev:full` → concurrent frontend + local server

Frontend API base:
- In dev: `http://localhost:3001/api` (Express)
- In prod: `/api` (Vercel serverless)

## Environment variables

Required (Frontend + Serverless):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Optional fallbacks used by serverless (`api/_lib/auth.ts`):
- SUPABASE_URL
- SUPABASE_ANON_KEY

Express Reddit analytics (server/routes/projects.ts):
- REDDIT_CLIENT_ID
- REDDIT_CLIENT_SECRET

General:
- PORT (for Express, defaults to 3001)

Note: Do NOT commit real secrets. Keep them in a local `.env` file (root) for dev, and set project envs in Vercel for production.

## Database schema (Supabase)

Tables:
- projects
  - id (uuid PK)
  - user_id (uuid → auth.users.id)
  - name, description
  - karma_level (1–5)
  - target_subreddits (text[])
  - status: pending | analyzing | ready | active | completed | error (default pending)
  - timezone (default UTC)
  - created_at, updated_at
- subreddit_analytics
  - subreddit (unique)
  - subscriber_count, active_users
  - activity_heatmap (7x24 as JSONB)
  - best_posting_day (0=Sun..6=Sat), best_posting_hour (0..23 UTC)
  - top_posts (JSONB array)
  - avg_engagement_score (DECIMAL)
  - last_updated
- project_timelines
  - id, project_id, user_id
  - timeline_data (JSONB) – supports two formats:
    - Legacy: { items: TimelineItem[] }
    - New: phases[] with tasks[]
  - generated_at

Indexes present on user_id, status, subreddit, last_updated, project_id.

RLS:
- projects: user can only access own rows
- project_timelines: user can only access own rows
- subreddit_analytics: shared/public (no RLS)

## Serverless endpoints (production)

Legacy notice: The endpoints below include server-side Supabase access and are FROZEN. Do not add new CRUD to serverless. New features MUST use frontend-only Supabase access. API routes are reserved for Reddit/external fetches unless explicitly approved otherwise.

All except `/api/analytics` require Authorization: Bearer <supabase_jwt>.

- POST `/api/projects`
  - Body: { name, description?, karma, targetSubreddits[], timezone? }
  - Creates project (status=analyzing), 201 response with project
  - Background: fetch analytics (cached/compute), generate timeline (90 days), insert `project_timelines`, update project status → ready
  - Rate limit: 5/min/user
- GET `/api/projects-list`
  - Returns user’s projects with computed progress (from timeline)
- GET `/api/timeline?projectId=uuid`
  - Retrieves timeline for user’s project (requires project status ready/active)
- PATCH `/api/timeline-update?projectId=uuid`
  - Body: { itemId, status: pending|completed|skipped }
  - Updates item status and sets project status to active on first completion
- GET `/api/analytics?subreddit=<name>`
  - Public; returns cached analytics from `subreddit_analytics`

Implementation notes:
- `api/projects.ts` uses `src/lib/api/reddit-client.ts` and `src/lib/api/timeline-generator.ts` for analysis/generation
- Cached analytics are fresh if < 30 days; otherwise refreshed and upserted

## Local server endpoints (dev/external helpers)

- GET `/api/health` → { status, timestamp }
- POST `/api/reddit/subreddit-analytics`
  - Body: { subreddits: string[] }
  - Validates each, fetches comprehensive analytics from Reddit (OAuth if creds present, fallback to public)
  - Returns per-subreddit success/error payloads
  - Rate limit: 10/min/user
- POST `/api/reddit/generate-timeline`
  - Body: { projectId, subreddits: string[], karmaLevel, analytics?, totalDays? }
  - Returns generated phases/tasks with UTC `scheduled_at` fields and conflict avoidance

Note: These routes are not wired in Vercel; they run only when `npm run dev:server` is active.

Per rules: These endpoints may interact with Reddit/external services only. They must NOT perform Supabase CRUD.

## Analytics and timeline logic

Reddit analytics (two implementations):
- `src/lib/api/reddit-client.ts` (used by serverless):
  - Scrapes via public endpoints, with 2s rate limiting and basic aggregation
  - Produces: subscriber_count, active_users, activity_heatmap (weighted by score+comments), best day/hour, top 5 posts, avg_engagement_score
- `server/routes/projects.ts` (dev helper):
  - OAuth-based requests when creds present, pulls multi-page top posts, calculates richer analytics and keywords

Timeline generation:
- `src/lib/api/timeline-generator.ts` (serverless)
  - 90-day plan; balances posts vs engagement based on karma level
  - Max 2 posts/day; cycles templates (launch, update, showcase, ama, milestone)
  - Simplified timezone handling (uses user local via naive offset)
- `server/routes/timeline.ts` (dev helper)
  - Generates detailed phased plan with UTC `scheduled_at`
  - Enforces: max 2 posts/day, spacing between posts, subreddit cooldowns, engagement scheduling, and deterministic templates

Timeline storage formats:
- New: phases array with tasks, used by Express generator
- Legacy: { items: [] }, produced by serverless generator
- Consumers (e.g., `api/projects-list.ts`, `api/timeline-update.ts`) are compatible with both.

## Frontend integration

- Auth: Google OAuth via Supabase; `AuthContext` tracks session and exposes `session.access_token` for API calls
- API client: `src/lib/api-client.ts`
  - Base URL picks `/api` in prod or `http://localhost:3001/api` in dev
  - Use this client for Reddit/external service calls only (e.g., analytics fetch, timeline suggestion). Do not route Supabase CRUD through API.
  - Be careful: some path shapes differ (serverless uses query params for projectId; client helpers for dev server have path segments). Keep clients aligned to serverless for production.

## Gotchas and consistency checks

- Dual backends:
  - Production uses Vercel serverless only; Express routes are dev helpers. Per rules, these are for Reddit/external only.
- Environment source:
  - Serverless auth helper reads VITE_SUPABASE_* or SUPABASE_*; set both in Vercel to be safe. Frontend requires VITE_*.
- Timeline formats:
  - Both legacy and new formats exist; any new consumers should handle both until a migration is done.
- Timezones:
  - Serverless generator does a naive conversion; Express generator uses UTC `scheduled_at`. Frontend should treat `scheduled_at` as canonical and convert to user TZ on display.
- Rate limits:
  - In-memory maps used for rate-limiting in both backends. In production, consider Redis to avoid cold-start resets.
- Reddit API:
  - Public scraping can break or be rate-limited. Prefer OAuth creds via server route when possible for heavy analysis. Serverless currently uses public endpoints.
- RLS:
  - Ensure JWT passed to serverless endpoints is Supabase session token; otherwise queries will be unauthorized under RLS policies.
- Rule adherence:
  - Never add Supabase CRUD to any API route; perform all DB access from the frontend Supabase client.
  - API routes are limited to Reddit/external integrations unless explicitly approved.
  - Do not rewrite existing features or introduce alternative implementations without an explicit request.

## Local development

- Prereqs: Node 18+, npm, Supabase project (URL + anon key), optional Reddit API creds
- Create `.env` at repo root:
  - VITE_SUPABASE_URL=...
  - VITE_SUPABASE_ANON_KEY=...
  - SUPABASE_URL=... (optional fallback)
  - SUPABASE_ANON_KEY=... (optional fallback)
  - REDDIT_CLIENT_ID=... (optional)
  - REDDIT_CLIENT_SECRET=... (optional)
  - PORT=3001 (optional)
- Install deps: `npm i`
- Run dev (frontend only): `npm run dev`
- Run full stack (frontend + express helpers): `npm run dev:full`
- Supabase: run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor before testing serverless flows.

## Success criteria for future changes

- Build passes: `vite build` and typecheck without errors
- ESLint clean: `npm run lint`
- Serverless handlers return correct status codes and respect RLS
- New code supports both timeline formats or performs a clear migration
- No hard-coded secrets; all config through env

## Quick reference

- Frontend dev server: http://localhost:2040
- Local API server: http://localhost:3001 (health: `/api/health`)
- Production API base: `/api` (Vercel)

## Appendix: Data shape snapshots

- Timeline (legacy): `{ items: TimelineItem[], totalDuration, postsCount, engagementTasksCount }`
- Timeline (phased): `[{ id, title, description, days, tasks: [{ id, title, status, scheduled_at, ... }] }]`
- Subreddit analytics: `{ subreddit, subscriber_count, active_users, activity_heatmap[7][24], best_posting_day, best_posting_hour, top_posts[], avg_engagement_score, last_updated }`

If you add new endpoints or change data shapes, update this file immediately. Keeping this accurate will prevent future “mishaps.”
