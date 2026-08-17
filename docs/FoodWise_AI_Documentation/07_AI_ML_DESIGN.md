# AI/ML Design

This document explains the intelligence layer honestly: what's rule-based, what's statistical, and what's still just planned. We're not pretending a prototype scoring formula is a sophisticated trained model, and we're not pretending an LLM call exists where there's currently a template string — being clear about both makes the system easier to trust and easier to explain to judges.

---

## 1. Demand Forecasting — **Built**

- **Input data**: historical seeded sales per ingredient/outlet, day of week, a simple trend factor, a weekend bump
- **Processing**: weighted average of same-weekday sales history and recent sales, adjusted by a bounded trend factor and a 1.08x multiplier on weekends. A **statistical, rule-adjusted approach** — not a trained neural network. See `backend/app/services/forecasting.py` for the exact formula.
- **Output**: predicted quantity per ingredient per outlet per day, with a lower/upper band (±15% of the prediction — not a statistically derived confidence interval, just a simple symmetric band for the demo)
- **Example**: "Tomatoes: predicted 12.5 kg for Saturday (range 10.6–14.4 kg), based on the last 6 comparable Saturdays and a 15% recent-average blend plus the weekend factor."
- **Implementation**: plain Python (`statistics.mean`), no pandas, no ML library
- **Future**: gradient-boosted models (LightGBM/XGBoost) with lag features, calendar features, and weather, retrained on a schedule as more real data accumulates

## 2. Spoilage Risk Scoring — **Built**

- **Input data**: days to expiry vs. ingredient's default shelf life, quantity vs. predicted consumption, ingredient perishability factor, storage condition
- **Processing**: **rule-based weighted scoring formula** — `0.42×shelf_pressure + 0.28×surplus_pressure + 0.18×perishability + 0.12×quantity_pressure + storage_penalty`, capped at 1.0. Thresholds: ≥0.72 = high, ≥0.45 = medium, else low. See `backend/app/services/risk.py`.
- **Output**: risk_level (Low/Medium/High) + numeric score (0–1) + plain-language rationale built from the actual numbers
- **Example**: "2 kg remaining, expires in 1 day(s), predicted next-service use is 0.5 kg; unused risk is 1.5 kg." → High risk
- **Implementation**: deterministic scoring function, fully explainable, no training required
- **Future**: could incorporate a trained classifier once enough historical waste-outcome data exists to validate it against — but the scoring logic should stay explainable even then

## 3. Overstock / Understock Signals — **Built, folded into risk and procurement rather than separate alert types**

- **Processing**: the risk engine's `surplus_pressure` term already captures "quantity exceeds predicted consumption"; procurement recommendations separately compute `predicted_demand − current_stock` to flag shortfalls
- There isn't a standalone `overstock`/`understock` alert *type* in the alerts system today — the only alert type currently generated is `spoilage_risk`. Distinct overstock/understock alert types are a small planned addition, not a rebuild.

## 4. Procurement Recommendation — **Built**

- **Input data**: predicted demand, current inventory, a safety buffer, redistribution opportunities that could cover part of the gap
- **Processing**: rule/formula — recommended_quantity = predicted_demand − current_stock + safety_buffer, reduced if an incoming redistribution can cover part of it
- **Output**: buy / delay / reduce recommendation with quantity and rationale
- **Implementation**: deterministic formula, see `backend/app/services/recommendations.py`
- **Future**: could incorporate supplier price/lead-time optimization (simple linear programming)

## 5. Preparation Recommendation — **Built**

- **Input data**: predicted demand for an ingredient at an outlet
- **Processing**: recommended_prep = predicted_demand × buffer_factor
- **Output**: recommended preparation quantity
- **Implementation**: simple multiplier logic
- **Future**: buffer factor could be learned per item/outlet from historical accuracy — depends on the continuous-learning work in Section 9 existing first

## 6. Inter-Outlet Redistribution — **Built**

- **Input data**: per-outlet current inventory vs. predicted consumption, for the same ingredient across outlets in the same organization
- **Processing**: matching rule — find outlets with surplus (quantity − predicted_consumption > 0) and outlets with shortfall for the same ingredient, then suggest a transfer quantity
- **Output**: transfer recommendation (from outlet, to outlet, quantity, rationale)
- **Example**: "Outlet A has 20 kg tomatoes, expected usage 10 kg (10 kg surplus). Outlet B has 5 kg, expected usage 15 kg (10 kg shortfall). Recommend transferring ~10 kg from A to B." — this exact scenario is covered by a unit test in `backend/tests/test_engines.py`
- **Implementation**: deterministic matching algorithm across outlets within one organization
- **Future**: could factor in transport distance/cost and time-to-expiry-during-transit for a proper optimization (e.g., OR-Tools)

## 7. Supplier/Batch Pattern Detection — **Planned, not built**

- **Idea**: if the same supplier or batch is associated with repeated quality/spoilage incidents across multiple outlets within a time window, flag it for review — never accusing the supplier, just surfacing a pattern
- **Current status**: there's no `supplier_incidents` data model, no seed data for incidents, and no detection logic anywhere in the codebase. This is a real gap between the original plan and what got built, not a naming difference — the feature simply isn't there yet.
- **What it would take**: add the `supplier_incidents` entity (see `05_DATABASE_DESIGN.md`), seed some incident data, and add a frequency-count rule similar in spirit to root-cause detection below

## 8. Root-Cause Pattern Detection — **Built (the pattern-finding part); explanation phrasing is template-based, not LLM**

- **Input data**: waste_records grouped by ingredient and reason
- **Processing**: `root_cause_patterns()` groups logged waste by (ingredient, reason), sums quantity, and surfaces any group above a small threshold (3 units) with a plain-English line built directly from the numbers
- **Output**: a list of patterns plus a `summary` string
- **What's real vs. planned**: the pattern detection itself is real and runs against actual logged waste data. The `summary` text, though, comes from a deterministic template function (`grounded_explanation`) — it is **not** an LLM call. A code comment notes a production wrapper "can" pass the same facts to Gemini/OpenAI; that's the plan, not current behavior. The original doc's example — "Rice waste has been consistently higher on Mondays because prep is higher than demand" — describes the kind of day-of-week pattern this feature is meant to eventually detect, but the current grouping is by (ingredient, reason) only, not by day-of-week yet.
- **Future**: day-of-week/stage-level pattern detection, and swapping the template summary for a real Gemini call that's only allowed to phrase numbers the backend already verified — never to invent a cause

## 9. Continuous Learning — **Planned, not built**

- **Idea**: compare predicted demand/waste to what actually happened, log the delta, and surface it ("Model missed by 18% last Saturday") to build trust and eventually inform manual or automatic tuning
- **Current status**: forecasts are computed on the fly and returned directly — nothing is persisted, so there's nothing to compare against later. No delta calculation, no accuracy display, anywhere in the current build.
- **What it would take**: persist forecasts (see `demand_forecasts` in `05_DATABASE_DESIGN.md`), persist actual sales/waste outcomes, and add a comparison job — this depends on the database work landing first, since there's currently nowhere to store forecast history between requests
- **Future production implementation**: an automated retraining pipeline that periodically updates model parameters based on accumulated outcome data

---

## Why This Approach Is Appropriate for the Prototype
A judge-facing SIH prototype needs to be explainable and demonstrably correct within a short demo window. Rule-based and statistical methods let us show exactly *why* the system recommended something, using real numbers computed live from the demo dataset — which is more convincing in a short demo than a claimed "AI model" that can't be interrogated. Being upfront that the explanation layer is a template today, not a live Gemini call, is part of that same honesty — it's a small, well-scoped next step, not a claim we need to hide.
