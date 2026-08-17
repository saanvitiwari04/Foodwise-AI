from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import current_user
from app.data.seed_data import REFERENCE_DATE, STORE
from app.domain.models import Alert, User, to_dict
from app.services.forecasting import forecast_for_item
from app.services.risk import score_batch_risk


router = APIRouter(prefix="/alerts", tags=["alerts"])


def build_alerts(outlet_id: str | None = None) -> list[Alert]:
    alerts: list[Alert] = []
    for batch in STORE.list_batches(outlet_id):
        ingredient = STORE.ingredient(batch.ingredient_id)
        forecast = forecast_for_item(STORE.sales, batch.outlet_id, batch.ingredient_id, batch.expiry_date)
        risk = score_batch_risk(batch, ingredient, forecast.predicted_quantity, REFERENCE_DATE)
        if risk.risk_level == "low":
            continue
        alert_id = f"alert-{batch.id}"
        if alert_id in STORE.dismissed_alerts:
            continue
        alerts.append(
            Alert(
                id=alert_id,
                outlet_id=batch.outlet_id,
                type="spoilage_risk",
                severity=risk.risk_level,
                message=f"{ingredient.name}: {risk.rationale}",
                related_entity_type="inventory_batch",
                related_entity_id=batch.id,
            )
        )
    return alerts


@router.get("")
def alerts(outlet_id: str | None = None, _: User = Depends(current_user)) -> dict:
    return {"alerts": to_dict(build_alerts(outlet_id))}


@router.post("/{alert_id}/dismiss")
def dismiss_alert(alert_id: str, _: User = Depends(current_user)) -> dict:
    STORE.dismissed_alerts.add(alert_id)
    return {"id": alert_id, "status": "dismissed"}
