from __future__ import annotations

from dataclasses import replace
from datetime import date, timedelta
from itertools import count

from app.domain.models import (
    Ingredient,
    InventoryBatch,
    Organization,
    Outlet,
    Sale,
    Supplier,
    User,
    WasteRecord,
)


REFERENCE_DATE = date(2026, 8, 15)


class DemoStore:
    """Small mutable store for the SIH prototype.

    It intentionally mirrors the planned database entities so the app can later
    move to SQLAlchemy without rewriting the business logic.
    """

    def __init__(self) -> None:
        self.organizations = [Organization("org-1", "Foodwise AI Demo Kitchens")]
        self.outlets = [
            Outlet("o-1", "org-1", "Jaipur Palace Hotel", "Jaipur", "MI Road"),
            Outlet("o-2", "org-1", "Pink City Cafe", "Jaipur", "C-Scheme"),
            Outlet("o-3", "org-1", "Airport Express Kitchen", "Jaipur", "Terminal Road"),
        ]
        self.users = [
            User("u-admin", "org-1", "Meera Rao", "admin@foodwise.ai", "admin", None),
            User("u-manager-1", "org-1", "Priya Sharma", "manager@foodwise.ai", "manager", "o-1"),
            User("u-staff-1", "org-1", "Kabir Khan", "staff@foodwise.ai", "staff", "o-1"),
        ]
        self.ingredients = [
            Ingredient("ing-paneer", "org-1", "Paneer", "dairy", "kg", 4, 320.0, 0.9),
            Ingredient("ing-tomato", "org-1", "Tomatoes", "produce", "kg", 5, 42.0, 0.75),
            Ingredient("ing-rice", "org-1", "Basmati Rice", "grain", "kg", 180, 95.0, 0.2),
            Ingredient("ing-fruit", "org-1", "Cut Fruit Mix", "produce", "kg", 2, 180.0, 0.95),
            Ingredient("ing-pancake", "org-1", "Pancake Batter", "prepared", "l", 1, 90.0, 0.85),
        ]
        self.suppliers = [
            Supplier("sup-1", "org-1", "Rajasthan Dairy Co.", "dairy@example.com"),
            Supplier("sup-2", "org-1", "Amber Fresh Produce", "produce@example.com"),
            Supplier("sup-3", "org-1", "Desert Grains", "grains@example.com"),
        ]
        self.inventory_batches = [
            InventoryBatch("b-paneer-1", "o-1", "ing-paneer", "P-0814-A", 8.0, "kg", date(2026, 8, 14), date(2026, 8, 16), "sup-1"),
            InventoryBatch("b-tomato-1", "o-1", "ing-tomato", "T-0814-A", 26.0, "kg", date(2026, 8, 14), date(2026, 8, 18), "sup-2"),
            InventoryBatch("b-rice-1", "o-1", "ing-rice", "R-0801-A", 55.0, "kg", date(2026, 8, 1), date(2027, 1, 28), "sup-3"),
            InventoryBatch("b-fruit-1", "o-1", "ing-fruit", "F-0815-A", 14.0, "kg", date(2026, 8, 15), date(2026, 8, 16), "sup-2"),
            InventoryBatch("b-pancake-1", "o-1", "ing-pancake", "PB-0815-A", 18.0, "l", date(2026, 8, 15), date(2026, 8, 15), "sup-2"),
            InventoryBatch("b-tomato-2", "o-2", "ing-tomato", "T-0814-B", 5.0, "kg", date(2026, 8, 14), date(2026, 8, 18), "sup-2"),
            InventoryBatch("b-paneer-2", "o-2", "ing-paneer", "P-0814-B", 3.0, "kg", date(2026, 8, 14), date(2026, 8, 17), "sup-1"),
            InventoryBatch("b-tomato-3", "o-3", "ing-tomato", "T-0814-C", 7.0, "kg", date(2026, 8, 14), date(2026, 8, 18), "sup-2"),
            InventoryBatch("b-fruit-3", "o-3", "ing-fruit", "F-0815-C", 4.0, "kg", date(2026, 8, 15), date(2026, 8, 16), "sup-2"),
        ]
        self.sales = self._build_sales()
        self.waste_records = [
            WasteRecord("w-1", "o-1", "ing-rice", 6.0, "overproduction", "service", "u-staff-1", logged_at=logged_at_date(date(2026, 8, 3))),
            WasteRecord("w-2", "o-1", "ing-rice", 5.0, "overproduction", "service", "u-staff-1", logged_at=logged_at_date(date(2026, 8, 10))),
            WasteRecord("w-3", "o-1", "ing-pancake", 4.5, "slow_movement", "service", "u-staff-1", logged_at=logged_at_date(date(2026, 8, 15))),
            WasteRecord("w-4", "o-2", "ing-fruit", 1.5, "spoilage", "storage", "u-manager-1", logged_at=logged_at_date(date(2026, 8, 14))),
        ]
        self._waste_counter = count(100)

    def _build_sales(self) -> list[Sale]:
        sales: list[Sale] = []
        idx = count(1)
        baselines = {
            "o-1": {"ing-paneer": 5.6, "ing-tomato": 13.5, "ing-rice": 22.0, "ing-fruit": 11.0, "ing-pancake": 15.5},
            "o-2": {"ing-paneer": 2.8, "ing-tomato": 14.0, "ing-rice": 12.0, "ing-fruit": 6.0, "ing-pancake": 5.0},
            "o-3": {"ing-paneer": 3.4, "ing-tomato": 10.0, "ing-rice": 15.0, "ing-fruit": 7.5, "ing-pancake": 7.0},
        }
        for days_ago in range(42, 0, -1):
            sale_day = REFERENCE_DATE - timedelta(days=days_ago)
            weekend = 1.22 if sale_day.weekday() in (5, 6) else 1.0
            trend = 1 + (42 - days_ago) * 0.003
            for outlet_id, ingredients in baselines.items():
                for ingredient_id, baseline in ingredients.items():
                    pulse = 1 + (((days_ago + len(outlet_id) + len(ingredient_id)) % 5) - 2) * 0.035
                    qty = round(baseline * weekend * trend * pulse, 2)
                    sales.append(Sale(f"s-{next(idx)}", outlet_id, ingredient_id, qty, sale_day))
        return sales

    def list_batches(self, outlet_id: str | None = None) -> list[InventoryBatch]:
        batches = self.inventory_batches
        if outlet_id:
            batches = [batch for batch in batches if batch.outlet_id == outlet_id]
        return sorted(batches, key=lambda batch: (batch.expiry_date, batch.ingredient_id))

    def ingredient(self, ingredient_id: str) -> Ingredient:
        return next(item for item in self.ingredients if item.id == ingredient_id)

    def outlet(self, outlet_id: str) -> Outlet:
        return next(item for item in self.outlets if item.id == outlet_id)

    def total_stock(self, outlet_id: str, ingredient_id: str) -> float:
        return round(
            sum(
                batch.quantity
                for batch in self.inventory_batches
                if batch.outlet_id == outlet_id and batch.ingredient_id == ingredient_id
            ),
            2,
        )

    def add_waste(self, record: WasteRecord) -> WasteRecord:
        record.id = f"w-{next(self._waste_counter)}"
        self.waste_records.append(record)
        if record.inventory_batch_id:
            for index, batch in enumerate(self.inventory_batches):
                if batch.id == record.inventory_batch_id:
                    new_qty = max(batch.quantity - record.quantity, 0)
                    self.inventory_batches[index] = replace(batch, quantity=round(new_qty, 2))
        return record


def logged_at_date(value: date):
    from datetime import datetime, time

    return datetime.combine(value, time(hour=11))


STORE = DemoStore()
