# Technical Requirements Document (TRD)

## Technical Objectives
- Build a modular FastAPI monolith that's easy for a small student team to build, debug, and demo within the SIH timeline
- Keep every AI/ML component explainable — no unexplained black-box outputs in the demo
- Design the database and API so they can later scale to multiple organizations without a rewrite
- Keep the prototype's infrastructure boring on purpose: PostgreSQL, FastAPI, Next.js — no premature complexity

## Functional Requirements (Technical)
- Backend exposes REST APIs for auth, inventory, forecast, risk, procurement, redistribution, waste, and analytics (see `06_API_SPECIFICATION.md`)
- Forecasting and risk-scoring run as background/on-demand jobs, not blocking API requests
- Redistribution and procurement recommendations are computed from current inventory + forecast state
- All AI-generated recommendations must be traceable to the underlying data used to generate them

## Non-Functional Requirements
| Category | Requirement (Prototype) |
|---|---|
| Performance | Dashboard endpoints respond within ~1–2s on demo dataset size |
| Usability | Core workflows (log waste, approve recommendation) completed in a few taps/clicks |
| Availability | Best-effort for demo; no formal SLA required at prototype stage |
| Maintainability | Modular monolith with clear domain boundaries (inventory, forecast, risk, procurement, redistribution, waste, analytics) |
| Explainability | Every recommendation includes a human-readable rationale field |

## Performance Expectations for Prototype
- Designed for a demo dataset: a handful of outlets, a few dozen ingredients, weeks-to-months of synthetic sales history
- Not designed or tested for production-scale concurrent load — that's explicitly future work

## Security Requirements
- JWT-based authentication
- Role-based access control (admin, manager, staff — minimum viable roles for prototype)
- Passwords hashed (bcrypt/argon2), never stored in plaintext
- API keys / secrets (Gemini API key, DB credentials) kept in environment variables, never committed to source control

## Reliability
- Prototype-level reliability: graceful error handling on API failures (e.g., LLM API timeout falls back to a template-based explanation instead of crashing)
- Database transactions used for any operation that changes inventory state (e.g., approving a redistribution)

## Scalability Considerations
- Database schema includes `organization_id` on relevant tables from day one, even though the prototype only uses one organization — this avoids a schema rewrite for multi-tenancy later
- Stateless API design so the backend can be horizontally scaled later without code changes
- Background job processing (forecast/risk computation) designed to be swappable for a task queue (Celery/RQ) later without changing the API contract

## API Requirements
- All endpoints under `/api/v1/`
- JSON request/response bodies
- Standard HTTP status codes (200, 201, 400, 401, 403, 404, 422, 500)
- Consistent error response shape (see `06_API_SPECIFICATION.md`)

## Database Requirements
- PostgreSQL as the primary data store
- SQLAlchemy ORM with Alembic-style migrations (or equivalent) for schema versioning
- Foreign keys enforced at the database level for referential integrity
- Indexes on frequently filtered columns (expiry_date, outlet_id, ingredient_id)

## AI Requirements
- Forecasting: statistical/practical approach (e.g., moving average / exponential smoothing with day-of-week and seasonality adjustment) — explicitly documented as not a deep-learning model for the prototype
- Risk scoring: rule-based + weighted scoring formula, explainable
- Natural-language explanations: Gemini API, always given real backend numbers as context — never allowed to invent figures
- No AI component may declare food "safe" or "unsafe" — outputs are always framed as flags for human review

## External API Requirements
- Gemini API (natural-language explanation generation)
- Weather API (optional, only if time permits — used as a demand-forecasting signal)

## Logging
- Application logs for API requests, background job runs, and errors
- Audit trail for approval actions (who approved what, when) — important given the human-approval requirement on disruptive actions

## Error Handling
- All API errors return a consistent JSON error shape with a message and error code
- LLM/API failures degrade gracefully (fallback explanation text) rather than breaking the workflow
- Input validation via Pydantic models on all write endpoints

## Testing Requirements
- Prototype: unit tests for core business logic (risk scoring formula, redistribution matching logic, forecast calculation)
- Manual end-to-end testing of the demo workflow before submission
- Production (future): full test suite including integration tests, load testing, and CI pipeline

## Deployment Requirements
- Frontend: Vercel
- Backend: Render/Railway (or similar managed service)
- Database: managed PostgreSQL instance (Render/Railway/Supabase)
- Environment variables managed per environment (dev/demo), never hardcoded

## Prototype vs Production — Explicit Distinction
| Aspect | Prototype (SIH) | Production (Future) |
|---|---|---|
| Tenancy | Single organization | Multi-tenant SaaS |
| Data source | CSV import / seeded demo data | Live POS/ERP integration |
| Forecast model | Statistical/rule-based | Trained ML model (e.g., LightGBM) with retraining pipeline |
| Waste capture | Manual logging | Manual + optional computer vision/smart scale |
| Infrastructure | Modular monolith, single deploy | Possibly split services if scale demands it |
| Testing | Core logic unit tests + manual QA | Full CI/CD, load testing, monitoring |
