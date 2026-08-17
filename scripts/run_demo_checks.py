from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.data.seed_data import REFERENCE_DATE, STORE
from app.services.analytics import impact_metrics, root_cause_patterns
from app.services.forecasting import forecast_for_item
from app.services.recommendations import redistribution_opportunities
from app.services.risk import score_batch_risk


def main() -> None:
    tomato_forecast = forecast_for_item(STORE.sales, "o-1", "ing-tomato", REFERENCE_DATE)
    paneer_forecast = forecast_for_item(STORE.sales, "o-1", "ing-paneer", REFERENCE_DATE)
    paneer_batch = next(batch for batch in STORE.inventory_batches if batch.id == "b-paneer-1")
    paneer = STORE.ingredient("ing-paneer")
    paneer_risk = score_batch_risk(paneer_batch, paneer, paneer_forecast.predicted_quantity, REFERENCE_DATE)
    transfers = redistribution_opportunities(STORE)
    impact = impact_metrics(STORE, "o-1")
    patterns = root_cause_patterns(STORE, "o-1")

    print("Foodwise AI demo checks")
    print(f"Forecast: o-1 tomatoes = {tomato_forecast.predicted_quantity} kg")
    print(f"Risk sample: {paneer_risk.inventory_batch_id} = {paneer_risk.risk_level} ({paneer_risk.risk_score})")
    print(f"Redistribution opportunities: {len(transfers)}")
    print(f"Estimated cost saved this week: INR {impact['estimated_cost_saved_this_week']}")
    print(f"Root-cause patterns: {len(patterns)}")


if __name__ == "__main__":
    main()
