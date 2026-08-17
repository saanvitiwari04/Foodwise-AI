# UI/UX to Backend Mapping

This doc originally mapped *planned* Figma screens to endpoints before the frontend existed. The frontend has since been built (React + Vite, via Figma Make — see `04_SYSTEM_ARCHITECTURE.md`), and the actual screen list ended up a bit different from the original plan: there's no separate Login, Inventory, Risk, Supplier Intelligence, or Root Cause screen. What follows reflects what was actually built, with the original plan's screens folded in where they landed instead.

For the exact current wiring status (what's pulling live data vs. still using placeholder chart arrays), see `docs/INTEGRATION_STATUS.md` in the repo root — this doc focuses on what each screen needs, that one tracks what's actually connected today.

---

## Authentication (no dedicated screen)
- **What actually happens**: the frontend calls `POST /auth/login` automatically on load using hardcoded seeded demo credentials — there's no login form in the built UI
- **Required endpoint**: `POST /auth/login`
- **Note for anyone building real auth later**: a login screen and token storage would need to be added; right now the token lives only for the current session

## Command Center (Dashboard)
- **Purpose**: single-glance view of today's risk and priority actions
- **Main info displayed**: today's prep quantity, high-risk batch count, cost saved this week, redistribution opportunity count, priority actions list, a forecast-vs-actual chart, and a root-cause "insight" line
- **Required endpoints**: `GET /dashboard/summary`, `GET /forecast`, `GET /root-cause`
- **Important fields**: `todays_prep_quantity`, `high_risk_batches`, `cost_saved_this_week`, `redistribution_opportunities`, `priority_actions[]`, `root_cause.summary`
- **Status**: wired to real backend data, except the day-by-day demand chart, which currently uses a mocked local array (see `INTEGRATION_STATUS.md`)

## Forecast & Prep
- **Purpose**: show predicted demand and recommended prep quantities per ingredient
- **Main info displayed**: forecast chart (predicted vs. actual), per-item breakdown, recommended prep quantity, risk badge, suggested batch strategy
- **Required endpoints**: `GET /forecast?outlet_id=...&date=...`, `GET /preparation/recommendations`, `GET /risk`
- **Important fields**: `ingredient`, `predicted_quantity`, `lower_bound`, `upper_bound`, `recommended_prep_quantity`, `risk_level`
- **Status**: core numbers are live; the hour-by-hour confidence-band chart is mocked since the API only returns daily granularity

## Waste Log (mobile-first)
- **Purpose**: log a waste event in under 10 seconds
- **Main info displayed**: item picker, quantity, reason list, stage
- **Required endpoint**: `POST /waste`
- **User actions**: select item → quantity → reason → save
- **Status**: fully wired — posts to the real endpoint and correctly debits the related batch inventory

## Waste Explorer
- **Purpose**: understand what's being wasted, where, and how much it costs
- **Main info displayed**: waste by ingredient/outlet/reason, top drivers, estimated cost
- **Required endpoints**: `GET /waste`, `GET /waste/analytics`, `GET /waste/impact`
- **Important fields**: `ingredient`, `quantity`, `reason`, `estimated_cost`
- **Status**: the underlying analytics logic is real; some chart components (`topDrivers`, waste-stage breakdown) currently render mocked values because there wasn't an explicit API contract for that level of chart detail yet

## Surplus Hub (Redistribution)
- **Purpose**: review and approve cross-outlet transfer suggestions — this is the flagship feature, worth leading a demo with
- **Main info displayed**: opportunity list — ingredient, from outlet, to outlet, quantity, rationale
- **Required endpoints**: `GET /redistribution/opportunities`, `POST /redistribution/{id}/approve`
- **User actions**: approve a transfer
- **Status**: fully wired — approving a transfer physically moves inventory between outlets in the backend demo store

## Impact
- **Purpose**: show cumulative cost-saved / waste-avoided metrics
- **Required endpoint**: `GET /waste/impact`
- **Status**: current numbers come from the endpoint; the week-over-week trendline is a hardcoded array since historical snapshots aren't stored anywhere yet

## Not Built as Separate Screens (folded into the above, or not yet planned as UI)
- **Inventory / Ingredient Detail**: `GET /inventory`, `GET /inventory/{id}` exist and are used to compute what feeds the Command Center and Forecast & Prep, but there's no standalone inventory browsing screen
- **Risk / Spoilage**: risk data feeds badges and priority actions elsewhere rather than getting its own list screen
- **Supplier Intelligence**: not built — there's no supplier-incident data to show (see `05_DATABASE_DESIGN.md`, `07_AI_ML_DESIGN.md`)
- **Recommendation Center**: `GET /recommendations` (the unified feed) exists on the backend and isn't currently consumed by its own dedicated screen — a natural next screen to add if there's time

---

## Notes for Anyone Extending the Frontend
- Every screen that shows a "rationale" or "explanation" string is fed real backend-computed data — keep space for a short explanation text block, not just a number, wherever risk/procurement/redistribution/root-cause results are shown
- Every approve action maps to a `POST .../approve?approved=true` call that requires a `manager` or `admin` role — a confirmation step here is a good idea even though the backend enforces the role, since there's no UI-level confirmation today
- The Waste Log screen is intentionally tap-first with minimal typing — keep that if extending it
