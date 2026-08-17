import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Cell, PieChart, Pie,
  ComposedChart, Legend
} from "recharts"
import { api } from "./services/api"
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
  WasteAnalytics,
  WasteRecord,
} from "./types/api"

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  navy: "#173653",
  navy2: "#2E6F95",
  teal: "#5F9E9D",
  mint: "#E8F4F1",
  coral: "#E88968",
  cream: "#FFF4E7",
  green: "#4D8C6B",
  amber: "#D9922E",
  red: "#C95555",
  bg: "#F5F7F8",
  card: "#FFFFFF",
  text: "#173653",
  muted: "#667784",
  border: "#DCE4E8",
}

// ─── Image map ───────────────────────────────────────────────────────────────
const IMG = {
  paneer: "https://images.unsplash.com/photo-1524239077444-27413e763bba?w=120&h=90&fit=crop&auto=format",
  buffet: "https://images.unsplash.com/photo-1722477936580-84aa10762b0b?w=400&h=200&fit=crop&auto=format",
  pancakes: "https://images.unsplash.com/photo-1612182062633-9ff3b3598e96?w=120&h=90&fit=crop&auto=format",
  fruit: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=120&h=90&fit=crop&auto=format",
  paratha: "https://images.unsplash.com/photo-1708783741187-ff1d081d87da?w=120&h=90&fit=crop&auto=format",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&h=90&fit=crop&auto=format",
  bread: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=120&h=90&fit=crop&auto=format",
  omelette: "https://images.unsplash.com/photo-1665206231479-6bff0bdcd51d?w=120&h=90&fit=crop&auto=format",
}

type FoodWiseData = {
  loading: boolean
  error: string | null
  dashboard: DashboardSummary | null
  ingredients: Ingredient[]
  inventory: InventoryBatch[]
  forecast: ForecastResponse | null
  risks: RiskResponse["risks"]
  procurement: ProcurementRecommendation[]
  redistributions: RedistributionOpportunity[]
  waste: WasteRecord[]
  wasteAnalytics: WasteAnalytics | null
  impact: Record<string, number> | null
  rootCause: RootCauseResponse | null
  alerts: Alert[]
  refresh: () => Promise<void>
}

const FoodWiseContext = createContext<FoodWiseData | null>(null)

function useFoodWise() {
  const value = useContext(FoodWiseContext)
  if (!value) throw new Error("useFoodWise must be used inside FoodWiseContext")
  return value
}

function nameFor(ingredients: Ingredient[], id: string) {
  return ingredients.find(item => item.id === id)?.name ?? id.replace("ing-", "")
}

function LoadingStrip({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div style={{ background: "#FEE8E8", color: C.red, border: `1px solid ${C.red}33`, padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
      Backend connection issue. Showing last known prototype data.
    </div>
  )
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(23,54,83,0.06)", ...style }}
      className={className}
    >
      {children}
    </div>
  )
}

function Badge({ label, variant }: { label: string; variant: "high" | "medium" | "low" | "urgent" | "available" | "success" | "verified" }) {
  const map = {
    high: { bg: "#FEE8E8", color: C.red },
    medium: { bg: "#FFF3E0", color: C.amber },
    low: { bg: "#E6F4ED", color: C.green },
    urgent: { bg: "#FEE8E8", color: C.red },
    available: { bg: C.mint, color: C.teal },
    success: { bg: "#E6F4ED", color: C.green },
    verified: { bg: C.mint, color: C.teal },
  }
  const s = map[variant]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, letterSpacing: 0.3 }}>
      {label}
    </span>
  )
}

function Btn({ children, variant = "primary", onClick, small }: { children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "coral"; onClick?: () => void; small?: boolean }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.navy, color: "#fff", border: `1px solid ${C.navy}` },
    secondary: { background: "#fff", color: C.navy, border: `1px solid ${C.navy}` },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    coral: { background: C.coral, color: "#fff", border: `1px solid ${C.coral}` },
  }
  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant],
        padding: small ? "4px 12px" : "8px 16px",
        borderRadius: 8,
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
        letterSpacing: 0.1,
        transition: "opacity .15s",
        whiteSpace: "nowrap",
      }}
      onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
      onMouseOut={e => (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "command", label: "Command Center", icon: "⊞" },
  { id: "forecast", label: "Forecast & Prep", icon: "📊" },
  { id: "wastelog", label: "Waste Log", icon: "📋" },
  { id: "explorer", label: "Waste Explorer", icon: "🔍" },
  { id: "surplus", label: "Surplus Hub", icon: "♻️" },
  { id: "impact", label: "Impact", icon: "🌿" },
  { id: "imports", label: "Data Imports", icon: "⬆" },
  { id: "settings", label: "Settings", icon: "⚙" },
]

function Sidebar({ active, setActive }: { active: string; setActive: (s: string) => void }) {
  return (
    <div style={{ width: 224, minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.teal}, ${C.coral})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            🌿
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}>FoodWise AI</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: 0.2 }}>Prepare smarter.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: isActive ? "rgba(95,158,157,0.18)" : "transparent",
                color: isActive ? C.teal : "rgba(255,255,255,0.58)",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                marginBottom: 2, transition: "all .15s",
                fontFamily: "Inter, sans-serif", textAlign: "left",
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)" }}
              onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
            >
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div style={{ marginLeft: "auto", width: 3, height: 16, borderRadius: 2, background: C.teal }} />}
            </button>
          )
        })}
      </nav>

      {/* Profile */}
      <div style={{ padding: "16px 16px 20px", borderTop: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.teal}, ${C.navy2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
            AS
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Ananya Sharma</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Operations Manager</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Jaipur Heritage Hotel</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopHeader({ page }: { page: string }) {
  const titles: Record<string, string> = {
    command: "Command Center", forecast: "Forecast & Prep", wastelog: "Waste Log",
    explorer: "Waste Explorer", surplus: "Surplus Hub", impact: "Impact",
    imports: "Data Imports", settings: "Settings",
  }
  return (
    <div style={{
      height: 56, background: "#fff", borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ color: C.muted, fontSize: 12 }}>Jaipur Heritage Hotel</span>
        <span style={{ color: C.border, margin: "0 6px" }}>›</span>
        <span style={{ color: C.navy, fontSize: 12, fontWeight: 600 }}>{titles[page]}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.mint, color: C.teal, fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
          🌧 31°C · Light rain
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>Saturday, 16 Aug 2026</div>
        <div style={{ position: "relative" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `1px solid ${C.border}`, fontSize: 16 }}>
            🔔
          </div>
          <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, background: C.coral, borderRadius: "50%", border: "2px solid #fff" }} />
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.teal}, ${C.navy2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          AS
        </div>
      </div>
    </div>
  )
}

// ─── Command Center ───────────────────────────────────────────────────────────

const demandData = [
  { day: "D1", actual: 480, forecast: 510 },
  { day: "D2", actual: 520, forecast: 500 },
  { day: "D3", actual: 460, forecast: 490 },
  { day: "D4", actual: 540, forecast: 525 },
  { day: "D5", actual: 510, forecast: 505 },
  { day: "D6", actual: 490, forecast: 515 },
  { day: "D7", actual: null, forecast: 530 },
]

function CommandCenter() {
  const { dashboard, ingredients, procurement, redistributions, risks, rootCause, error, refresh } = useFoodWise()
  const kpis = [
    { label: "Today's Prep", value: Math.round(dashboard?.todays_prep_quantity ?? 1240).toLocaleString("en-IN"), unit: "portions", trend: "AI-adjusted prep plan", trendDown: true, icon: "🍽" },
    { label: "Waste Risk", value: `${dashboard?.high_risk_batches ?? 3}`, unit: "critical batches", trend: `${risks.length || 3} active risk signals`, trendDown: true, icon: "⚠️" },
    { label: "Saved This Week", value: `₹${Math.round(dashboard?.cost_saved_this_week ?? 28460).toLocaleString("en-IN")}`, unit: "", trend: "from waste reduction", trendDown: false, icon: "💰" },
    { label: "Surplus", value: `${dashboard?.redistribution_opportunities ?? redistributions.length ?? 0}`, unit: "moves", trend: "inter-outlet opportunities", trendDown: false, icon: "♻️" },
  ]
  const priorityActions = dashboard?.priority_actions?.length
    ? dashboard.priority_actions.map(item => ({ name: item.item, level: item.severity, img: IMG.paneer, action: item.message, reason: "Computed by backend spoilage-risk engine.", btns: ["Accept", "Modify"] }))
    : procurement.slice(0, 3).map(item => ({ name: nameFor(ingredients, item.ingredient_id), level: item.action === "reduce" ? "high" as const : "medium" as const, img: IMG.rice, action: `${item.action[0].toUpperCase()}${item.action.slice(1)} ${item.recommended_quantity.toLocaleString("en-IN")} units`, reason: item.rationale, btns: [item.status === "approved" ? "Approved" : "Accept", "Modify"] }))
  const insight = rootCause?.summary ?? "Pancake demand is tracking 24% slower than expected. Start with a smaller second batch and shift fruit replenishment up by 12 portions."

  async function acceptPrimary() {
    const firstProcurement = procurement.find(item => item.status !== "approved")
    if (firstProcurement) {
      await api.approveProcurement(firstProcurement.id)
      await refresh()
    }
  }

  return (
    <div style={{ padding: "28px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <LoadingStrip error={error} />
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: 0 }}>Good morning, Ananya</h1>
        <p style={{ color: C.muted, fontSize: 14, margin: "4px 0 0" }}>Here is what needs attention before tomorrow's breakfast service.</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{k.value}</div>
                {k.unit && <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{k.unit}</div>}
              </div>
              <div style={{ fontSize: 22 }}>{k.icon}</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, color: k.trendDown ? C.red : C.green }}>
              {k.trend}
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Demand chart */}
          <Card style={{ padding: "20px 20px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Breakfast demand performance</div>
                <div style={{ fontSize: 12, color: C.muted }}>Actual vs AI Forecast · Last 7 days</div>
              </div>
              <a href="#" style={{ fontSize: 12, color: C.teal, textDecoration: "none", fontWeight: 500 }}>View details →</a>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={demandData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={C.border} />
                <XAxis dataKey="day" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="actual" fill={C.navy2} radius={[4, 4, 0, 0]} name="Actual" maxBarSize={32} />
                <Line dataKey="forecast" stroke={C.coral} strokeWidth={2.5} dot={{ fill: C.coral, r: 4, strokeWidth: 0 }} name="AI Forecast" connectNulls />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Bottom row: Live ops + Surplus network */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Live Operations */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Live Operations</div>
              {[
                { icon: "⏰", label: "Service begins in", value: "10h 20m" },
                { icon: "🏨", label: "Occupancy", value: "82%" },
                { icon: "📍", label: "Local event", value: "JCC · Final day" },
                { icon: "🎯", label: "Forecast confidence", value: "High · 86%" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{item.value}</span>
                </div>
              ))}
            </Card>

            {/* Surplus Network */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Surplus Network</div>
              {/* Simple flow diagram */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
                {["Kitchen", "FW Hub", "NGO", "Shelter"].map((node, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ background: C.teal, color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12 }}>{node}</div>
                    {i < arr.length - 1 && <div style={{ width: 16, height: 1.5, background: C.coral }} />}
                  </div>
                ))}
                <div style={{ width: 16, height: 1.5, background: C.green }} />
                <div style={{ background: C.green, color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 12 }}>✓ Done</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
                {["42 portions available", "Safe until 2:00 PM", "30 portions matched"].map((t, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.muted }}>· {t}</div>
                ))}
              </div>
              <Btn small>Open Surplus Hub</Btn>
            </Card>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Priority Actions */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Priority Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {priorityActions.map((a, i) => (
                <div key={i} style={{ padding: 14, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {a.img && <img src={a.img} alt={a.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{a.name}</span>
                    </div>
                    <Badge label={a.level.toUpperCase()} variant={a.level} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{a.action}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>{a.reason}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {a.btns.map((b, j) => <Btn key={j} variant={j === 0 ? "primary" : "secondary"} small onClick={j === 0 ? acceptPrimary : undefined}>{b}</Btn>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insight */}
          <Card style={{ padding: 20, background: C.mint, border: `1px solid ${C.teal}22` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✨</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>FoodWise AI Insight</div>
            </div>
            <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, margin: "0 0 14px" }}>
              {insight}
            </p>
            <Btn variant="secondary" small>See recommendation logic</Btn>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Forecast & Prep ──────────────────────────────────────────────────────────

const forecastTimeData = [
  { time: "6 AM", lo: 40, mid: 55, hi: 70 },
  { time: "7 AM", lo: 90, mid: 120, hi: 150 },
  { time: "8 AM", lo: 120, mid: 165, hi: 200 },
  { time: "9 AM", lo: 100, mid: 130, hi: 160 },
  { time: "10 AM", lo: 60, mid: 80, hi: 100 },
  { time: "11 AM", lo: 20, mid: 30, hi: 40 },
]

const prepPlan = [
  { name: "Masala Omelette", img: IMG.omelette, hist: 88, forecast: 92, prep: 88, batch: "Continuous", risk: "low" as const },
  { name: "Paneer Tikka", img: IMG.paneer, hist: 132, forecast: 118, prep: 114, batch: "Batch 1:82 / B2:32", risk: "medium" as const },
  { name: "Pancakes", img: IMG.pancakes, hist: 96, forecast: 74, prep: 70, batch: "Batch 1:50 / Trigger:20", risk: "high" as const },
  { name: "Cut Fruit", img: IMG.fruit, hist: 105, forecast: 128, prep: 124, batch: "Continuous replenishment", risk: "low" as const },
  { name: "Aloo Paratha", img: IMG.paratha, hist: 78, forecast: 82, prep: 78, batch: "Batch 1:60 / B2:18", risk: "low" as const },
  { name: "Jeera Rice", img: IMG.rice, hist: 64, forecast: 58, prep: 54, batch: "Single batch", risk: "medium" as const },
]

function ForecastPrep() {
  const [qty, setQty] = useState(114)
  const { ingredients, forecast, risks, procurement, refresh } = useFoodWise()
  const prepRows = forecast?.forecast?.length
    ? forecast.forecast.map((item, i) => {
      const risk = risks.find(row => row.ingredient_id === item.ingredient_id)?.risk_level ?? "low"
      return {
        name: nameFor(ingredients, item.ingredient_id),
        img: [IMG.paneer, IMG.fruit, IMG.rice, IMG.pancakes, IMG.omelette][i % 5],
        hist: Math.round(item.predicted_quantity * 0.92),
        forecast: Math.round(item.predicted_quantity),
        prep: Math.round(item.predicted_quantity * 1.04),
        batch: risk === "high" ? "Batch 1 / trigger batch" : "Continuous",
        risk,
      }
    })
    : prepPlan
  const expectedGuests = Math.round((forecast?.forecast ?? []).reduce((sum, item) => sum + item.predicted_quantity, 0) || 510)

  async function applyRecommendation() {
    const rec = procurement.find(item => item.status !== "approved")
    if (rec) {
      await api.approveProcurement(rec.id)
      await refresh()
    }
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Forecast & Prep</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Turn expected demand into a safer production plan.</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {[["Service", "Breakfast"], ["Date", "Sun, 17 Aug"], ["Location", "Jaipur Heritage Hotel"]].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{k}:</span>
            <span style={{ color: C.navy, fontWeight: 600 }}>{v}</span>
            <span style={{ color: C.muted }}>▾</span>
          </div>
        ))}
        {[["🌦 Weather sensitivity", true], ["📅 Event factor", false]].map(([label, on], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{label as string}</span>
            <div style={{ width: 34, height: 18, borderRadius: 9, background: on ? C.teal : C.border, display: "flex", alignItems: "center", padding: "2px", cursor: "pointer" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", marginLeft: on ? 16 : 0, transition: "margin .2s" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Forecast chart */}
          <Card style={{ padding: "20px 20px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Demand Forecast — Sunday Breakfast</div>
                <div style={{ fontSize: 12, color: C.muted }}>Expected demand: {expectedGuests} units · Range: {Math.round(expectedGuests * 0.85)}–{Math.round(expectedGuests * 1.15)}</div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, color: C.muted, alignItems: "center" }}>
                {["82% occupancy", "School holiday", "Convention checkout", "Light rain"].map((s, i) => (
                  <span key={i} style={{ background: C.bg, padding: "2px 8px", borderRadius: 10, border: `1px solid ${C.border}` }}>{s}</span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={forecastTimeData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.teal} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={C.border} />
                <XAxis dataKey="time" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                <Area dataKey="hi" stroke="transparent" fill="url(#confBand)" name="Confidence band" />
                <Area dataKey="lo" stroke="transparent" fill="#fff" name="lo" />
                <Line dataKey="mid" stroke={C.teal} strokeWidth={2.5} dot={false} name="Forecast" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Prep plan table */}
          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Recommended Prep Plan</div>
              <Btn variant="ghost" small>Export</Btn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {["Menu Item", "Hist. Avg.", "AI Forecast", "Rec. Prep", "Batch Strategy", "Risk", "Action"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prepRows.map((row, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <img src={row.img} alt={row.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />
                          <span style={{ fontWeight: 600, color: C.navy }}>{row.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: C.muted }}>{row.hist}</td>
                      <td style={{ padding: "12px 14px", color: C.navy2, fontWeight: 600 }}>{row.forecast}</td>
                      <td style={{ padding: "12px 14px", color: C.navy, fontWeight: 700 }}>{row.prep}</td>
                      <td style={{ padding: "12px 14px", color: C.muted, fontSize: 11 }}>{row.batch}</td>
                      <td style={{ padding: "12px 14px" }}><Badge label={row.risk.toUpperCase()} variant={row.risk} /></td>
                      <td style={{ padding: "12px 14px" }}><Btn small variant="ghost">Adjust</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Explainability */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Why this recommendation?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Occupancy signal", effect: "+14 portions", positive: true },
                { label: "Last 3 Sunday demand trend", effect: "−18 portions", positive: false },
                { label: "Pancake leftovers last week: 8.4 kg", effect: "−12 portions", positive: false },
                { label: "Event traffic confidence: moderate", effect: "+6 portions", positive: true },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 12, color: C.muted }}>{r.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.positive ? C.green : C.red, minWidth: 80, textAlign: "right" }}>{r.effect}</div>
                  <div style={{ width: 60, height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{ width: `${Math.abs(parseInt(r.effect)) * 4}%`, height: "100%", background: r.positive ? C.teal : C.coral, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 14, fontStyle: "italic" }}>Recommendation generated from operational signals, not a generic AI guess.</p>
          </Card>
        </div>

        {/* Simulation panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Adjust & Simulate</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Paneer Tikka</div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 14 }}>
              <button onClick={() => setQty(q => Math.max(80, q - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.border}`, background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}>−</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.navy }}>{qty}</div>
                <div style={{ fontSize: 11, color: C.muted }}>portions</div>
              </div>
              <button onClick={() => setQty(q => Math.min(150, q + 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.border}`, background: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}>+</button>
            </div>

            <input
              type="range" min={80} max={150} value={qty}
              onChange={e => setQty(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.teal, marginBottom: 16 }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { label: "Expected demand", value: "118 portions" },
                { label: "Stockout risk", value: qty < 100 ? "14%" : "6%", color: qty < 100 ? C.red : C.green },
                { label: "Predicted waste", value: `${(qty - 114) > 0 ? ((qty - 114) * 0.3 + 4.2).toFixed(1) : Math.max(0, 4.2 - (114 - qty) * 0.2).toFixed(1)} kg`, color: C.amber },
                { label: "Cost avoided", value: `₹${(1260 + (114 - qty) * 35).toLocaleString("en-IN")}` },
                { label: "CO2e avoided", value: `${(9.8 + (114 - qty) * 0.08).toFixed(1)} kg est.`, color: C.green },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color ?? C.navy }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Visual comparison */}
            <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Plan comparison</div>
              {[["Original Plan", 132, C.border], ["FoodWise Plan", qty, C.teal]].map(([label, val, color], i) => (
                <div key={i} style={{ marginBottom: i === 0 ? 6 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: C.muted }}>{label as string}</span>
                    <span style={{ color: C.navy, fontWeight: 600 }}>{val as number} portions</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                    <div style={{ width: `${((val as number) / 150) * 100}%`, height: "100%", background: color as string, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Btn onClick={applyRecommendation}>Apply recommendation</Btn>
              <Btn variant="secondary">Save as draft</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Waste Log (mobile-first) ─────────────────────────────────────────────────

const wasteItems = [
  { name: "Rice Bowl", img: IMG.rice, today: "2.4 kg" },
  { name: "Paneer Tikka", img: IMG.paneer, today: "1.1 kg" },
  { name: "Bread Basket", img: IMG.bread, today: "0.8 kg" },
  { name: "Cut Fruit", img: IMG.fruit, today: "0.6 kg" },
]

function WasteLog() {
  const { ingredients, wasteAnalytics, refresh } = useFoodWise()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [qty, setQty] = useState("1.1")
  const [unit, setUnit] = useState("kg")
  const [stage, setStage] = useState<string | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const wasteChoices = ingredients.length
    ? ingredients.slice(0, 4).map((item, i) => ({
      id: item.id,
      name: item.name,
      img: [IMG.rice, IMG.paneer, IMG.bread, IMG.fruit][i % 4],
      today: `${wasteAnalytics?.results.find(row => row.key === item.name)?.quantity ?? [2.4, 1.1, 0.8, 0.6][i]} ${item.unit}`,
    }))
    : wasteItems.map((item, i) => ({ ...item, id: ["ing-rice", "ing-paneer", "ing-pancake", "ing-fruit"][i] }))

  async function handleSave() {
    if (selected === null) return
    await api.logWaste({
      outlet_id: "o-1",
      ingredient_id: wasteChoices[selected].id,
      quantity: Number(qty) || 0,
      reason: (reason ?? "Overproduction").toLowerCase().replaceAll(" ", "_"),
      stage: (stage ?? "Buffet").toLowerCase().replaceAll(" ", "_"),
    })
    await refresh()
    setSaved(true)
    setStep(1)
  }

  return (
    <div style={{ padding: 28, display: "flex", gap: 28, alignItems: "flex-start" }}>
      {/* Mobile frame */}
      <div style={{ width: 375, flexShrink: 0 }}>
        <div style={{ background: C.navy, borderRadius: 20, padding: 2, boxShadow: "0 8px 40px rgba(23,54,83,0.25)" }}>
          <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", minHeight: 700 }}>
            {/* Mobile header */}
            <div style={{ background: C.navy, padding: "18px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🌿</span>
                <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Log Waste</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer" }}>×</span>
            </div>

            {/* Progress */}
            <div style={{ padding: "12px 20px", background: C.bg, display: "flex", gap: 6, alignItems: "center" }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? C.teal : C.border, transition: "background .3s" }} />
              ))}
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>Step {step} of 3</span>
            </div>

            <div style={{ padding: "20px 20px" }}>
              {step === 1 && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 16 }}>What was wasted?</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {wasteChoices.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setSelected(i)}
                        style={{
                          border: `2px solid ${selected === i ? C.teal : C.border}`,
                          borderRadius: 12, padding: 12, background: selected === i ? C.mint : "#fff",
                          cursor: "pointer", textAlign: "left", transition: "all .15s",
                        }}
                      >
                        <img src={item.img} alt={item.name} style={{ width: "100%", height: 60, borderRadius: 8, objectFit: "cover", marginBottom: 8 }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: C.teal }}>{item.today} today</div>
                      </button>
                    ))}
                    <button style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: 12, background: "#fff", cursor: "pointer", color: C.muted, fontSize: 12, fontWeight: 500 }}>
                      + Other item
                    </button>
                  </div>
                  <Btn onClick={() => selected !== null && setStep(2)}>Continue</Btn>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 16 }}>
                    {selected !== null ? wasteChoices[selected].name : "Item"} — how much?
                  </div>

                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {["kg", "portions", "units"].map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${unit === u ? C.teal : C.border}`, background: unit === u ? C.mint : "#fff", color: unit === u ? C.teal : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 20 }}>
                    <button onClick={() => setQty(q => String(Math.max(0.1, parseFloat(q) - 0.1).toFixed(1)))} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, fontSize: 22, cursor: "pointer" }}>−</button>
                    <input value={qty} onChange={e => setQty(e.target.value)} style={{ width: 80, textAlign: "center", fontSize: 32, fontWeight: 800, color: C.navy, border: "none", outline: "none", fontFamily: "Inter, sans-serif" }} />
                    <button onClick={() => setQty(q => String((parseFloat(q) + 0.1).toFixed(1)))} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, fontSize: 22, cursor: "pointer" }}>+</button>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Waste stage</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {["Prep", "Buffet", "Plate return", "Storage"].map(s => (
                      <button key={s} onClick={() => setStage(s)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${stage === s ? C.teal : C.border}`, background: stage === s ? C.mint : "#fff", color: stage === s ? C.teal : C.muted, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{s}</button>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Reason</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                    {["Overproduction", "Spoilage", "Quality issue", "Customer return", "Handling loss"].map(r => (
                      <button key={r} onClick={() => setReason(r)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${reason === r ? C.coral : C.border}`, background: reason === r ? C.cream : "#fff", color: reason === r ? C.coral : C.muted, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{r}</button>
                    ))}
                  </div>

                  <textarea placeholder="Add a quick note (optional)" style={{ width: "100%", minHeight: 64, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 12, color: C.navy, resize: "none", outline: "none", marginBottom: 12, fontFamily: "Inter, sans-serif" }} />

                  <div style={{ background: C.cream, border: `1px solid ${C.amber}33`, borderRadius: 8, padding: 10, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Estimated value lost</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.amber }}>₹462</span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="secondary" onClick={() => setStep(1)}>Back</Btn>
                    <div style={{ flex: 1 }}>
                      <Btn onClick={handleSave}>Save waste log</Btn>
                    </div>
                  </div>
                </>
              )}

              {saved && (
                <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", borderRadius: 16, padding: "16px 20px", maxWidth: 340, zIndex: 100, boxShadow: "0 8px 32px rgba(23,54,83,0.3)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>✓ Waste logged.</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>Paneer Tikka is now your #1 waste driver this week.</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setSaved(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer" }}>Dismiss</button>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: C.teal, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>See recommended fix</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop context */}
      <div style={{ flex: 1 }}>
        <Card style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Mobile Waste Log</div>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Designed for kitchen staff on mobile devices. Low-friction, large touch targets, three-step flow. Test the interactive prototype on the left.</p>
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Today's waste summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Total logged", value: "4.9 kg", color: C.red },
              { label: "Value lost", value: "₹1,840", color: C.amber },
              { label: "Top driver", value: "Paneer Tikka", color: C.navy },
              { label: "Avoidable", value: "3.2 kg (65%)", color: C.coral },
            ].map((s, i) => (
              <div key={i} style={{ background: C.bg, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Waste Explorer ───────────────────────────────────────────────────────────

const topDrivers = [
  { name: "Paneer Tikka", kg: 14.2 },
  { name: "Breakfast Bread", kg: 11.8 },
  { name: "Cut Fruit", kg: 8.6 },
  { name: "Jeera Rice", kg: 7.4 },
  { name: "Milk", kg: 5.9 },
]

const wasteStage = [
  { name: "Buffet leftover", value: 38, fill: C.navy2 },
  { name: "Prep trim", value: 22, fill: C.teal },
  { name: "Spoilage", value: 18, fill: C.coral },
  { name: "Plate return", value: 14, fill: C.amber },
  { name: "Storage", value: 8, fill: C.muted },
]

const wasteEvents = [
  { time: "08:12", item: "Paneer Tikka", qty: "4.2 kg", stage: "Buffet", reason: "Overproduction", cost: "₹1,260", by: "Ravi K." },
  { time: "09:45", item: "Breakfast Bread", qty: "3.1 kg", stage: "Buffet", reason: "Overproduction", cost: "₹930", by: "Meena S." },
  { time: "10:20", item: "Cut Fruit", qty: "2.2 kg", stage: "Plate return", reason: "Handling loss", cost: "₹660", by: "Ravi K." },
  { time: "11:05", item: "Milk", qty: "5 units", stage: "Storage", reason: "Spoilage", cost: "₹350", by: "System" },
  { time: "07:30", item: "Jeera Rice", qty: "2.8 kg", stage: "Prep", reason: "Overproduction", cost: "₹560", by: "Ananya S." },
]

function WasteExplorer() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Waste Explorer</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Find the repeated causes behind avoidable waste.</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {["Last 7 days", "Jaipur Heritage Hotel", "All services", "All categories", "All stages"].map((f, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.navy, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            {f} <span style={{ color: C.muted }}>▾</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto" }}><Btn variant="secondary" small>Export report</Btn></div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total waste", value: "58.6 kg", color: C.red },
          { label: "Avoidable waste", value: "41.2 kg", color: C.amber },
          { label: "Cost impact", value: "₹12,820", color: C.navy },
          { label: "Top cause", value: "Overproduction", color: C.coral },
        ].map((m, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 1fr", gap: 16 }}>
        {/* Bar chart */}
        <Card style={{ padding: "20px 20px 14px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Top waste drivers</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topDrivers} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid horizontal={false} stroke={C.border} />
              <XAxis type="number" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} unit=" kg" />
              <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} kg`, "Waste"]} />
              <Bar dataKey="kg" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {topDrivers.map((_, i) => <Cell key={i} fill={i === 0 ? C.coral : C.navy2} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 14 }}>Waste by stage</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={wasteStage} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value" nameKey="name">
                {wasteStage.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {wasteStage.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.fill, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Root cause insight */}
        <Card style={{ padding: 20, background: C.cream, border: `1px solid ${C.amber}22` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Root cause insight</div>
          <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.6, margin: "0 0 14px" }}>
            <strong>Paneer Tikka</strong> is repeatedly overprepared on weekends.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {[
              "62% of paneer waste occurs at breakfast buffet",
              "Avg. waste rate is 18% higher on Saturdays",
              "Forecast overestimation is the dominant contributor",
            ].map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.coral, marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.muted }}>{e}</span>
              </div>
            ))}
          </div>
          <Btn small>Create prep rule</Btn>
        </Card>
      </div>

      {/* Events table */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Waste events</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["Time", "Item", "Quantity", "Stage", "Reason", "Est. Cost", "Logged by"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11, letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wasteEvents.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px", color: C.muted }}>{r.time}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: C.navy }}>{r.item}</td>
                <td style={{ padding: "12px 16px", color: C.navy2, fontWeight: 600 }}>{r.qty}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ background: C.mint, color: C.teal, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{r.stage}</span></td>
                <td style={{ padding: "12px 16px", color: C.muted }}>{r.reason}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: C.amber }}>{r.cost}</td>
                <td style={{ padding: "12px 16px", color: C.muted }}>{r.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── Surplus Hub ──────────────────────────────────────────────────────────────

function SurplusHub() {
  const { redistributions, ingredients, refresh } = useFoodWise()
  const [selected, setSelected] = useState(0)
  const [countdown] = useState("01:42:18")

  const lots = redistributions.length > 0 ? redistributions.map(r => ({
    id: r.id,
    title: `Move ${nameFor(ingredients, r.ingredient_id)}`,
    imgs: [IMG.pancakes],
    portions: `${r.suggested_quantity} portions`,
    safe: `From ${r.from_outlet_id} to ${r.to_outlet_id}`,
    value: "High value",
    status: r.status === "pending" ? "available" : r.status === "approved" ? "success" : "urgent",
  })) : [
    { id: "dummy1", title: "Breakfast buffet surplus", imgs: [IMG.pancakes, IMG.fruit, IMG.paneer], portions: "42 portions", safe: "Safe until 2:00 PM", value: "₹2,100", status: "urgent" as const },
    { id: "dummy2", title: "Bakery & bread", imgs: [IMG.bread], portions: "55 portions", safe: "Safe until 6:30 PM", value: "₹1,650", status: "available" as const },
    { id: "dummy3", title: "Fresh produce", imgs: [IMG.fruit], portions: "29 portions", safe: "Safe until 5:00 PM", value: "₹1,070", status: "available" as const },
  ]

  async function handleConfirm() {
    const lot = lots[selected]
    if (lot && !lot.id.startsWith("dummy")) {
      await api.approveRedistribution(lot.id)
      await refresh()
    }
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Surplus Hub</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Route safe surplus to the highest-value destination before it expires.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Safe to redistribute", value: "126 portions", icon: "✅" },
          { label: "Deadline approaching", value: "2 lots", icon: "⏱", warn: true },
          { label: "Value recoverable", value: "₹4,820", icon: "💚" },
          { label: "Verified partners", value: "12", icon: "🤝" },
        ].map((c, i) => (
          <Card key={i} style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.warn ? C.amber : C.navy }}>{c.value}</div>
              </div>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 300px", gap: 16 }}>
        {/* Lot list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lots.map((lot, i) => (
            <Card
              key={i}
              onClick={() => setSelected(i)}
              style={{ padding: 16, cursor: "pointer", border: `2px solid ${selected === i ? C.teal : C.border}`, background: selected === i ? C.mint : "#fff" }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {lot.imgs.map((img, j) => (
                  <img key={j} src={img} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{lot.title}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy2 }}>{lot.portions}</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{lot.safe}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{lot.value}</span>
                <Badge label={lot.status.toUpperCase()} variant={lot.status} />
              </div>
            </Card>
          ))}
        </div>

        {/* Decision panel */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>Best action: Donate 30 portions</div>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 500, marginTop: 2 }}>94% match confidence</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { title: "Sell via local marketplace", details: ["Expected recovery: ₹820", "Likely pickup: 90 min", "Demand certainty: Medium"], recommended: false },
              { title: "Donate to verified NGO", details: ["30 portions accepted", "Pickup at 12:10 PM", "Distance: 2.4 km", "Social impact: 30 meals"], recommended: true },
              { title: "Compost / organic recovery", details: ["Use only for remaining unsuitable scraps", "Estimated organic waste: 2.1 kg"], recommended: false },
            ].map((opt, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, border: `2px solid ${opt.recommended ? C.teal : C.border}`, background: opt.recommended ? C.mint : "#fff", position: "relative" }}>
                {opt.recommended && <div style={{ position: "absolute", top: 12, right: 12, background: C.teal, color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>✓ Recommended</div>}
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8 }}>{opt.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {opt.details.map((d, j) => <div key={j} style={{ fontSize: 12, color: C.muted }}>· {d}</div>)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Partner + countdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Asha Community Kitchen</div>
              <Badge label="VERIFIED" variant="verified" />
            </div>
            <img src={IMG.buffet} alt="Partner" style={{ width: "100%", height: 100, borderRadius: 8, objectFit: "cover", marginBottom: 12 }} />
            {[
              ["Capacity", "30 portions"],
              ["Pickup window", "12:10–12:30 PM"],
              ["Distance", "2.4 km"],
              ["Contact", "Verified coordinator"],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Btn small onClick={handleConfirm}>Confirm pickup</Btn>
              <Btn variant="secondary" small>View route</Btn>
            </div>
          </Card>

          {/* Countdown */}
          <Card style={{ padding: 20, border: `1px solid ${C.coral}33` }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Food-safety decision window</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.coral, letterSpacing: 2, marginBottom: 8 }}>{countdown}</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
              FoodWise AI applies configured safety rules. Final approval remains with the kitchen manager.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Impact ───────────────────────────────────────────────────────────────────

const trendData = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  baseline: 85 - i * 1.5,
  actual: 80 - i * 4.5 + Math.sin(i) * 3,
}))

function Impact() {
  const [period, setPeriod] = useState("week")
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Impact</h1>
          <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Measure the operational, financial, and recovery outcomes of better food decisions.</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["week", "month", "custom"].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${period === p ? C.navy : C.border}`, background: period === p ? C.navy : "#fff", color: period === p ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {p === "week" ? "This week" : p === "month" ? "This month" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {/* Hero cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Cost avoided", value: "₹28,460", icon: "💰", color: C.green },
          { label: "Food waste avoided", value: "186.4 kg", icon: "🥗", color: C.teal },
          { label: "Meals recovered", value: "312", icon: "🍱", color: C.navy2 },
          { label: "CO2e avoided*", value: "482 kg", icon: "🌍", color: C.navy },
        ].map((c, i) => (
          <Card key={i} style={{ padding: "20px 18px" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{c.label}</div>
          </Card>
        ))}
      </div>
      <p style={{ fontSize: 11, color: C.muted, margin: "-8px 0 0", fontStyle: "italic" }}>*CO2e is an estimate based on versioned food-category emission factors.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Trend chart */}
        <Card style={{ padding: "20px 20px 14px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Waste reduction trend</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>vs. baseline · 8-week view</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line dataKey="baseline" stroke={C.border} strokeWidth={2} strokeDasharray="4 3" dot={false} name="Baseline" />
              <Line dataKey="actual" stroke={C.teal} strokeWidth={2.5} dot={{ fill: C.teal, r: 3, strokeWidth: 0 }} name="FoodWise performance" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Right: breakdown + circular */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Breakdown */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 12 }}>Impact breakdown</div>
            {[
              { label: "Prevention", kg: "132.2 kg", pct: 71, color: C.navy },
              { label: "Markdown recovery", kg: "18.1 kg", pct: 10, color: C.navy2 },
              { label: "Donations", kg: "36.1 kg", pct: 19, color: C.teal },
              { label: "Compost / recovery", kg: "22.4 kg", pct: 12, color: C.muted },
            ].map((b, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{b.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{b.kg}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                  <div style={{ width: `${b.pct}%`, height: "100%", background: b.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </Card>

          {/* Circular progress + achievement */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>Recovery rate</div>
              <svg width={80} height={80} style={{ margin: "0 auto 8px" }}>
                <circle cx={40} cy={40} r={32} fill="none" stroke={C.border} strokeWidth={8} />
                <circle cx={40} cy={40} r={32} fill="none" stroke={C.teal} strokeWidth={8}
                  strokeDasharray={`${2 * Math.PI * 32 * 0.72} ${2 * Math.PI * 32 * 0.28}`}
                  strokeLinecap="round" transform="rotate(-90 40 40)" />
                <text x={40} y={44} textAnchor="middle" fontSize={16} fontWeight={800} fill={C.navy}>72%</text>
              </svg>
              <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>↑ 9% from last month</div>
            </Card>
            <Card style={{ padding: 20, background: C.mint }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🏆</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Monthly achievement</div>
              <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                Your hotel prevented the equivalent of <strong style={{ color: C.navy }}>1,050 meal portions</strong> from being wasted this month.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Data Imports ─────────────────────────────────────────────────────────────

function DataImports() {
  const [showMapping, setShowMapping] = useState(false)
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Data Imports</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Bring sales, inventory and menu data into FoodWise AI.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { title: "Sales history CSV", icon: "📈", last: "15 Aug 2026 · 09:20", status: "Connected" },
          { title: "Inventory snapshot CSV", icon: "📦", last: "14 Aug 2026 · 22:00", status: "Connected" },
          { title: "Menu & recipes CSV", icon: "📋", last: "10 Aug 2026 · 14:30", status: "Needs update" },
        ].map((tile, i) => (
          <Card key={i} style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{tile.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 4 }}>{tile.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tile.status === "Connected" ? C.green : C.amber }} />
              <span style={{ fontSize: 12, color: tile.status === "Connected" ? C.green : C.amber, fontWeight: 500 }}>{tile.status}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>Last sync: {tile.last}</div>

            <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: "16px 12px", textAlign: "center", marginBottom: 12, cursor: "pointer" }}
              onMouseOver={e => (e.currentTarget.style.borderColor = C.teal)}
              onMouseOut={e => (e.currentTarget.style.borderColor = C.border)}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>⬆</div>
              <div style={{ fontSize: 12, color: C.muted }}>Drop file or <span style={{ color: C.teal, fontWeight: 600 }}>browse</span></div>
            </div>
            <a href="#" style={{ fontSize: 11, color: C.navy2, textDecoration: "none" }}>View format example →</a>
          </Card>
        ))}
      </div>

      {/* Imported file table */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Recent imports</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.bg }}>
              {["File", "Status", "Rows", "Quality score", "Issues", "Action"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11, letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { file: "breakfast_sales_august.csv", status: "Imported", rows: "2,847", quality: "92%", issues: "5 menu items need mapping" },
              { file: "inventory_aug14.csv", status: "Imported", rows: "412", quality: "98%", issues: "None" },
              { file: "menu_v3.csv", status: "Pending review", rows: "186", quality: "74%", issues: "12 recipe fields missing" },
            ].map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: C.navy }}>{r.file}</td>
                <td style={{ padding: "12px 16px" }}><Badge label={r.status} variant={r.status === "Imported" ? "success" : "medium"} /></td>
                <td style={{ padding: "12px 16px", color: C.muted }}>{r.rows}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: r.quality > "90%" ? C.green : C.amber }}>{r.quality}</td>
                <td style={{ padding: "12px 16px", color: C.muted }}>{r.issues}</td>
                <td style={{ padding: "12px 16px" }}>
                  {r.issues !== "None" && <Btn small onClick={() => setShowMapping(true)}>Review mapping</Btn>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Field mapping UI */}
      {showMapping && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Field mapping — breakfast_sales_august.csv</div>
            <button onClick={() => setShowMapping(false)} style={{ border: "none", background: "none", cursor: "pointer", color: C.muted, fontSize: 18 }}>×</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                <th style={{ padding: "8px 16px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11 }}>Source column</th>
                <th style={{ padding: "8px 16px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11 }}>FoodWise field</th>
                <th style={{ padding: "8px 16px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: 11 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["menu_item_name", "Item", "mapped"],
                ["sold_qty", "Quantity sold", "mapped"],
                ["sale_time", "Timestamp", "mapped"],
                ["outlet", "Location", "mapped"],
                ["unit_price", "Unit price", "unmapped"],
              ].map(([src, fw, status], i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 16px" }}><code style={{ background: C.bg, padding: "2px 6px", borderRadius: 4, color: C.navy2, fontSize: 12 }}>{src}</code></td>
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: C.navy }}>→ {fw}</td>
                  <td style={{ padding: "10px 16px" }}><Badge label={status === "mapped" ? "MAPPED" : "UNMAPPED"} variant={status === "mapped" ? "success" : "medium"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Btn small>Save mapping</Btn>
            <Btn variant="secondary" small>Auto-detect</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function Settings() {
  const tabs = ["Organization", "Locations", "Menu & Recipes", "Safety Rules", "Recovery Partners", "Users & Roles", "Notifications"]
  const [activeTab, setActiveTab] = useState("Safety Rules")
  const [minPickup, setMinPickup] = useState(60)
  const [coldTemp, setColdTemp] = useState(5)
  const [hotTemp, setHotTemp] = useState(63)
  const [requiresApproval, setRequiresApproval] = useState(true)

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.navy, margin: 0 }}>Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px", border: "none", background: "transparent",
              color: activeTab === tab ? C.navy : C.muted,
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
              borderBottom: activeTab === tab ? `2px solid ${C.navy}` : "2px solid transparent",
              marginBottom: -1, fontFamily: "Inter, sans-serif",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Safety Rules" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          <Card style={{ padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 6 }}>Food safety & redistribution rules</div>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px" }}>Configure the operational thresholds that govern AI recommendations.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Min pickup */}
              <div style={{ padding: "18px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Minimum safe pickup time</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Surplus must be claimed at least this many minutes before expiry</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setMinPickup(m => Math.max(15, m - 15))} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 14 }}>−</button>
                    <span style={{ minWidth: 48, textAlign: "center", fontSize: 16, fontWeight: 800, color: C.navy }}>{minPickup} min</span>
                    <button onClick={() => setMinPickup(m => Math.min(180, m + 15))} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 14 }}>+</button>
                  </div>
                </div>
              </div>

              {/* Manager approval */}
              <div style={{ padding: "18px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Buffet food redistribution</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Requires manager approval before routing</div>
                  </div>
                  <div onClick={() => setRequiresApproval(a => !a)} style={{ width: 44, height: 24, borderRadius: 12, background: requiresApproval ? C.teal : C.border, display: "flex", alignItems: "center", padding: "3px", cursor: "pointer", transition: "background .2s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", marginLeft: requiresApproval ? 20 : 0, transition: "margin .2s" }} />
                  </div>
                </div>
              </div>

              {/* Temps */}
              <div style={{ padding: "18px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 14 }}>Temperature thresholds</div>
                {[
                  { label: "Cold storage", val: coldTemp, set: setColdTemp, unit: "°C", min: 0, max: 8, step: 0.5 },
                  { label: "Hot holding", val: hotTemp, set: setHotTemp, unit: "°C", min: 60, max: 75, step: 1 },
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i === 0 ? 12 : 0 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{t.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="range" min={t.min} max={t.max} step={t.step} value={t.val} onChange={e => t.set(Number(e.target.value))} style={{ width: 100, accentColor: C.teal }} />
                      <span style={{ minWidth: 50, fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "right" }}>{t.val}{t.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recovery channels */}
              <div style={{ padding: "18px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10 }}>Eligible recovery channels</div>
                {["Marketplace", "NGO partners", "Compost"].map((ch, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: C.teal, width: 14, height: 14 }} />
                    <span style={{ fontSize: 13, color: C.navy }}>{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn>Save rules</Btn>
              <Btn variant="ghost">Reset to defaults</Btn>
            </div>
          </Card>

          <div>
            <Card style={{ padding: 20, background: C.cream, border: `1px solid ${C.amber}33` }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>ℹ️</div>
              <p style={{ fontSize: 13, color: C.navy, lineHeight: 1.7, margin: 0 }}>
                <strong>AI recommendations cannot override your safety policy.</strong> These thresholds are applied before any recommendation is surfaced to the team.
              </p>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== "Safety Rules" && (
        <Card style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>{activeTab}</div>
          <div style={{ fontSize: 13, color: C.muted }}>Select Safety Rules to see an interactive example.</div>
        </Card>
      )}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("command")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [inventory, setInventory] = useState<InventoryBatch[]>([])
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [risks, setRisks] = useState<RiskResponse["risks"]>([])
  const [procurement, setProcurement] = useState<ProcurementRecommendation[]>([])
  const [redistributions, setRedistributions] = useState<RedistributionOpportunity[]>([])
  const [waste, setWaste] = useState<WasteRecord[]>([])
  const [wasteAnalytics, setWasteAnalytics] = useState<WasteAnalytics | null>(null)
  const [impact, setImpact] = useState<Record<string, number> | null>(null)
  const [rootCause, setRootCause] = useState<RootCauseResponse | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])

  async function refresh() {
    setLoading(true)
    try {
      const [
        dashboardData,
        ingredientsData,
        inventoryData,
        forecastData,
        riskData,
        procurementData,
        redistributionData,
        wasteData,
        analyticsData,
        impactData,
        rootCauseData,
        alertData,
      ] = await Promise.all([
        api.dashboard(),
        api.ingredients(),
        api.inventory(),
        api.forecast(),
        api.risks(),
        api.procurement(),
        api.redistribution(),
        api.waste(),
        api.wasteAnalytics(),
        api.impact(),
        api.rootCause(),
        api.alerts(),
      ])
      setDashboard(dashboardData)
      setIngredients(ingredientsData.ingredients)
      setInventory(inventoryData.inventory)
      setForecast(forecastData)
      setRisks(riskData.risks)
      setProcurement(procurementData.recommendations)
      setRedistributions(redistributionData.opportunities)
      setWaste(wasteData.waste)
      setWasteAnalytics(analyticsData)
      setImpact(impactData)
      setRootCause(rootCauseData)
      setAlerts(alertData.alerts)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load backend data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const data = useMemo<FoodWiseData>(() => ({
    loading,
    error,
    dashboard,
    ingredients,
    inventory,
    forecast,
    risks,
    procurement,
    redistributions,
    waste,
    wasteAnalytics,
    impact,
    rootCause,
    alerts,
    refresh,
  }), [loading, error, dashboard, ingredients, inventory, forecast, risks, procurement, redistributions, waste, wasteAnalytics, impact, rootCause, alerts])

  const screens: Record<string, React.ReactNode> = {
    command: <CommandCenter />,
    forecast: <ForecastPrep />,
    wastelog: <WasteLog />,
    explorer: <WasteExplorer />,
    surplus: <SurplusHub />,
    impact: <Impact />,
    imports: <DataImports />,
    settings: <Settings />,
  }

  return (
    <FoodWiseContext.Provider value={data}>
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
        <Sidebar active={page} setActive={setPage} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TopHeader page={page} />
          <main style={{ flex: 1, overflowY: "auto" }}>
            {screens[page]}
          </main>
        </div>
      </div>
    </FoodWiseContext.Provider>
  )
}
