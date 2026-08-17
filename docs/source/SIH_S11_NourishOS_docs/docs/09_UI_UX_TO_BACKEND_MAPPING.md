# UI/UX to Backend Mapping

The UI is being designed separately in Figma. This document maps each planned screen to the backend data and endpoints it needs, so the Figma design and the FastAPI backend stay compatible once integration starts.

---

## Login
- **Purpose**: authenticate user, establish session
- **Main info displayed**: email/password form, error state
- **Required endpoints**: `POST /auth/login`
- **Important fields**: email, password → returns token, user (id, name, role, outlet_id)
- **User actions**: submit credentials
- **Expected backend response**: JWT token + user object
- **What changes after action**: token stored client-side, user redirected to Dashboard

## Dashboard (Command Center)
- **Purpose**: single-glance view of today's risk and priority actions
- **Main info displayed**: today's prep portions, waste risk %, cost saved this week, surplus portions, priority actions list, forecast-vs-actual chart
- **Required endpoints**: `GET /dashboard/summary`, `GET /forecast`
- **Important fields**: todays_prep_portions, waste_risk_percent, cost_saved_this_week, surplus_portions, priority_actions[]
- **User actions**: click a priority action → navigate to relevant screen
- **Expected backend response**: aggregated summary object
- **What changes after action**: navigation only; no state change here

## Inventory
- **Purpose**: view and manage current stock across ingredients/batches
- **Main info displayed**: ingredient list with quantity, unit, nearest expiry, risk badge
- **Required endpoints**: `GET /inventory`, `POST /inventory`, `PUT /inventory/{id}`
- **Important fields**: ingredient name, quantity, unit, batches (expiry_date, quantity), risk_level
- **User actions**: add new stock entry, edit quantity, filter by risk level or outlet
- **Expected backend response**: list of inventory items with nested batch data
- **What changes after action**: new/updated inventory row; risk engine re-evaluates on next run

## Ingredient Detail
- **Purpose**: drill into a single ingredient across batches, forecast, and risk
- **Main info displayed**: batch history, expiry timeline, forecast trend, risk history
- **Required endpoints**: `GET /inventory/{id}`, `GET /forecast/{ingredient_id}`, `GET /risk/{inventory_id}`
- **Important fields**: batch_code, expiry_date, quantity, risk_score, forecast history
- **User actions**: none required (read-only), optional manual adjustment
- **Expected backend response**: combined detail object
- **What changes after action**: n/a (read-only screen)

## Demand Forecast
- **Purpose**: show predicted demand per item/outlet for upcoming days
- **Main info displayed**: forecast chart (predicted vs actual), confidence band, per-item breakdown
- **Required endpoints**: `GET /forecast?outlet_id=...&date=...`
- **Important fields**: ingredient, predicted_quantity, lower_bound, upper_bound
- **User actions**: change date range, select outlet, drill into an item
- **Expected backend response**: forecast array
- **What changes after action**: chart re-renders with new data

## Risk / Spoilage
- **Purpose**: show which inventory batches are at risk and why
- **Main info displayed**: risk list sorted by severity, rationale text
- **Required endpoints**: `GET /risk?outlet_id=...`, `GET /risk/{inventory_id}`
- **Important fields**: ingredient, risk_level, risk_score, rationale
- **User actions**: filter by risk level, click into an item, trigger a recommendation (redistribute/reduce order)
- **Expected backend response**: risk array with rationale strings
- **What changes after action**: navigates to procurement/redistribution if user acts on it

## Procurement
- **Purpose**: review and approve buy/delay/reduce recommendations
- **Main info displayed**: recommendation list — ingredient, action, quantity, rationale, status
- **Required endpoints**: `GET /procurement/recommendations`, `POST /procurement/{id}/approve`
- **Important fields**: action, recommended_quantity, rationale, status
- **User actions**: approve, reject (with optional reason)
- **Expected backend response**: updated recommendation status
- **What changes after action**: recommendation marked approved/rejected; feeds procurement plan

## Redistribution
- **Purpose**: review and approve cross-outlet transfer suggestions
- **Main info displayed**: opportunity list — ingredient, from outlet, to outlet, quantity, rationale
- **Required endpoints**: `GET /redistribution/opportunities`, `POST /redistribution`, `POST /redistribution/{id}/approve`
- **Important fields**: from_outlet, to_outlet, suggested_quantity, rationale, status
- **User actions**: approve, reject
- **Expected backend response**: updated redistribution request status
- **What changes after action**: inventory updated at both outlets once approved/completed

## Waste Analytics
- **Purpose**: understand what's being wasted, where, and how much it costs
- **Main info displayed**: waste by ingredient/outlet, trend chart, estimated cost, frequently wasted items
- **Required endpoints**: `GET /waste`, `GET /analytics/waste`, `GET /analytics/trends`
- **Important fields**: ingredient, quantity, reason, stage, estimated_cost, date
- **User actions**: filter by date range/outlet/ingredient, log new waste event (`POST /waste`)
- **Expected backend response**: grouped analytics data
- **What changes after action**: new waste log entry updates aggregates and risk model input

## Supplier Intelligence
- **Purpose**: view supplier/batch history and recurring pattern flags
- **Main info displayed**: supplier list, incident history, pattern alerts ("review recommended")
- **Required endpoints**: (extends `06_API_SPECIFICATION.md` — supplier endpoints follow the same REST pattern as other resources; not yet in MVP endpoint list, add if time allows: `GET /suppliers`, `GET /suppliers/{id}/incidents`)
- **Important fields**: supplier name, incident_type, description, reported_at, pattern flag
- **User actions**: mark a pattern alert as reviewed
- **Expected backend response**: supplier + incident list
- **What changes after action**: alert acknowledgment logged

## AI Root Cause
- **Purpose**: show plain-language explanations for repeated waste patterns
- **Main info displayed**: pattern description, supporting numbers, "analysis not proof" framing
- **Required endpoints**: `GET /recommendations` (filtered to root-cause type), backed by root-cause module
- **Important fields**: message, explanation, confidence
- **User actions**: none required beyond reading; optional "mark as addressed"
- **Expected backend response**: explanation text tied to real backend numbers
- **What changes after action**: n/a or acknowledgment flag

## Recommendation Center
- **Purpose**: unified view of all active recommendations across procurement, prep, redistribution, and risk
- **Main info displayed**: recommendation list with type, message, explanation, confidence
- **Required endpoints**: `GET /recommendations`
- **Important fields**: id, type, message, explanation, confidence
- **User actions**: approve/dismiss (routes to the relevant type-specific endpoint)
- **Expected backend response**: unified recommendation list
- **What changes after action**: underlying recommendation status updates via its type-specific endpoint

---

## Notes for Figma → Backend Integration
- Every screen that shows a "rationale" or "explanation" string is being fed real backend-computed data — the Figma design should have space for a short explanation text block, not just a number, on Risk, Procurement, Redistribution, and Root Cause screens.
- Every approve/reject action in the UI must map to a POST endpoint that requires a `manager` or `admin` role — the Figma flow should include a confirmation step for these, consistent with the human-approval requirement.
- The Waste Log screen (mobile-first) should be optimized for the sub-10-second logging flow: item → quantity → reason → save, minimal typing.
