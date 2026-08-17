# Integration Status

## Overview
This document describes the current integration state between the React/Vite frontend and the FastAPI backend for the FoodWise AI SIH Prototype.

## Complete Intgerations
The following flows are wired end-to-end and use real backend state (via the `DemoStore`):

1. **Dashboard & KPIs**: The Command Center retrieves primary KPIs (prep quantity, risks, cost saved, redistributions) directly from the backend summary endpoint `/api/v1/dashboard/summary`.
2. **Forecast & Risks**: Uses the `/api/v1/forecast` and `/api/v1/risk` endpoints to populate risk badges and display predicted quantities.
3. **Waste Log Flow**: The mobile Waste Log UI posts to `/api/v1/waste`. It triggers a state change on the backend that correctly debits the related batch inventory and recalculates analytics.
4. **Procurement Approvals**: "Accept Recommendation" buttons on the Command Center and Forecast & Prep screens POST to `/api/v1/procurement/{id}/approve` successfully altering the status.
5. **Redistribution Hub**: The Surplus Hub UI retrieves opportunities from `/api/v1/redistribution/opportunities`, and processing a surplus transfer routes to the existing `POST /api/v1/redistribution/{opportunity_id}/approve` endpoint. This physically moves inventory from one outlet to another inside the backend DemoStore.

## Remaining Limitations / Mocked Data
The prototype is restricted to an in-memory `DemoStore` (as agreed upon for the SIH demo), meaning progress resets between backend restarts. Furthermore, some specific visualizations in the UI still use heavily-interpolated mock arrays because there was no explicit API contract to supply granular visualization metrics without over-building the prototype:

- **Command Center Demand Chart**: The x-axis days mapping to actuals vs AI forecast is mocked on the frontend (`demandData`).
- **Forecast Area Chart**: The hour-by-hour confidence bands (`forecastTimeData`) are mocked since the API only returns daily granularity.
- **Waste Explorer Components**: High-level charts such as `topDrivers` and stages use mocked values, though actual analytics logic exists on the backend.
- **Impact Trendline**: Hardcoded array since historical week-over-week snapshots are missing in the demo store.

## Build and Testing Details
- Front-end builds with React+Vite configuration via Figma Make.
- Backend completely executes standard-level unit tests flawlessly.
- No heavy infrastructure (DB/Redis) is required.

## Commands to Run
**1. Backend**
```powershell
cd backend
# Enable standard python environment with dependencies
# Assuming .venv is created and dependencies are installed via requirements.txt
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**2. Frontend**
```powershell
cd frontend
npm install
npm run dev
```

*Note: The frontend server currently runs optimally within the Figma Make instance implicitly via its `$PORT` binding.*
