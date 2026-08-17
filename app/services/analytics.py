from __future__ import annotations

from collections import defaultdict
from datetime import date

from app.data.seed_data import DemoStore


def waste_summary(store: DemoStore, outlet_id: str | None = None, group_by: str = "ingredient") -> dict:
    rows = [record for record in store.waste_records if outlet_id is None or record.outlet_id == outlet_id]
    grouped: dict[str, dict] = defaultdict(lambda: {"quantity": 0.0, "estimated_cost": 0.0, "records": 0})
    for record in rows:
        if group_by == "outlet":
            key = store.outlet(record.outlet_id).name
        elif group_by == "reason":
            key = record.reason
        else:
            key = store.ingredient(record.ingredient_id).name
        ingredient = store.ingredient(record.ingredient_id)
        grouped[key]["quantity"] = round(grouped[key]["quantity"] + record.quantity, 2)
        grouped[key]["estimated_cost"] = round(grouped[key]["estimated_cost"] + record.quantity * ingredient.cost_per_unit, 2)
        grouped[key]["records"] += 1
    return {
        "group_by": group_by,
        "results": [{"key": key, **value} for key, value in sorted(grouped.items())],
    }


def root_cause_patterns(store: DemoStore, outlet_id: str | None = None) -> list[dict]:
    rows = [record for record in store.waste_records if outlet_id is None or record.outlet_id == outlet_id]
    by_ingredient_reason: dict[tuple[str, str], float] = defaultdict(float)
    for record in rows:
        by_ingredient_reason[(record.ingredient_id, record.reason)] += record.quantity

    patterns: list[dict] = []
    for (ingredient_id, reason), qty in sorted(by_ingredient_reason.items(), key=lambda item: item[1], reverse=True):
        if qty < 3:
            continue
        ingredient = store.ingredient(ingredient_id)
        patterns.append(
            {
                "ingredient_id": ingredient_id,
                "ingredient": ingredient.name,
                "reason": reason,
                "quantity": round(qty, 2),
                "analysis": f"{ingredient.name} has {qty:g} {ingredient.unit} logged as {reason}. Review prep quantity, demand assumptions, and service timing.",
            }
        )
    return patterns


def impact_metrics(store: DemoStore, outlet_id: str | None = None) -> dict:
    summary = waste_summary(store, outlet_id)
    waste_cost = round(sum(row["estimated_cost"] for row in summary["results"]), 2)
    waste_qty = round(sum(row["quantity"] for row in summary["results"]), 2)
    avoided_cost = round(waste_cost * 0.18, 2)
    return {
        "logged_waste_quantity": waste_qty,
        "logged_waste_cost": waste_cost,
        "estimated_cost_saved_this_week": avoided_cost,
        "co2e_proxy_kg": round(waste_qty * 2.5, 2),
        "meals_recovery_proxy": round(waste_qty / 0.35, 0),
    }

