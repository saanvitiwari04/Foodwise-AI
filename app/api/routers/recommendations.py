from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import current_user, require_manager
from app.data.seed_data import REFERENCE_DATE, STORE
from app.domain.models import User, to_dict
from app.services.analytics import impact_metrics, root_cause_patterns
from app.services.explanations import grounded_explanation
from app.services.recommendations import (
    preparation_recommendations,
    procurement_recommendations,
    redistribution_opportunities,
)


router = APIRouter(tags=["recommendations"])


@router.get("/procurement/recommendations")
def procurement(
    outlet_id: str = Query(...),
    target_date: date = Query(default=REFERENCE_DATE, alias="date"),
    _: User = Depends(current_user),
) -> dict:
    return {"recommendations": to_dict(procurement_recommendations(STORE, outlet_id, target_date))}


@router.post("/procurement/{recommendation_id}/approve")
def approve_procurement(recommendation_id: str, approved: bool = True, _: User = Depends(require_manager)) -> dict:
    return {"id": recommendation_id, "status": "approved" if approved else "rejected"}


@router.get("/preparation/recommendations")
def preparation(
    outlet_id: str = Query(...),
    target_date: date = Query(default=REFERENCE_DATE, alias="date"),
    _: User = Depends(current_user),
) -> dict:
    return {"recommendations": to_dict(preparation_recommendations(STORE, outlet_id, target_date))}


@router.get("/redistribution/opportunities")
def redistribution(_: User = Depends(current_user)) -> dict:
    return {"opportunities": to_dict(redistribution_opportunities(STORE))}


@router.post("/redistribution/{opportunity_id}/approve")
def approve_redistribution(opportunity_id: str, approved: bool = True, _: User = Depends(require_manager)) -> dict:
    return {"id": opportunity_id, "status": "approved" if approved else "rejected"}


@router.get("/recommendations")
def unified_recommendations(
    outlet_id: str = Query(...),
    _: User = Depends(current_user),
) -> dict:
    procurement_rows = procurement_recommendations(STORE, outlet_id)
    prep_rows = preparation_recommendations(STORE, outlet_id)
    redistributions = [
        row
        for row in redistribution_opportunities(STORE)
        if row.from_outlet_id == outlet_id or row.to_outlet_id == outlet_id
    ]
    recommendations = []
    for row in procurement_rows:
        ingredient = STORE.ingredient(row.ingredient_id)
        recommendations.append(
            {
                "id": row.id,
                "type": "procurement",
                "message": f"{row.action.title()} {row.recommended_quantity:g} {ingredient.unit} {ingredient.name}",
                "explanation": row.rationale,
                "confidence": "medium",
            }
        )
    for row in prep_rows:
        ingredient = STORE.ingredient(row.ingredient_id)
        recommendations.append(
            {
                "id": row.id,
                "type": "preparation",
                "message": f"Prepare {row.recommended_prep_quantity:g} {ingredient.unit} {ingredient.name}",
                "explanation": row.rationale,
                "confidence": "medium",
            }
        )
    for row in redistributions:
        ingredient = STORE.ingredient(row.ingredient_id)
        recommendations.append(
            {
                "id": row.id,
                "type": "redistribution",
                "message": f"Move {row.suggested_quantity:g} {ingredient.unit} {ingredient.name}",
                "explanation": row.rationale,
                "confidence": "high",
            }
        )
    return {"recommendations": recommendations}


@router.get("/root-cause")
def root_cause(
    outlet_id: str | None = Query(default=None),
    _: User = Depends(current_user),
) -> dict:
    patterns = root_cause_patterns(STORE, outlet_id)
    return {
        "patterns": patterns,
        "summary": grounded_explanation(
            "Waste pattern review",
            {"pattern_count": len(patterns), "impact": impact_metrics(STORE, outlet_id)},
        ),
    }

