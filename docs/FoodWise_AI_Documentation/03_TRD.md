# Technical Requirements Document (TRD)

## Technical Objectives
- Build a modular FastAPI monolith that's easy for a small student team to build, debug, and demo within the SIH timeline
- Keep every AI/ML component explainable — no unexplained black-box outputs in the demo
- Design the API so it can later scale to multiple organizations without a rewrite
- Keep the prototype's infrastructure boring on purpose: FastAPI backend, React/Vite frontend, no premature complexity

## What's Actually Built vs. What Was Originally Planned
This document originally described the target infrastructure (PostgreSQL, JWT, Next.js, live Gemini calls) as if it were all in place for the prototype. It wasn't — some of it shipped, some of it is still the plan. Both are noted below so this stays useful instead of misleading.

## Functional Requirements (Technical)
- Backend exposes REST APIs for auth, inventory, forecast, risk, procurement, redistribution, waste, alerts, and root-cause analytics (see `06_API_SPECIFICATION.md`) — **built**
- Forecasting and risk-scoring run synchronously per request against the in-memory demo store, not as background/queued jobs — this is a **change from the original plan**, which assumed background/on-demand jobs; at demo dataset size the difference isn't noticeable, but it's worth knowing for anyone extending this
- Redistribution and procurement recommendations are computed live from current inventory + forecast state — **built**
- All AI-generated recommendations are traceable to the underlying data used to generate them (the rationale string is built from real numbers, not free text) — **built**

## Non-Functional Requirements
| Category | Requirement (Prototype) |
|---|---|
| Performance | Dashboard endpoints respond within ~1–2s on demo dataset size |
| Usability | Core workflows (log waste, approve recommendation) completed in a few taps/clicks |
| Availability | Best-effort for demo; no formal SLA required at prototype stage |
| Maintainability | Modular monolith with clear domain boundaries (inventory, forecast, risk, procurement, redistribution, waste, analytics) |
| Explainability | Every recommendation includes a human-readable rationale field |

## Performance Expectations for Prototype
- Designed for a demo dataset: 3 outlets, a few dozen ingredients, weeks of seeded sales history
- Not designed or tested for production-scale concurrent load — that's explicitly future work

## Security Requirements — Current Prototype
- Signed bearer tokens (HMAC-SHA256 over a base64 payload) issued on login. These are JWT-*like* in shape but are a hand-rolled format, not a standard JWT library — worth knowing if this ever needs to interoperate with something expecting real JWTs
- Role-based access control (admin, manager, staff) enforced via FastAPI dependencies on write/approval endpoints
- Demo user passwords are plain string comparisons against seeded values (e.g. `foodwise-demo`) — **there is no password hashing in the current build.** This is acceptable for a hackathon demo with throwaway seeded credentials, but it is a real gap, not a stylistic choice, and should not be treated as a security requirement that's already satisfied
- Secrets (signing key, demo date) are read from environment variables via `backend/.env.example`, not hardcoded — **built**

## Security Requirements — Planned for Production
- Real password hashing (bcrypt/argon2), never stored in plaintext
- Standard JWT (or equivalent) issuance via a maintained library, with rotation/expiry handling beyond the current fixed 8-hour token life
- API keys / secrets for any real external API (e.g. Gemini, once wired in) kept in environment variables, never committed to source control — this practice already applies to what secrets do exist today

## Reliability
- Prototype-level reliability: FastAPI's standard error handling surfaces validation errors as consistent JSON; there's no LLM call yet to fail over from, so the "falls back to template text" behavior described in earlier drafts of this doc is really just "the explanation *is* template text right now" — see `07_AI_ML_DESIGN.md`
- Inventory-changing operations (e.g., approving a redistribution) run as in-process updates against the shared in-memory store; there's no database transaction because there's no database yet

## Scalability Considerations
- Domain models already include `organization_id` / `outlet_id` on the relevant entities, so a future move to multi-tenancy shouldn't require renaming fields, even though the prototype only uses one organization
- The API layer is stateless per request; the actual state lives in a single shared in-memory `DemoStore` object, so today the backend cannot be horizontally scaled without either a shared database or sticky sessions — this is explicitly a "future work" item, not solved yet
- Background job processing (forecast/risk recompute) is a **future** idea — nothing today is decoupled into a task queue; it would need to be swapped in behind the same function signatures currently used

## API Requirements
- All endpoints under `/api/v1/` — **built**
- JSON request/response bodies — **built**
- Standard HTTP status codes (200, 201, 400, 401, 403, 404, 422, 500) — **built**
- Consistent error response shape (see `06_API_SPECIFICATION.md`) — **built**

## Database Requirements — Current Prototype
- No database. Backend state lives in a single in-process `DemoStore` object (plain Python dataclasses), seeded on startup. State resets on every backend restart.
- Domain models mirror the entity names used in `05_DATABASE_DESIGN.md`'s planned schema, which was a deliberate choice to make a future move to a real database mostly a swap of the storage layer, not a rewrite of business logic

## Database Requirements — Planned for Production
- PostgreSQL as the primary data store
- SQLAlchemy ORM with migration tooling (Alembic or equivalent) for schema versioning
- Foreign keys enforced at the database level for referential integrity
- Indexes on frequently filtered columns (expiry_date, outlet_id, ingredient_id)

## AI Requirements — Current Prototype
- Forecasting: statistical/practical approach (moving average with day-of-week weighting, a trend factor, and a weekend bump) — **built**, explicitly not a deep-learning model
- Risk scoring: rule-based + weighted scoring formula, explainable — **built**
- Natural-language explanations: a deterministic template function (`grounded_explanation`) turns backend facts into a sentence. It is **not** calling any LLM today. A code comment notes a production wrapper "can" pass the same facts to Gemini/OpenAI — that's the plan, not the current behavior
- No AI component may declare food "safe" or "unsafe" — outputs are always framed as flags for human review — **true today**, since there is no AI component making that call at all yet

## AI Requirements — Planned
- Wire the explanation layer to the Gemini API, always given real backend numbers as context, never allowed to invent figures
- Weather API (optional) as an additional demand-forecasting signal, if time allows

## External API Requirements
- None are currently called by the backend. Gemini API integration and an optional Weather API signal are both planned, not implemented.

## Logging
- Application logs for API requests and errors (via FastAPI/Uvicorn defaults) — **built**
- Structured audit trail for approval actions (who approved what, when) — **planned**; approvals currently update status in the demo store but don't write a separate audit record

## Error Handling
- API errors return a consistent JSON error shape with a message and error code — **built**
- Input validation via Pydantic models on all write endpoints — **built**
- Graceful LLM-failure fallback — not yet applicable, since there's no live LLM call to fail; this becomes relevant once the Gemini integration above is built

## Testing Requirements
- Prototype: unit tests exist for core business logic (see `backend/tests/test_engines.py`) covering risk scoring and redistribution matching
- Manual end-to-end testing of the demo workflow before submission
- Production (future): full test suite including integration tests, load testing, and CI pipeline

## Deployment Requirements
- Frontend: Vercel (planned target; currently run locally via `npm run dev`)
- Backend: Render/Railway or similar managed service (planned target; currently run locally via `uvicorn`)
- Database: managed PostgreSQL instance, once the database layer above is built
- Environment variables managed per environment (dev/demo), never hardcoded — **already true for the secrets that exist today**

## Prototype vs Production — Explicit Distinction
| Aspect | Prototype (SIH, as built) | Production (Future) |
|---|---|---|
| Tenancy | Single organization | Multi-tenant SaaS |
| Data source | Seeded in-memory demo data | Live POS/ERP integration |
| Persistence | In-memory `DemoStore`, resets on restart | PostgreSQL + SQLAlchemy |
| Forecast model | Statistical/rule-based | Trained ML model (e.g., LightGBM) with retraining pipeline |
| Explanation text | Deterministic template | Gemini API, grounded in backend facts |
| Auth | Custom signed bearer token, plaintext demo passwords | Standard JWT, hashed passwords |
| Waste capture | Manual logging | Manual + optional computer vision/smart scale |
| Infrastructure | Modular monolith, single deploy, runs locally | Managed hosting, possibly split services if scale demands it |
| Testing | Core logic unit tests + manual QA | Full CI/CD, load testing, monitoring |
