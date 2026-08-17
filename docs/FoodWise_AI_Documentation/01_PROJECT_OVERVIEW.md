# Project Overview

## Project Name
**FoodWise AI** — AI-powered Food Inventory & Waste Optimization Platform
*(this doc set originally used the working name "NourishOS" during early planning — the project shipped as FoodWise AI)*

## One-line description
An AI system that helps restaurants, hotels, cafeterias, and food-service chains prepare closer to actual demand, catch food that's about to go to waste before it happens, and move surplus to where it's actually needed.

## Problem We Are Solving
Food businesses make prep, ordering, and inventory decisions with incomplete information. A restaurant doesn't know exactly how many guests will show up tomorrow, so it over-prepares "just to be safe." A hotel kitchen doesn't always know that 8 kg of paneer is going to cross its safe-usage window before anyone touches it. A chain with three outlets doesn't realize that one location has surplus tomatoes while another is about to run out — until it's too late for either of them.

None of these problems come from one bad decision. They come from demand data, inventory data, and waste data living in separate silos, with no system connecting them and acting on the connection before waste actually happens.

## Why the Problem Matters
Food waste isn't just an environmental talking point — for the businesses generating it, it's a direct cost. UNEP estimates food service alone accounted for roughly 290 million tonnes of food waste globally in 2022 [UNEP Food Waste Index Report 2024]. Every kilogram wasted is also wasted procurement spend, labor, storage, and disposal cost. For an operator, cutting even 15–20% of avoidable waste is a real margin improvement, not just a sustainability metric.

## Our Solution (in simple language)
FoodWise AI watches what a food business sells, what it has in stock, and what's been going bad — then does three things:

1. **Predicts** how much of each item will actually be needed, so kitchens prepare closer to real demand instead of guessing high.
2. **Flags risk early** — it tells staff which ingredients are likely to expire unused *before* that happens, not after.
3. **Recommends action** — buy less of X, prep more of Y, move surplus Z from Outlet A to Outlet B.

Every recommendation is explainable. The system tells staff *why* it's suggesting something, using data they can check, not a black box.

## Target Users
- Restaurant / hotel kitchen managers
- Cafeteria and institutional food-service operators
- Multi-outlet restaurant chain operations teams
- Procurement staff who decide what and how much to order
- (Future) supermarkets and other retail food businesses

## Main Features

### Built and working in the current prototype
- AI demand forecasting (per item, per outlet)
- Inventory management with FEFO (First Expired, First Out) batch ordering
- Spoilage risk scoring (Low / Medium / High) with a human-readable rationale
- Procurement recommendations (buy / delay / reduce)
- Preparation quantity recommendations
- Inter-outlet redistribution recommendations, with approval flow that actually moves inventory between outlets
- Waste logging + waste analytics (by ingredient, outlet, reason)
- Root-cause pattern detection across logged waste, with a plain-language summary
- Risk-based alerts, dismissible per alert

### Planned, not yet built
- Live natural-language explanations from an LLM (Gemini) — the current build uses a deterministic text template for explanations; wiring in a real Gemini call is the next step, not something already running
- Supplier & batch pattern detection (recurring quality/spoilage issues tied to a specific supplier) — no supplier-incident data model exists yet
- Continuous learning / prediction-vs-actual accuracy tracking — nothing currently logs or displays "forecast missed by X%"
- Persistent database (see `05_DATABASE_DESIGN.md` for current vs planned storage)

## Core Workflow
```
Demand Prediction
      ↓
Inventory Monitoring
      ↓
Spoilage / Risk Prediction
      ↓
Procurement & Preparation Recommendations
      ↓
Inter-Outlet Redistribution
      ↓
Waste Tracking
      ↓
Root-Cause Analysis
      ↓
(Planned) Continuous Learning back into Demand Prediction
```

The idea in one line: **don't wait for food to become waste — predict where it's likely to happen, prevent it through better decisions, redirect surplus where possible, and (eventually) learn from what actually happened.**

## What Makes the Project Different
Most tools in this space are good at *one* stage — a forecasting tool, or a waste-tracking camera, or a surplus marketplace. FoodWise AI's differentiator isn't a single clever model; it's that forecast → prep → risk → redistribution → waste outcome are connected in one loop. We're not building "another waste dashboard" — we're building the loop that's meant to make the dashboard's advice better over time, once the learning piece is in place.

## Prototype Scope (SIH Demo) — What's Actually Built
The current backend is a **single-organization, multi-outlet** system (3 demo outlets) with:
- Seeded in-memory demo data (realistic, not fabricated statistics) — no external database yet, see `05_DATABASE_DESIGN.md`
- A working forecast engine (moving average + day-of-week + trend adjustment — a practical statistical approach, not a trained model)
- A weighted rule-based risk scoring engine
- A working redistribution recommendation flow between outlets, with real inventory updates on approval
- A functioning waste logging + analytics + root-cause endpoint
- A signed bearer-token auth flow with role checks (admin / manager / staff)
- A React + Vite frontend wired to most of the above (see `docs/INTEGRATION_STATUS.md` in the repo root for the exact list of what's live vs. still using placeholder chart data)

We are **not** building computer-vision waste capture, a public consumer marketplace, or multi-tenant enterprise infrastructure for the prototype — those are future scope, along with the LLM explanation layer and supplier pattern detection noted above.

## Future Vision
- Multi-tenant SaaS for many organizations, not just one
- A real database (PostgreSQL) behind the API instead of an in-memory demo store
- A working Gemini/LLM integration for natural-language explanations
- Integrations with real POS/ERP systems instead of seeded demo data
- Computer-vision / smart-scale waste capture
- A verified partner network for donation and surplus recovery (NGOs, community kitchens)
- Expansion beyond restaurants/hotels into supermarkets and other retail food businesses
- Localization for other countries (currency, units, food-safety rules, disposal pathways)
