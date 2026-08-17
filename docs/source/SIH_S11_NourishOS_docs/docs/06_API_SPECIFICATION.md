# API Specification

## Base URL
```
https://api.nourishos.app/api/v1
```
(Prototype: replace with actual Render/Railway deployment URL.)

## Authentication
- JWT bearer token, obtained via `POST /auth/login`
- Include on all subsequent requests: `Authorization: Bearer <token>`
- Roles: `admin`, `manager`, `staff` — some endpoints require `manager` or `admin` (e.g., approving procurement/redistribution)

## Request/Response Format
- All requests and responses use `application/json`
- Timestamps in ISO 8601 (`2026-08-15T10:30:00Z`)

## Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "quantity must be greater than 0",
    "field": "quantity"
  }
}
```

## HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Not authenticated |
| 403 | Not authorized for this action |
| 404 | Resource not found |
| 422 | Validation error |
| 500 | Server error |

---

## Authentication

### `POST /auth/login`
**Request**
```json
{ "email": "manager@outlet.com", "password": "••••••••" }
```
**Response**
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "u-123", "name": "Priya Sharma", "role": "manager", "outlet_id": "o-1" }
}
```

---

## Dashboard

### `GET /dashboard/summary`
Returns key metrics for the logged-in user's outlet (or organization, for admin).
**Response**
```json
{
  "todays_prep_portions": 1240,
  "waste_risk_percent": 18,
  "cost_saved_this_week": 28460,
  "surplus_portions": 126,
  "priority_actions": [
    { "item": "Paneer Tikka", "severity": "high", "message": "Reduce tomorrow prep by 18 portions" }
  ]
}
```

---

## Inventory

### `GET /inventory`
Query params: `outlet_id`, `risk_level` (optional filters)

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
  "supplier_id": "sup-3"
}
```

### `GET /inventory/{id}`
Returns full inventory item with batch-level breakdown.

### `PUT /inventory/{id}`
Update quantity or batch details (e.g., after partial consumption).

---

## Forecast

### `GET /forecast?outlet_id=o-1&date=2026-08-16`
**Response**
```json
{
  "outlet_id": "o-1",
  "date": "2026-08-16",
  "forecast": [
    { "ingredient_id": "ing-001", "name": "Tomatoes", "predicted_quantity": 12.5, "lower_bound": 10, "upper_bound": 15 }
  ]
}
```

### `GET /forecast/{ingredient_id}`
Returns forecast history and next prediction for a single ingredient.

---

## Risk

### `GET /risk?outlet_id=o-1`
**Response**
```json
{
  "risks": [
    {
      "inventory_batch_id": "batch-55",
      "ingredient": "Paneer",
      "risk_level": "high",
      "risk_score": 0.82,
      "rationale": "2 kg remaining, expires in 1 day, predicted consumption is only 0.5 kg."
    }
  ]
}
```

### `GET /risk/{inventory_id}`
Returns detailed risk breakdown for one inventory item.

---

## Procurement

### `GET /procurement/recommendations?outlet_id=o-1`
**Response**
```json
{
  "recommendations": [
    {
      "id": "rec-101",
      "ingredient": "Tomatoes",
      "action": "reduce",
      "recommended_quantity": 8,
      "rationale": "Current stock plus predicted incoming redistribution covers demand through Thursday."
    }
  ]
}
```

### `POST /procurement/{id}/approve`
**Request**
```json
{ "approved": true }
```
**Response**
```json
{ "id": "rec-101", "status": "approved" }
```

---

## Redistribution

### `GET /redistribution/opportunities?organization_id=org-1`
**Response**
```json
{
  "opportunities": [
    {
      "ingredient": "Tomatoes",
      "from_outlet": "Outlet A",
      "to_outlet": "Outlet B",
      "suggested_quantity": 10,
      "rationale": "Outlet A has 20 kg with expected usage of 10 kg. Outlet B has 5 kg with expected usage of 15 kg."
    }
  ]
}
```

### `POST /redistribution`
Create a redistribution request (system-generated or manually initiated).

### `POST /redistribution/{id}/approve`
**Request**
```json
{ "approved": true }
```
**Response**
```json
{ "id": "rd-77", "status": "approved" }
```

---

## Waste

### `GET /waste?outlet_id=o-1&from=2026-08-01&to=2026-08-15`
Returns filtered waste records.

### `POST /waste`
**Request**
```json
{
  "outlet_id": "o-1",
  "ingredient_id": "ing-001",
  "quantity": 2.4,
  "reason": "overproduction",
  "stage": "service"
}
```
**Response**
```json
{ "id": "w-501", "logged_at": "2026-08-15T11:02:00Z" }
```

---

## Analytics

### `GET /analytics/waste?outlet_id=o-1&group_by=ingredient`
**Response**
```json
{
  "group_by": "ingredient",
  "results": [
    { "ingredient": "Rice", "total_waste_kg": 25, "estimated_cost": 1500 }
  ]
}
```

### `GET /analytics/trends?outlet_id=o-1&metric=waste_percent&period=weekly`
Returns time-series data for charting.

---

## Recommendations (Root-Cause / Explanations)

### `GET /recommendations?outlet_id=o-1`
Returns the current unified list of active recommendations across procurement, prep, redistribution, and risk — used to power the Recommendation Center screen.
**Response**
```json
{
  "recommendations": [
    {
      "id": "rec-101",
      "type": "procurement",
      "message": "Reduce tomato order by 8 kg this week",
      "explanation": "Rice waste has been consistently higher on Mondays because preparation quantity is higher than actual demand.",
      "confidence": "medium"
    }
  ]
}
```

Note: `explanation` fields are generated by the AI explanation layer (Gemini) using only verified backend numbers — the LLM never invents values.
