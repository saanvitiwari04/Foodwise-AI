# API Specification

This reflects the endpoints actually implemented in `backend/app/api/routers/`, not the original planning draft. A few endpoints from the original plan (`PUT /inventory/{id}`, a standalone `POST /redistribution`, `/analytics/*` paths) don't exist yet — they're marked as planned below instead of listed as if live.

## Base URL
```
http://127.0.0.1:8000/api/v1
```
Locally via `uvicorn app.main:app --reload`, per the repo README. No hosted deployment URL yet — Render/Railway/Vercel are the planned targets (see `03_TRD.md`).

## Authentication
- Signed bearer token, obtained via `POST /auth/login`
- Include on all subsequent requests: `Authorization: Bearer <token>`
- The token is HMAC-SHA256 signed and JWT-*like* in shape, but it's a small hand-rolled implementation (`backend/app/core/security.py`), not a standard JWT library — good enough for the demo, worth swapping for a real JWT library before this goes anywhere near production
- Roles: `admin`, `manager`, `staff` — endpoints that approve/create (e.g., approving procurement/redistribution, creating inventory) require `manager` or `admin` via a `require_manager` dependency

## Request/Response Format
- All requests and responses use `application/json`
- Dates in `YYYY-MM-DD`, timestamps in ISO 8601

## Error Format
```json
{
  "detail": {
    "code": "NOT_FOUND",
    "message": "Inventory batch not found"
  }
}
```
(FastAPI wraps `HTTPException(detail=...)` under a top-level `detail` key — the original draft showed a top-level `error` key with a `field` attribute; the actual shape is simpler than that.)

## HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Not authenticated |
| 403 | Not authorized for this action |
| 404 | Resource not found |
| 422 | Validation error (FastAPI/Pydantic default) |
| 500 | Server error |

---

## Authentication

### `POST /auth/login`
**Request**
```json
{ "email": "manager@foodwise.ai", "password": "foodwise-demo" }
```
**Response**
```json
{
  "token": "eyJzdWIiOi...",
  "user": { "id": "u-2", "organization_id": "org-1", "name": "...", "email": "manager@foodwise.ai", "role": "manager", "outlet_id": "o-1" }
}
```
Seeded demo accounts (see repo README): `admin@foodwise.ai`, `manager@foodwise.ai`, `staff@foodwise.ai`, all with password `foodwise-demo`.

---

## Dashboard

### `GET /dashboard/summary?outlet_id=o-1`
**Response** (actual field names — differ from the original draft)
```json
{
  "todays_prep_quantity": 42.5,
  "high_risk_batches": 3,
  "cost_saved_this_week": 1180.5,
  "redistribution_opportunities": 2,
  "priority_actions": [
    { "item": "Paneer", "severity": "high", "message": "2 kg remaining, expires in 1 day..." }
  ]
}
```
(The original draft used `todays_prep_portions`, `waste_risk_percent`, and `surplus_portions` — those fields don't exist in the actual response.)

---

## Catalog

### `GET /catalog/outlets`
Returns all seeded outlets.

### `GET /catalog/ingredients`
Returns all seeded ingredients.

*(Not in the original draft — added here since the frontend and any new client needs these to resolve names/IDs.)*

---

## Inventory

### `GET /inventory?outlet_id=o-1`
Returns inventory batches for an outlet, sorted FEFO (soonest expiry first).

### `GET /inventory/{id}`
Returns batch detail plus computed forecast and risk for that batch.

### `POST /inventory`
**Request**
```json
{
  "ingredient_id": "ing-001",
  "outlet_id": "o-1",
  "batch_code": "B-2026-08-14",
  "quantity": 20,
  "unit": "kg",
  "purchase_date": "2026-08-14",
  "expiry_date": "2026-08-18",
  "supplier_id": "sup-3",
  "storage_condition": "normal"
}
```

### `PUT /inventory/{id}` — **planned, not implemented**
The original draft listed this for updating quantity/batch details after partial consumption. There is currently no update endpoint — inventory batches are only ever listed or created.

---

## Forecast

### `GET /forecast?outlet_id=o-1&date=2026-08-16`
Returns forecasts for every seeded ingredient at that outlet/date.

### `GET /forecast/{ingredient_id}?outlet_id=o-1&date=2026-08-16`
Returns a single forecast (`outlet_id` and `date` are both required query params — the original draft implied `date` was optional).

---

## Risk

### `GET /risk?outlet_id=o-1&date=2026-08-16`
**Response**
```json
{
  "risks": [
    {
      "inventory_batch_id": "batch-55",
      "outlet_id": "o-1",
      "ingredient_id": "ing-004",
      "risk_level": "high",
      "risk_score": 0.82,
      "rationale": "2 kg remaining, expires in 1 day(s), predicted next-service use is 0.5 kg; unused risk is 1.5 kg.",
      "computed_at": "2026-08-15T10:30:00Z"
    }
  ]
}
```

### `GET /risk/{inventory_id}` — **not implemented as a separate endpoint**
Risk detail for a single batch is available via `GET /inventory/{id}`, which already includes a computed `risk` object. A standalone `/risk/{id}` route doesn't exist.

---

## Procurement

### `GET /procurement/recommendations?outlet_id=o-1&date=2026-08-16`
### `POST /procurement/{id}/approve?approved=true`
**Response**
```json
{ "id": "rec-101", "status": "approved" }
```
(`approved` is a query param on the actual endpoint, not a JSON body — the original draft showed it as a request body.)

---

## Preparation

### `GET /preparation/recommendations?outlet_id=o-1&date=2026-08-16`
*(Missing entirely from the original API spec draft, even though it's a real, working endpoint.)*

---

## Redistribution

### `GET /redistribution/opportunities`
Scans across all outlets in the seeded organization; no query params needed (the original draft's `organization_id` param isn't used — there's only one organization).

### `POST /redistribution` — **planned, not implemented**
The original draft described this as creating a redistribution request manually. In the current build, opportunities are always system-detected from inventory vs. forecast — there's no manual-creation endpoint.

### `POST /redistribution/{id}/approve?approved=true`
Approving moves quantity between the two outlets' inventory in the demo store.

---

## Waste

### `GET /waste?outlet_id=o-1`
### `POST /waste`
**Request**
```json
{
  "outlet_id": "o-1",
  "ingredient_id": "ing-001",
  "quantity": 2.4,
  "reason": "overproduction",
  "stage": "service",
  "inventory_batch_id": "batch-55"
}
```

### `GET /waste/analytics?outlet_id=o-1&group_by=ingredient`
(The original draft called this `/analytics/waste` — actual path is `/waste/analytics`.) `group_by` accepts `ingredient`, `outlet`, or `reason`.

### `GET /waste/impact?outlet_id=o-1`
Returns logged waste quantity/cost and an estimated weekly cost-saved figure. *(Not in the original draft.)*

### `GET /analytics/trends` — **planned, not implemented**
The original draft listed this for time-series charting. No such endpoint exists — the frontend's trend charts currently use mocked data for this reason (see `docs/INTEGRATION_STATUS.md`).

---

## Alerts

*(Entirely missing from the original API draft — this is a real, working router.)*

### `GET /alerts?outlet_id=o-1`
Returns undismissed risk-based alerts for high/medium-risk batches.

### `POST /alerts/{alert_id}/dismiss`
Marks an alert dismissed for the session (tracked in-memory, resets on backend restart).

---

## Recommendations (Unified Feed + Root-Cause)

### `GET /recommendations?outlet_id=o-1`
Unified feed combining procurement, preparation, and redistribution recommendations into one list — powers the Command Center's recommendation surfacing.

### `GET /root-cause?outlet_id=o-1`
**Response**
```json
{
  "patterns": [
    { "ingredient_id": "ing-004", "ingredient": "Rice", "reason": "overproduction", "quantity": 8.5, "analysis": "Rice has 8.5 kg logged as overproduction. Review prep quantity, demand assumptions, and service timing." }
  ],
  "summary": "Waste pattern review. This is based on verified backend data - pattern_count: 1, impact: {...}."
}
```
Note: `summary` is currently generated by a deterministic template function, not an LLM. The plan is to route this through Gemini once that integration is built (see `07_AI_ML_DESIGN.md`) — the phrasing above ("This is based on verified backend data...") is what the template actually produces today, not a stylized example.
