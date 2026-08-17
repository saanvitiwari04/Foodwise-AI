# AI/ML Design

This document explains the intelligence layer honestly: what's rule-based, what's statistical, and what's LLM-based. We are not pretending a prototype scoring formula is a sophisticated trained model — being clear about this makes the system easier to trust and easier to explain to judges.

---

## 1. Demand Forecasting

- **Input data**: historical sales per ingredient/menu item, day of week, date (for seasonality), known events/holidays, promotions, optionally weather
- **Processing**: weighted moving average adjusted by day-of-week pattern and a simple trend factor. For the prototype, this is a **statistical, rule-adjusted approach** — not a trained neural network.
- **Output**: predicted quantity per ingredient/item per day, with a lower/upper confidence band
- **Example**: "Tomatoes: predicted 12.5 kg for Saturday (range 10–15 kg), based on the last 6 Saturdays and a 15% upward adjustment for the local event this weekend."
- **Prototype implementation**: Python, pandas-based moving average + day-of-week multiplier
- **Future production implementation**: gradient-boosted models (LightGBM/XGBoost) with lag features, calendar features, and weather, retrained on a schedule as more data accumulates

## 2. Spoilage Risk Scoring

- **Input data**: remaining shelf life, current quantity, predicted consumption (from forecasting), storage condition (if available), historical usage rate
- **Processing**: **rule-based weighted scoring formula** — e.g., risk increases as days-to-expiry decreases and as (quantity − predicted consumption) increases
- **Output**: risk_level (Low/Medium/High) + numeric score + plain-language rationale
- **Example**: "Paneer batch B-55: 2 kg remaining, expires in 1 day, predicted consumption 0.5 kg → High risk."
- **Prototype implementation**: deterministic scoring function, fully explainable, no training required
- **Future production implementation**: could incorporate a trained classifier once enough historical waste-outcome data exists to validate it against — but the scoring logic should remain explainable even then

## 3. Overstock Detection

- **Input data**: current inventory level, predicted demand over shelf-life window
- **Processing**: rule — if current_quantity significantly exceeds predicted consumption before expiry, flag as overstock
- **Output**: overstock alert with quantity delta
- **Prototype implementation**: simple threshold rule
- **Future**: threshold could be dynamically tuned per ingredient based on historical waste outcomes

## 4. Understock Detection

- **Input data**: current inventory level, predicted demand
- **Processing**: rule — if current_quantity is below predicted demand for the near-term window, flag as understock
- **Output**: understock alert
- **Prototype implementation**: simple threshold rule
- **Future**: could factor in supplier lead time for more precise timing

## 5. Procurement Recommendation

- **Input data**: predicted demand + current inventory + shelf life + safety stock buffer + supplier info
- **Processing**: rule/formula — recommended_quantity = predicted_demand − current_stock + safety_buffer, adjusted down if a redistribution opportunity can cover part of the gap
- **Output**: buy / delay / reduce recommendation with quantity and rationale
- **Example**: "Reduce tomato order by 8 kg — current stock plus incoming redistribution from Outlet A covers demand through Thursday."
- **Prototype implementation**: deterministic formula
- **Future production implementation**: could incorporate supplier price/lead-time optimization (simple linear programming)

## 6. Preparation Recommendation

- **Input data**: predicted demand for a menu item, historical over/under-prep pattern
- **Processing**: recommended_prep = predicted_demand × buffer_factor (e.g., 1.05), buffer factor lower for high-cost or highly perishable items
- **Output**: recommended preparation quantity
- **Example**: "Predicted demand = 400 portions → recommended preparation = 420 portions."
- **Prototype implementation**: simple multiplier logic
- **Future**: buffer factor could be learned per item/outlet from historical accuracy

## 7. Inter-Outlet Redistribution

- **Input data**: per-outlet current inventory vs predicted consumption, for the same ingredient across outlets in the same organization
- **Processing**: matching rule — find outlets with (quantity − predicted_consumption) > 0 (surplus) and outlets with the same value < 0 (shortage) for the same ingredient, then suggest a transfer quantity that reduces both imbalances
- **Output**: transfer recommendation (from outlet, to outlet, quantity, rationale)
- **Example**: "Outlet A has 20 kg tomatoes, expected usage 10 kg (10 kg surplus). Outlet B has 5 kg, expected usage 15 kg (10 kg shortfall). Recommend transferring ~10 kg from A to B."
- **Prototype implementation**: deterministic matching algorithm across outlets within one organization
- **Future production implementation**: could factor in transport distance/cost and time-to-expiry-during-transit for a proper optimization (e.g., OR-Tools)

## 8. Supplier/Batch Pattern Detection

- **Input data**: supplier_incidents and waste_records linked to the same supplier or batch across outlets
- **Processing**: rule-based frequency count — if the same supplier or batch is associated with repeated quality/spoilage incidents across multiple outlets within a time window, flag it
- **Output**: pattern alert using cautious language
- **Example**: "Potential recurring supplier/batch issue detected across 2 outlets in the last 14 days. Review recommended." — the system never states the supplier is at fault, only that a pattern exists worth reviewing.
- **Prototype implementation**: simple count/threshold rule across the `supplier_incidents` table
- **Future**: statistical significance testing to avoid false positives at higher data volumes

## 9. Root-Cause Analysis

- **Input data**: waste_records grouped by ingredient, day of week, stage, and reason, cross-referenced with preparation and forecast data
- **Processing**: rule-based pattern detection (e.g., "waste for item X is consistently higher on day Y") + Gemini API call to phrase the finding in plain language
- **Output**: a plain-language explanation, explicitly framed as analysis, not proof
- **Example**: "Rice waste has been consistently higher on Mondays because preparation quantity is higher than actual demand on that day." The system is careful to present this as a pattern in the data, not an established causal fact.
- **Prototype implementation**: backend computes the actual pattern (numbers) first; Gemini only phrases it — it is never allowed to state a cause the backend didn't verify
- **Future**: could support more advanced causal-pattern detection as more historical data accumulates

## 10. Continuous Learning

- **Input data**: predicted demand vs actual sales, predicted waste vs actual waste, recommendation vs eventual outcome
- **Processing**: for the prototype, this is a **comparison/logging mechanism** — the system stores the delta between prediction and actual outcome. It surfaces this to the user ("Model missed by 18% last Saturday") rather than claiming automatic self-retraining.
- **Output**: accuracy tracking displayed to the user; informs manual tuning of forecast parameters
- **Prototype implementation**: logging + delta calculation, displayed on dashboard
- **Future production implementation**: automated retraining pipeline that periodically updates model weights/parameters based on accumulated outcome data

---

## Why This Approach Is Appropriate for the Prototype
A judge-facing SIH prototype needs to be explainable and demonstrably correct within a short demo window. Rule-based and statistical methods let us show exactly *why* the system recommended something, using real numbers computed live from the demo dataset — which is more convincing in a 4-minute demo than a claimed "AI model" that can't be interrogated. The Gemini API is used specifically where it's good at: turning verified structured data into natural language, not at generating numbers it wasn't given.
