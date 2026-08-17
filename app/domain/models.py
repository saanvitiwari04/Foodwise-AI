from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import UTC, date, datetime
from typing import Any, Literal


Role = Literal["admin", "manager", "staff"]
RiskLevel = Literal["low", "medium", "high"]
RecommendationStatus = Literal["pending", "approved", "rejected", "completed"]


@dataclass(slots=True)
class Organization:
    id: str
    name: str


@dataclass(slots=True)
class Outlet:
    id: str
    organization_id: str
    name: str
    city: str
    address: str


@dataclass(slots=True)
class User:
    id: str
    organization_id: str
    name: str
    email: str
    role: Role
    outlet_id: str | None
    password: str = "foodwise-demo"


@dataclass(slots=True)
class Ingredient:
    id: str
    organization_id: str
    name: str
    category: str
    unit: str
    default_shelf_life_days: int
    cost_per_unit: float
    perishability: float


@dataclass(slots=True)
class Supplier:
    id: str
    organization_id: str
    name: str
    contact_info: str


@dataclass(slots=True)
class InventoryBatch:
    id: str
    outlet_id: str
    ingredient_id: str
    batch_code: str
    quantity: float
    unit: str
    purchase_date: date
    expiry_date: date
    supplier_id: str
    storage_condition: str = "normal"


@dataclass(slots=True)
class Sale:
    id: str
    outlet_id: str
    ingredient_id: str
    quantity_sold: float
    sale_date: date
    channel: str = "dine-in"


@dataclass(slots=True)
class WasteRecord:
    id: str
    outlet_id: str
    ingredient_id: str
    quantity: float
    reason: str
    stage: str
    logged_by: str
    inventory_batch_id: str | None = None
    logged_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(slots=True)
class ForecastResult:
    outlet_id: str
    ingredient_id: str
    forecast_date: date
    predicted_quantity: float
    lower_bound: float
    upper_bound: float
    rationale: str
    model_version: str = "moving-average-dow-v1"


@dataclass(slots=True)
class RiskResult:
    inventory_batch_id: str
    outlet_id: str
    ingredient_id: str
    risk_level: RiskLevel
    risk_score: float
    rationale: str
    computed_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(slots=True)
class ProcurementRecommendation:
    id: str
    outlet_id: str
    ingredient_id: str
    action: Literal["buy", "delay", "reduce"]
    recommended_quantity: float
    rationale: str
    status: RecommendationStatus = "pending"


@dataclass(slots=True)
class PreparationRecommendation:
    id: str
    outlet_id: str
    ingredient_id: str
    service_date: date
    predicted_demand: float
    recommended_prep_quantity: float
    rationale: str


@dataclass(slots=True)
class RedistributionOpportunity:
    id: str
    ingredient_id: str
    from_outlet_id: str
    to_outlet_id: str
    suggested_quantity: float
    rationale: str
    status: RecommendationStatus = "pending"


@dataclass(slots=True)
class Alert:
    id: str
    outlet_id: str
    type: str
    severity: RiskLevel
    message: str
    related_entity_type: str
    related_entity_id: str
    acknowledged: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))


def to_dict(value: Any) -> Any:
    if isinstance(value, list):
        return [to_dict(item) for item in value]
    if isinstance(value, dict):
        return {key: to_dict(item) for key, item in value.items()}
    if hasattr(value, "__dataclass_fields__"):
        return {
            key: to_dict(item)
            for key, item in asdict(value).items()
        }
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value
