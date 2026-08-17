import type {
  Alert,
  DashboardSummary,
  ForecastResponse,
  Ingredient,
  InventoryBatch,
  ProcurementRecommendation,
  RedistributionOpportunity,
  RiskResponse,
  RootCauseResponse,
  User,
  WasteAnalytics,
  WasteRecord,
} from "../types/api"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "")
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? "manager@foodwise.ai"
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? "foodwise-demo"

let token: string | null = localStorage.getItem("foodwise_token")

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!token) {
    await login()
  }
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 401) {
    token = null
    localStorage.removeItem("foodwise_token")
    await login()
    return request<T>(path, options)
  }
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function login(): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  })
  if (!response.ok) {
    throw new Error("Demo login failed")
  }
  const data = await response.json() as { token: string; user: User }
  token = data.token
  localStorage.setItem("foodwise_token", token)
  return data
}

export const api = {
  dashboard: (outletId = "o-1") => request<DashboardSummary>(`/dashboard/summary?outlet_id=${outletId}`),
  ingredients: () => request<{ ingredients: Ingredient[] }>("/catalog/ingredients"),
  inventory: (outletId = "o-1") => request<{ inventory: InventoryBatch[] }>(`/inventory?outlet_id=${outletId}`),
  forecast: (outletId = "o-1") => request<ForecastResponse>(`/forecast?outlet_id=${outletId}&date=2026-08-16`),
  risks: (outletId = "o-1") => request<RiskResponse>(`/risk?outlet_id=${outletId}`),
  procurement: (outletId = "o-1") => request<{ recommendations: ProcurementRecommendation[] }>(`/procurement/recommendations?outlet_id=${outletId}`),
  preparation: (outletId = "o-1") => request<{ recommendations: any[] }>(`/preparation/recommendations?outlet_id=${outletId}`),
  redistribution: () => request<{ opportunities: RedistributionOpportunity[] }>("/redistribution/opportunities"),
  waste: (outletId = "o-1") => request<{ waste: WasteRecord[] }>(`/waste?outlet_id=${outletId}`),
  wasteAnalytics: (outletId = "o-1", groupBy = "ingredient") => request<WasteAnalytics>(`/waste/analytics?outlet_id=${outletId}&group_by=${groupBy}`),
  impact: (outletId = "o-1") => request<Record<string, number>>(`/waste/impact?outlet_id=${outletId}`),
  rootCause: (outletId = "o-1") => request<RootCauseResponse>(`/root-cause?outlet_id=${outletId}`),
  alerts: (outletId = "o-1") => request<{ alerts: Alert[] }>(`/alerts?outlet_id=${outletId}`),
  approveProcurement: (id: string, approved = true) => request<{ id: string; status: string }>(`/procurement/${id}/approve?approved=${approved}`, { method: "POST" }),
  approveRedistribution: (id: string, approved = true) => request<{ id: string; status: string }>(`/redistribution/${id}/approve?approved=${approved}`, { method: "POST" }),
  dismissAlert: (id: string) => request<{ id: string; status: string }>(`/alerts/${id}/dismiss`, { method: "POST" }),
  logWaste: (payload: { outlet_id: string; ingredient_id: string; quantity: number; reason: string; stage: string }) =>
    request<WasteRecord>("/waste", { method: "POST", body: JSON.stringify(payload) }),
}
