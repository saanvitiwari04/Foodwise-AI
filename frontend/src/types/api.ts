export type RiskLevel = "low" | "medium" | "high"

export interface User {
  id: string
  name: string
  email: string
  role: string
  outlet_id: string | null
}

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  cost_per_unit: number
  perishability: number
}

export interface InventoryBatch {
  id: string
  outlet_id: string
  ingredient_id: string
  batch_code: string
  quantity: number
  unit: string
  purchase_date: string
  expiry_date: string
  supplier_id: string
  storage_condition: string
}

export interface ForecastItem {
  outlet_id: string
  ingredient_id: string
  forecast_date: string
  predicted_quantity: number
  lower_bound: number
  upper_bound: number
  rationale: string
}

export interface ForecastResponse {
  outlet_id: string
  date: string
  forecast: ForecastItem[]
}

export interface RiskItem {
  inventory_batch_id: string
  outlet_id: string
  ingredient_id: string
  risk_level: RiskLevel
  risk_score: number
  rationale: string
}

export interface RiskResponse {
  risks: RiskItem[]
}

export interface DashboardSummary {
  todays_prep_quantity: number
  high_risk_batches: number
  cost_saved_this_week: number
  redistribution_opportunities: number
  priority_actions: Array<{ item: string; severity: RiskLevel; message: string }>
}

export interface ProcurementRecommendation {
  id: string
  outlet_id: string
  ingredient_id: string
  action: "buy" | "delay" | "reduce"
  recommended_quantity: number
  rationale: string
  status: string
}

export interface RedistributionOpportunity {
  id: string
  ingredient_id: string
  from_outlet_id: string
  to_outlet_id: string
  suggested_quantity: number
  rationale: string
  status: string
}

export interface WasteRecord {
  id: string
  outlet_id: string
  ingredient_id: string
  quantity: number
  reason: string
  stage: string
  logged_by: string
  logged_at: string
}

export interface WasteAnalytics {
  group_by: string
  results: Array<{ key: string; quantity: number; estimated_cost: number; records: number }>
}

export interface RootCauseResponse {
  patterns: Array<{ ingredient_id: string; ingredient: string; reason: string; quantity: number; analysis: string }>
  summary: string
}

export interface Alert {
  id: string
  outlet_id: string
  type: string
  severity: RiskLevel
  message: string
  related_entity_type: string
  related_entity_id: string
}
