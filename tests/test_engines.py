from __future__ import annotations

import unittest

from app.data.seed_data import REFERENCE_DATE, STORE
from app.services.analytics import root_cause_patterns
from app.services.forecasting import forecast_for_item
from app.services.recommendations import procurement_recommendations, redistribution_opportunities
from app.services.risk import score_batch_risk


class ForecastEngineTests(unittest.TestCase):
    def test_forecast_returns_positive_prediction_with_bounds(self) -> None:
        result = forecast_for_item(STORE.sales, "o-1", "ing-tomato", REFERENCE_DATE)

        self.assertGreater(result.predicted_quantity, 0)
        self.assertLess(result.lower_bound, result.predicted_quantity)
        self.assertGreater(result.upper_bound, result.predicted_quantity)


class RiskEngineTests(unittest.TestCase):
    def test_near_expiry_perishable_batch_is_high_risk(self) -> None:
        batch = next(item for item in STORE.inventory_batches if item.id == "b-pancake-1")
        ingredient = STORE.ingredient(batch.ingredient_id)

        result = score_batch_risk(batch, ingredient, predicted_consumption=3.0, today=REFERENCE_DATE)

        self.assertEqual(result.risk_level, "high")
        self.assertGreaterEqual(result.risk_score, 0.72)


class RecommendationEngineTests(unittest.TestCase):
    def test_redistribution_detects_tomato_surplus_and_shortage(self) -> None:
        results = redistribution_opportunities(STORE)

        tomato_moves = [item for item in results if item.ingredient_id == "ing-tomato"]
        self.assertTrue(tomato_moves)
        self.assertGreater(tomato_moves[0].suggested_quantity, 0)

    def test_procurement_contains_action_for_each_ingredient(self) -> None:
        results = procurement_recommendations(STORE, "o-1")

        self.assertEqual(len(results), len(STORE.ingredients))
        self.assertTrue({item.action for item in results}.issubset({"buy", "delay", "reduce"}))


class AnalyticsTests(unittest.TestCase):
    def test_root_cause_patterns_include_rice_overproduction(self) -> None:
        results = root_cause_patterns(STORE, "o-1")

        self.assertTrue(any(item["ingredient"] == "Basmati Rice" for item in results))


if __name__ == "__main__":
    unittest.main()

