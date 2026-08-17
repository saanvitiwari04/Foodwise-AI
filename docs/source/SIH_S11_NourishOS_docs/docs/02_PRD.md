# Product Requirements Document (PRD)

## 1. Product Overview
NourishOS is a decision-support platform for food-service businesses. It ingests sales, inventory, and waste data, predicts demand and spoilage risk, and recommends concrete actions — what to prepare, what to buy, what to move between outlets, and what to do with surplus before it becomes waste. It closes the loop by comparing predictions to actual outcomes and using that to improve future recommendations.

## 2. Problem Statement
Restaurants, hotels, and cafeterias routinely over-prepare or over-order because they lack a reliable way to combine sales history, current inventory, shelf life, and operational context (day of week, events, promotions) into a single actionable recommendation. When multiple outlets exist, surplus at one location and shortage at another usually go unnoticed until it's too late to act. The result is avoidable food waste, wasted procurement spend, and no systematic way to learn from what actually happened.

## 3. Target Users
- Outlet / kitchen managers (primary daily users)
- Procurement / purchasing staff
- Regional or chain operations managers (multi-outlet view)
- Kitchen staff (waste logging, at a lighter permission level)

## 4. User Personas

**Priya — Outlet Manager, hotel restaurant**
Runs day-to-day kitchen operations at one outlet. Needs to know how much to prep each shift and wants to be warned before ingredients go bad, without spending time on manual spreadsheets.

**Arjun — Procurement Lead, restaurant chain (3 outlets)**
Places orders across outlets weekly. Wants to avoid over-ordering perishables and wants visibility into which outlet has surplus that could cover another outlet's shortage instead of a fresh purchase.

**Meera — Operations Head, chain level**
Cares about waste cost and patterns across the whole chain — which outlet wastes the most, which supplier's batches keep causing issues, and whether interventions are actually working.

## 5. User Pain Points
- No easy way to see which inventory items are at real risk of expiring unused
- Preparation quantities are based on gut feeling, not adjusted demand signals
- Surplus at one outlet and shortage at another are invisible to each other
- Waste is recorded (if at all) but nobody analyzes *why* it keeps happening
- Recurring supplier/batch issues go unnoticed until they've repeated several times
- No feedback loop — the same mistakes repeat week after week

## 6. Product Goals
- Reduce avoidable food waste through earlier, more accurate risk detection
- Make preparation and procurement decisions demand-driven instead of guess-driven
- Make inter-outlet redistribution a visible, actionable recommendation instead of something nobody thinks to check
- Give managers a simple explanation for every recommendation ("why is the system telling me this?")
- Build a system that gets better over time by comparing its predictions to what actually happened

## 7. Non-Goals
- This is **not** a consumer-facing food marketplace or donation app (may be future scope)
- This is **not** a food-safety certification or compliance tool — the AI never declares food safe or unsafe; it only flags for human review
- This is **not** a POS or accounting system — it consumes sales data, it doesn't replace POS
- This is **not** attempting real-time computer-vision waste capture in the prototype

## 8. Functional Requirements
- FR1: System shall forecast demand per ingredient/menu item per outlet
- FR2: System shall track inventory with batch, expiry, and shelf-life data
- FR3: System shall compute a spoilage risk score (Low/Medium/High) per inventory batch
- FR4: System shall flag storage/quality anomalies for human review only
- FR5: System shall detect recurring supplier/batch patterns across outlets
- FR6: System shall recommend inter-outlet redistribution when surplus and shortage coexist
- FR7: System shall recommend procurement quantities and timing
- FR8: System shall recommend preparation quantities with a reasonable buffer
- FR9: System shall generate alerts for risk, overstock, understock, and opportunities
- FR10: System shall provide waste analytics (by ingredient, outlet, trend, cost)
- FR11: System shall generate a root-cause explanation for waste patterns
- FR12: System shall compare predicted vs actual outcomes to refine future recommendations

## 9. Feature Requirements
See `01_PROJECT_OVERVIEW.md` for the full feature list. Each feature maps to a corresponding API group in `06_API_SPECIFICATION.md` and a data entity set in `05_DATABASE_DESIGN.md`.

## 10. User Stories

- As an outlet manager, I want to know which ingredients are likely to expire before being used, so that I can take action before they become waste.
- As an outlet manager, I want a recommended preparation quantity for tomorrow's service, so that I don't over-prepare based on guesswork.
- As a procurement lead, I want to see if another outlet has surplus stock before I place a new order, so that I avoid buying something we already have elsewhere.
- As an operations head, I want to see which ingredients are wasted most often and why, so that I can fix the actual cause instead of just reacting to the symptom.
- As an operations head, I want to be alerted if the same supplier keeps showing up in quality incidents across outlets, so that I can review that relationship.
- As a kitchen staff member, I want to log a waste event in under 10 seconds, so that logging doesn't interrupt service.
- As an outlet manager, I want to approve or reject a redistribution suggestion, so that the system never moves stock without my confirmation.

## 11. Main User Journeys
1. Manager opens dashboard → sees today's risk items and recommended actions → approves or overrides.
2. System detects surplus at Outlet A + shortage at Outlet B → recommends transfer → manager at either outlet approves → inventory updates.
3. Staff logs a waste event → system updates waste analytics and risk model → root-cause view updates.
4. Procurement lead checks procurement recommendations before placing a weekly order.
5. Operations head reviews waste analytics and supplier/batch pattern alerts weekly.

Full workflow diagrams are in `08_USER_WORKFLOWS.md`.

## 12. MVP Scope
- Single organization, 2–3 demo outlets
- CSV/seeded data ingestion (no live POS integration)
- Demand forecasting, risk scoring, procurement & prep recommendations
- Inter-outlet redistribution recommendation (core differentiator for the demo)
- Waste logging and analytics
- Root-cause explanation (LLM-assisted, grounded in real backend data)
- Human-approval requirement on every action that changes inventory or triggers procurement

## 13. Future Scope
- Multi-tenant SaaS for many organizations
- Real POS/ERP integrations
- Computer-vision / smart-scale waste capture
- Verified donation/recovery partner network
- Multi-currency, multi-language, multi-country deployment
- Mobile app for kitchen staff (beyond responsive web)

## 14. Success Metrics
- Reduction in avoidable waste (kg and cost) vs baseline, in demo dataset
- Forecast accuracy (MAPE/WAPE) per item/time-window
- % of recommendations accepted or explicitly overridden with a reason
- % of redistribution opportunities detected and acted upon
- Median time to log a waste event (target: under 10 seconds)

## 15. Assumptions
- Demo data is synthetic but realistic (based on plausible sales/inventory patterns), and is clearly labeled as demo data
- Users have basic familiarity with a dashboard-style web app
- Outlets in the demo belong to a single organization (multi-tenant is future scope)
- Internet connectivity is available for LLM API calls during the demo

## 16. Constraints
- No production ML model claims — forecasting/risk uses explainable statistical/rule-based methods for the prototype
- AI never makes a final food-safety call; all safety-relevant flags require human review
- No accusatory language toward suppliers — pattern detection only, with "review recommended" phrasing
- Prototype avoids unnecessary infrastructure (no Kubernetes, no microservices) — a modular FastAPI monolith is used instead
