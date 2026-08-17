# MVP Roadmap

This was originally written as a forward-looking phase plan before the build started. It's kept mostly as-is, with a **Status** line added to each phase so it's clear what actually shipped vs. what the plan assumed — a few phases landed differently than planned (notably Phase 1 and Phase 9).

## Phase 1: Project Setup + Database
- **Tasks (as planned)**: initialize FastAPI project structure, set up PostgreSQL + SQLAlchemy, create initial migrations for core tables
- **Status: partially built, differently than planned.** FastAPI project structure — done. PostgreSQL/SQLAlchemy — **not done**; the team went with an in-memory `DemoStore` (plain Python dataclasses) instead, seeded on startup. This was a reasonable simplification for a demo timeline, but it means the database layer described in `05_DATABASE_DESIGN.md` is still a future step, not something already running.
- **Dependencies**: none

## Phase 2: Authentication + Organization/Outlet
- **Tasks**: implement `POST /auth/login`, signed-token issuance, RBAC, seeded demo accounts (admin, manager per outlet, staff)
- **Status: built.** Login, role checks, and three seeded demo accounts all work. (The token is a hand-rolled HMAC-signed format, not a standard JWT library — fine for the demo, worth flagging if this ever needs real interop.)
- **Dependencies**: Phase 1

## Phase 3: Inventory
- **Tasks**: inventory batch endpoints, FEFO ordering logic, seed realistic demo inventory across outlets
- **Status: built**, except the `PUT` update endpoint — `GET`/`POST` exist, updating an existing batch doesn't yet. FEFO ordering works (batches sorted by expiry date).
- **Dependencies**: Phase 1, 2

## Phase 4: Demand Forecasting
- **Tasks**: sales history seed data, moving-average + day-of-week forecasting logic, `GET /forecast` endpoints
- **Status: built.** Weather API integration was explicitly optional in the original plan and was skipped, as anticipated.
- **Dependencies**: Phase 1, 3

## Phase 5: Risk Engine
- **Tasks**: spoilage risk scoring formula, `GET /risk` endpoint, alert generation for high-risk batches
- **Status: built.** Fixed threshold weights, as the "can be simplified" note originally suggested — no per-ingredient tuning.
- **Dependencies**: Phase 3, 4

## Phase 6: Procurement + Preparation
- **Tasks**: procurement recommendation logic, preparation recommendation logic, approve/reject endpoints
- **Status: built.** Preparation buffer is a fixed multiplier, as planned. There's no reject/override flow in the UI yet — approval exists, explicit rejection with a reason doesn't.
- **Dependencies**: Phase 4, 5

## Phase 7: Inter-Outlet Redistribution
- **Tasks**: cross-outlet surplus/shortage matching, redistribution recommendation + approval endpoints, inventory update on approval
- **Status: built, and it works end-to-end.** This is the strongest, most demo-ready feature — the tomato-transfer scenario in `08_USER_WORKFLOWS.md` runs against real backend state and is covered by a unit test.
- **Dependencies**: Phase 3, 4, 5

## Phase 8: Waste Analytics + Root Cause
- **Tasks**: waste logging endpoint, analytics aggregation, root-cause pattern detection
- **Status: built**, with the simplification the plan anticipated — root-cause detection looks for a known pattern shape (ingredient + reason grouping above a threshold) rather than open-ended pattern mining. Day-of-week-specific patterns (e.g. "always worse on Mondays") aren't detected yet, just ingredient/reason totals.
- **Dependencies**: Phase 3, 6

## Phase 9: AI Explanation Layer
- **Tasks (as planned)**: integrate Gemini API, build the wrapper that passes verified backend data as context and returns plain-language explanations, add fallback template text if the API call fails
- **Status: not built as planned.** What exists is the fallback half only — a deterministic template function that turns backend facts into a sentence. There's no live Gemini call anywhere in the code, and no wrapper to fail over *from*. This is the single biggest gap between the original plan and the current build, and it's a reasonable next task for anyone picking this up.
- **Dependencies**: Phase 5, 6, 8

## Phase 10: Testing + Demo Preparation
- **Tasks**: manual end-to-end testing, unit tests for risk scoring and redistribution matching, polish dashboard UI, rehearse the demo flow
- **Status: built.** `backend/tests/test_engines.py` covers redistribution and procurement logic; `backend/scripts/run_demo_checks.py` gives a quick manual smoke-check without needing FastAPI installed. Frontend is built and wired for the core flow (see `docs/INTEGRATION_STATUS.md`).
- **Dependencies**: all previous phases

---

## MVP vs Future Scope

### Built for the SIH demonstration
- Auto-login with role-based access (no manual login screen, but roles are enforced)
- Inventory batch view with expiry tracking and FEFO ordering
- Demand forecast (statistical, explainable)
- Spoilage risk scoring with rationale
- Procurement and preparation recommendations
- **Inter-outlet redistribution** (from surplus to shortage) — flagship feature, fully working
- Waste logging (fast, tap-first) and waste analytics
- Root-cause pattern detection, with a template-generated (not yet LLM-generated) explanation
- Human approval required before any inventory-changing or procurement action executes

### Explicitly not built for SIH (future scope)
- Persistent database — currently in-memory only, resets on restart
- Live Gemini/LLM integration — currently a deterministic template
- Supplier/batch pattern detection — no data model or logic exists yet
- Continuous learning / prediction-vs-actual accuracy tracking — nothing is persisted to compare against
- Multi-tenant support for multiple organizations
- Real POS/ERP integrations (prototype uses seeded data)
- Computer-vision or smart-scale waste capture
- Trained ML forecasting model with a retraining pipeline
- Public consumer marketplace or donation-partner network
- Multi-language/multi-currency localization
- Mobile native app (prototype is a responsive web app)
- Kubernetes/microservices infrastructure
