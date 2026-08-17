# Foodwise AI Backend Prototype

Foodwise AI is a backend-focused SIH prototype for a closed-loop food waste intelligence platform. It uses seeded demo data for one organization with three outlets and exposes the core workflows described in the provided NourishOS/Foodwise research docs.

## What Is Built

- Demo login with signed bearer tokens and role checks.
- Inventory batches with expiry dates and FEFO-style ordering.
- Moving-average demand forecasting with day-of-week and trend adjustment.
- Explainable spoilage risk scoring.
- Procurement and preparation recommendations.
- Inter-outlet redistribution opportunities.
- Waste logging, waste analytics, impact metrics, and root-cause patterns.
- Grounded explanation fallback that only uses backend-computed facts.

## Run Locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.

Demo credentials:

- `admin@foodwise.ai` / `foodwise-demo`
- `manager@foodwise.ai` / `foodwise-demo`
- `staff@foodwise.ai` / `foodwise-demo`

## Useful Endpoints

- `POST /api/v1/auth/login`
- `GET /api/v1/dashboard/summary?outlet_id=o-1`
- `GET /api/v1/inventory?outlet_id=o-1`
- `GET /api/v1/forecast?outlet_id=o-1&date=2026-08-15`
- `GET /api/v1/risk?outlet_id=o-1`
- `GET /api/v1/procurement/recommendations?outlet_id=o-1`
- `GET /api/v1/preparation/recommendations?outlet_id=o-1`
- `GET /api/v1/redistribution/opportunities`
- `POST /api/v1/waste`
- `GET /api/v1/waste/analytics?outlet_id=o-1&group_by=ingredient`
- `GET /api/v1/root-cause?outlet_id=o-1`

## Verify Core Logic Without Installing FastAPI

The business engines use only the Python standard library, so they can be checked immediately:

```powershell
python -m unittest
python scripts/run_demo_checks.py
```

## Project Layout

```text
app/
  api/            FastAPI routers and dependencies
  core/           config and signed token helpers
  data/           seeded demo store
  domain/         dataclass domain models
  services/       forecast, risk, recommendation, analytics, explanation engines
docs/source/      provided research and documentation inputs
tests/            standard-library unit tests for core engines
```

## Next Backend Step

Swap the in-memory `DemoStore` for PostgreSQL + SQLAlchemy models using the same entity names already mirrored in `app/domain/models.py`. The service layer is intentionally dependency-light so it can move behind repositories without changing endpoint behavior.

