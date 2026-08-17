# MVP Roadmap

Realistic phase plan for the SIH prototype build. Each phase is scoped to be completable by a small student team within a hackathon timeline.

## Phase 1: Project Setup + Database
- **Tasks**: initialize FastAPI project structure, set up PostgreSQL + SQLAlchemy, create initial migrations for core tables (organizations, outlets, users, ingredients, inventory, inventory_batches)
- **Expected output**: backend runs locally, schema is created, seed script for demo organization/outlets
- **Dependencies**: none
- **Can be simplified**: skip Alembic migrations tooling, use direct schema creation scripts for the prototype

## Phase 2: Authentication + Organization/Outlet
- **Tasks**: implement `POST /auth/login`, JWT issuance, RBAC middleware, user seeding for demo accounts (admin, manager per outlet, staff)
- **Expected output**: can log in as different roles and see role-appropriate access
- **Dependencies**: Phase 1
- **Can be simplified**: hardcode a small number of demo users instead of building a full signup flow

## Phase 3: Inventory
- **Tasks**: build inventory + inventory_batches CRUD endpoints, FEFO ordering logic, seed realistic demo inventory across outlets
- **Expected output**: `GET/POST/PUT /inventory` working, batches visible with expiry dates
- **Dependencies**: Phase 1, 2
- **Can be simplified**: manual batch entry only, no barcode/scan input

## Phase 4: Demand Forecasting
- **Tasks**: build sales history seed data, implement moving-average + day-of-week forecasting logic, `GET /forecast` endpoints
- **Expected output**: forecast numbers generated for demo ingredients/outlets, visibly change if seed data changes
- **Dependencies**: Phase 1, 3
- **Can be simplified**: skip weather API integration if time is short; day-of-week + trend is enough for a believable demo

## Phase 5: Risk Engine
- **Tasks**: implement spoilage risk scoring formula, `GET /risk` endpoints, alert generation for high-risk batches
- **Expected output**: risk levels computed and visible per inventory batch, with rationale text
- **Dependencies**: Phase 3, 4
- **Can be simplified**: fixed threshold weights instead of per-ingredient tuning

## Phase 6: Procurement + Preparation
- **Tasks**: implement procurement recommendation logic, preparation recommendation logic, approve/reject endpoints
- **Expected output**: recommendations appear with rationale, approving one updates its status
- **Dependencies**: Phase 4, 5
- **Can be simplified**: buffer factor for prep can be a fixed 5% rather than per-item tuned

## Phase 7: Inter-Outlet Redistribution
- **Tasks**: implement cross-outlet surplus/shortage matching algorithm, redistribution recommendation + approval endpoints, inventory update on approval
- **Expected output**: the tomato-transfer scenario from `08_USER_WORKFLOWS.md` works end-to-end on demo data — **this is a priority feature for the demo**
- **Dependencies**: Phase 3, 4, 5
- **Can be simplified**: only match within the same organization, ignore transport time/distance for the prototype

## Phase 8: Waste Analytics + Root Cause
- **Tasks**: implement waste logging endpoint, analytics aggregation endpoints, root-cause pattern detection logic
- **Expected output**: waste can be logged quickly, analytics dashboard shows trends, root-cause explanations appear for patterns in seed data
- **Dependencies**: Phase 3, 6
- **Can be simplified**: root-cause detection can look for a small set of known pattern types (e.g., day-of-week over-prep) rather than open-ended pattern mining

## Phase 9: AI Explanation Layer
- **Tasks**: integrate Gemini API, build the wrapper that passes verified backend data as context and returns plain-language explanations, add fallback template text if the API call fails
- **Expected output**: recommendation and root-cause screens show natural-language rationale instead of raw numbers only
- **Dependencies**: Phase 5, 6, 8
- **Can be simplified**: cache/precompute explanations for the demo dataset as a fallback in case of API issues during the live demo

## Phase 10: Testing + Demo Preparation
- **Tasks**: manual end-to-end testing of the full workflow, unit tests for risk scoring and redistribution matching, polish dashboard UI, rehearse the 4-minute demo flow, finalize seed data to tell a clean story
- **Expected output**: a reproducible, smooth demo that shows forecast → risk → recommendation → approval → redistribution → waste logging → root cause, in one continuous flow
- **Dependencies**: all previous phases
- **Can be simplified**: n/a — this phase is inherently about polish and reliability, not new features

---

## MVP vs Future Scope

### Must work for the SIH demonstration
- Login with role-based access
- Inventory view with batch-level expiry tracking
- Demand forecast (statistical, explainable)
- Spoilage risk scoring with rationale
- Procurement and preparation recommendations
- **Inter-outlet redistribution** (from surplus to shortage) — flagship feature
- Waste logging (fast, tap-first)
- Waste analytics dashboard
- AI-generated root-cause explanation grounded in real data
- Human approval required before any inventory-changing or procurement action executes

### Future Scope (explicitly not built for SIH)
- Multi-tenant support for multiple organizations
- Real POS/ERP integrations (prototype uses CSV/seed data)
- Computer-vision or smart-scale waste capture
- Trained ML forecasting model with a retraining pipeline
- Public consumer marketplace or donation-partner network
- Multi-language/multi-currency localization
- Mobile native app (prototype is a responsive web app)
- Kubernetes/microservices infrastructure
