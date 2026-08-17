Design a complete, high-fidelity, responsive frontend web application called “FoodWise AI” for a food-waste intelligence platform used by hotels, restaurants, cafeterias, and institutional kitchens.

IMPORTANT:
- Create UI only. Do not generate backend, database schema, API logic, authentication flows, code, or developer documentation.
- However, make every dashboard element realistic and ready for later backend/database integration: use believable states, tables, controls, empty states, loading states where helpful, and clearly structured data-driven components.
- The visual direction must exactly follow this aesthetic: premium modern SaaS operations dashboard; deep navy headers, off-white backgrounds, clean white cards, muted teal/mint surfaces, warm coral/orange highlights, rounded corners, soft shadows, high readability, strong hierarchy.
- This must feel like an “AI food operations operating system,” not a generic sustainability website or consumer food-delivery app.
- Use realistic Indian hotel/restaurant context, INR currency, Jaipur location, Indian menu items, hotel breakfast operations, NGO recovery partners, and food images.
- Generate desktop and mobile designs in one complete cohesive design system.

BRAND SYSTEM
Product name: FoodWise AI
Tagline: “Prepare smarter. Waste less. Recover more.”
Brand personality: reliable, operational, intelligent, calm, practical, sustainability-conscious.
Logo: wordmark “FoodWise AI” with a minimal circular leaf + analytics/spark icon. Do not make the logo oversized.
Primary color: deep navy #173653
Secondary blue: #2E6F95
Teal: #5F9E9D
Mint background: #E8F4F1
Coral accent: #E88968
Warm cream highlight: #FFF4E7
Success green: #4D8C6B
Warning amber: #D9922E
Danger red: #C95555
Page background: #F5F7F8
Cards: #FFFFFF
Primary text: #173653
Secondary text: #667784
Border: #DCE4E8

TYPOGRAPHY
Use Inter or a similar polished sans-serif.
Desktop headings: bold, dark navy, spacious but compact.
Body text: readable 14–16 px.
Buttons: strong navy primary button with white text; secondary buttons white with navy border; small coral accent tags for high-priority risk.
Use icons consistently in a thin rounded modern style.

APP STRUCTURE
Create a desktop web app with a fixed left sidebar, a slim top header, and a spacious central content area. Include responsive mobile layouts for kitchen/operator workflows.

DESKTOP SIDEBAR
At the top: FoodWise AI logo.
Navigation with icons:
- Command Center
- Forecast & Prep
- Waste Log
- Waste Explorer
- Surplus Hub
- Impact
- Data Imports
- Settings
Bottom profile section:
- Avatar
- “Ananya Sharma”
- “Operations Manager”
- “Jaipur Heritage Hotel”
Use Command Center as active by default with navy/teal active indicator.

TOP HEADER
Include:
- Page title / breadcrumb
- Location selector: “Jaipur Heritage Hotel”
- Date: “Saturday, 16 Aug 2026”
- Notification bell with notification dot
- Small weather signal chip: “31°C • Light rain”
- User avatar

CREATE THESE COMPLETE SCREENS

1. COMMAND CENTER — DESKTOP DASHBOARD
Main heading:
“Good morning, Ananya”
Subheading:
“Here is what needs attention before tomorrow’s breakfast service.”

Top KPI cards, each with an icon and small trend:
- Today’s Prep: “1,240 portions” and “↓ 11% vs plan”
- Waste Risk: “18%” and “3 items critical”
- Saved This Week: “₹28,460” and “↑ 14% vs last week”
- Surplus: “126 portions” and “12 partners nearby”

Primary content layout:
A. Large Forecast vs Actual Demand card
- 7-day mixed bar and line chart
- Bars = Actual portions served
- Coral line = AI forecast
- Labels D1 to D7
- Forecast points clearly labelled
- Include a legend and a small “View details” link
- Header: “Breakfast demand performance”

B. Priority Actions card
Show action cards in ranked order:
1. Paneer Tikka — HIGH
   “Reduce tomorrow’s prep by 18 portions”
   Reason: “Demand trend is 14% below forecast.”
   Buttons: “Accept” and “Modify”
2. Milk — MEDIUM
   “Move 22 units to discount lane”
   Reason: “Expiry risk in 18 hours.”
   Buttons: “View options”
3. Jeera Rice — MEDIUM
   “Donate surplus before 8:00 PM”
   Reason: “Verified NGO pickup available.”
   Buttons: “Route now”

C. Live Operations card
- Service status: “Breakfast prep begins in 10h 20m”
- Occupancy: “82%”
- Local event: “Jaipur Convention Centre • Final day”
- Forecast confidence: “High • 86%”
- Display compact visual chips and icons.

D. Surplus Redistribution Network
Create a simple route/network visualization with connected nodes:
Kitchen → FoodWise Hub → NGO Partner → Shelter → Pickup completed
Use teal thin lines and coral circular nodes.
Include a right-side panel:
“42 portions available”
“Safe until 2:00 PM”
“30 portions matched”
Primary button: “Open Surplus Hub”

E. AI Insight panel with mint background:
Title: “FoodWise AI insight”
Text: “Pancake demand is tracking 24% slower than expected. Start with a smaller second batch and shift fruit replenishment up by 12 portions.”
Button: “See recommendation logic”

2. FORECAST & PREP — DESKTOP PAGE
Header:
“Forecast & Prep”
Subheading:
“Turn expected demand into a safer production plan.”

Top filter controls:
- Service: Breakfast
- Date: Sunday, 17 Aug
- Location: Jaipur Heritage Hotel
- Weather sensitivity toggle
- Event factor toggle

Main layout:
A. Demand Forecast card
- Large forecast chart with confidence band
- X axis: service time from 6 AM to 11 AM
- Show forecast curve with soft teal confidence shading
- Show “Expected guests: 510”
- Confidence range: “480–540”
- Explain visual signals:
  “82% occupancy”
  “School holiday weekend”
  “Convention checkout impact”
  “Light rain forecast”

B. Recommended Prep Plan table
Columns:
- Menu Item
- Food image thumbnail
- Historical Avg.
- AI Forecast
- Recommended Prep
- Batch Strategy
- Waste Risk
- Action
Rows:
- Masala Omelette — use appetizing realistic food thumbnail
- Paneer Tikka — use realistic image
- Pancakes with berries — use realistic image
- Cut Seasonal Fruit — use realistic image
- Aloo Paratha — use realistic image
- Jeera Rice — use realistic image
Example content:
Paneer Tikka: Historical 132, AI Forecast 118, Recommended Prep 114, “Batch 1: 82 / Batch 2: 32”, Medium risk
Pancakes: Historical 96, AI Forecast 74, Recommended Prep 70, “Batch 1: 50 / Trigger batch: 20”, High risk
Fruit: Historical 105, AI Forecast 128, Recommended Prep 124, “Continuous replenishment”, Low risk

C. Right-side Simulation panel
Title: “Adjust & simulate”
Selected item: Paneer Tikka
Use a quantity control with minus, value “114 portions”, plus.
Horizontal slider from 80 to 150.
Show:
- Expected demand: 118
- Stockout risk: 6%
- Predicted waste: 4.2 kg
- Estimated cost avoided: ₹1,260
- CO2e avoided: 9.8 kg estimate
Include a comparison visualization:
“Original Plan: 132 portions”
“FoodWise Plan: 114 portions”
Include primary button “Apply recommendation”
Secondary button “Save as draft”

D. Explainability drawer/panel
Title: “Why this recommendation?”
Use a clean evidence breakdown:
- Occupancy increased forecast by +14 portions
- Last 3 Sunday demand reduced forecast by −18 portions
- Pancake leftovers last week: 8.4 kg
- Event traffic confidence: moderate
Use a small donut or contribution bars.
Footer text: “Recommendation generated from operational signals, not a generic AI guess.”

3. WASTE LOG — MOBILE-FIRST OPERATOR SCREEN
Design a narrow mobile screen but also show a desktop responsive variation if possible.
Top header: FoodWise AI icon, “Log Waste”, close icon.
Progress indicator: “Step 1 of 3”

Screen content:
Question: “What was wasted?”
Show large tap-friendly cards with image thumbnails:
- Rice Bowl — rice image — “2.4 kg today”
- Paneer Tikka — paneer image — “1.1 kg today”
- Bread Basket — bread image — “0.8 kg today”
- Cut Fruit — fruit image — “0.6 kg today”
- Other item

After selection, show:
Quantity selector:
- Unit toggle: kg / portions / units
- Large number input: “1.1”
Waste Stage chips:
- Prep
- Buffet
- Plate return
- Storage
Reason chips:
- Overproduction
- Spoilage
- Quality issue
- Customer return
- Handling loss
Add optional notes field with placeholder “Add a quick note (optional)”
Show “Estimated value lost: ₹462”
Bottom fixed CTA: “Save waste log”
After successful save, create a subtle confirmation bottom sheet:
“Waste logged. Paneer Tikka is now your #1 waste driver this week.”
Button: “See recommended fix”

Make this screen extremely low-friction, large touch targets, visually clear, suitable for busy kitchen staff.

4. WASTE EXPLORER — DESKTOP ANALYTICS PAGE
Header:
“Waste Explorer”
Subheading:
“Find the repeated causes behind avoidable waste.”

Top filter bar:
- Date range: Last 7 days
- Location
- Service
- Category
- Waste stage
- Export report button

Metrics row:
- Total waste: 58.6 kg
- Avoidable waste: 41.2 kg
- Cost impact: ₹12,820
- Top cause: Overproduction

Visual content:
A. Ranked bar chart “Top waste drivers”
- Paneer Tikka — 14.2 kg
- Breakfast bread — 11.8 kg
- Cut fruit — 8.6 kg
- Jeera rice — 7.4 kg
- Milk — 5.9 kg
Use navy bars with coral highlight for the largest driver.

B. Waste by stage donut chart:
- Buffet leftover
- Prep trim
- Spoilage
- Plate return
- Storage

C. Root cause insight panel:
“Paneer Tikka is repeatedly overprepared on weekends.”
Evidence:
- 62% of paneer waste occurs at breakfast buffet
- Average waste rate is 18% higher on Saturdays
- Forecast overestimation is the dominant contributor
Button: “Create prep rule”

D. Waste events table
Columns:
- Time
- Item
- Quantity
- Stage
- Reason
- Estimated cost
- Logged by
Use compact badges and realistic rows.

5. SURPLUS HUB — DESKTOP PAGE
Header:
“Surplus Hub”
Subheading:
“Route safe surplus to the highest-value destination before it expires.”

Top summary cards:
- Safe to redistribute: 126 portions
- Deadline approaching: 2 lots
- Value recoverable: ₹4,820
- Verified partners: 12

Main content:
A. Surplus Lot list, card-based
1. “Breakfast buffet surplus”
   Image strip with pancakes, fruit cups, paneer dishes
   “42 portions”
   “Safe until 2:00 PM”
   “Estimated value ₹2,100”
   Status badge: “Urgent”
2. “Bakery & bread”
   Bread and pastry images
   “55 portions”
   “Safe until 6:30 PM”
   Status: “Available”
3. “Fresh produce”
   Produce image
   “29 portions”
   “Safe until 5:00 PM”

B. For selected lot, show Recommendation Decision Panel:
Header: “Best action: Donate 30 portions”
Confidence: “94% match confidence”
Show comparison cards:
- Sell via local marketplace
  “Expected recovery: ₹820”
  “Likely pickup: 90 min”
  “Demand certainty: Medium”
- Donate to verified NGO
  “30 portions accepted”
  “Pickup at 12:10 PM”
  “Distance: 2.4 km”
  “Social impact: 30 meals”
  Mark this as recommended with mint border and check icon
- Compost / organic recovery
  “Use only for remaining unsuitable scraps”
  “Estimated organic waste: 2.1 kg”

C. Verified partner card:
Partner name: “Asha Community Kitchen”
Verification badge: “Verified”
Photo placeholder or tasteful NGO building/food distribution image
Details:
- Capacity: 30 portions
- Pickup window: 12:10–12:30 PM
- Distance: 2.4 km
- Contact: “Verified coordinator”
Buttons: “Confirm pickup” and “View route”

D. Countdown component:
“Food-safety decision window”
“01:42:18 remaining”
Use prominent but not alarming coral countdown style.
Show disclaimer:
“FoodWise AI applies configured safety rules. Final approval remains with the kitchen manager.”

6. IMPACT — DESKTOP PAGE
Header:
“Impact”
Subheading:
“Measure the operational, financial, and recovery outcomes of better food decisions.”

Date controls: This week / This month / Custom
Hero impact cards:
- ₹28,460 cost avoided
- 186.4 kg food waste avoided
- 312 meals recovered
- 482 kg CO2e avoided (estimate)

Show clear qualifier:
“CO2e is an estimate based on versioned food-category emission factors.”

Content:
A. Trend chart comparing waste against baseline over 8 weeks.
Baseline in gray dotted line; FoodWise performance in teal.

B. Impact breakdown cards:
- Prevention: 132.2 kg avoided
- Markdown recovery: 18.1 kg
- Donations: 36.1 kg
- Compost / recovery: 22.4 kg

C. Circular progress component:
“Recovery rate: 72%”
“Up 9% from last month”

D. Achievement / progress card:
“Your hotel prevented the equivalent of 1,050 meal portions from being wasted this month.”
Use restrained, professional visual; do not turn it into a gamified consumer experience.

7. DATA IMPORTS — DESKTOP PAGE
Header:
“Data Imports”
Subheading:
“Bring sales, inventory and menu data into FoodWise AI.”

Create three import tiles:
- Sales history CSV
- Inventory snapshot CSV
- Menu & recipes CSV
Each should have:
- Upload area
- Format example link
- Last sync date
- Import status

Show a sample imported file table:
“breakfast_sales_august.csv”
Status: Imported
Rows: 2,847
Quality score: 92%
Issues detected: “5 menu items need mapping”
Button: “Review mapping”

Show simple field-mapping UI:
Source column → FoodWise field
“menu_item_name” → “Item”
“sold_qty” → “Quantity sold”
“sale_time” → “Timestamp”
“outlet” → “Location”

8. SETTINGS — DESKTOP PAGE
Tabs:
- Organization
- Locations
- Menu & Recipes
- Safety Rules
- Recovery Partners
- Users & Roles
- Notifications

Show Safety Rules as active:
Title: “Food safety & redistribution rules”
Include editable-looking settings:
- Minimum safe pickup time: 60 minutes
- Buffet food redistribution: Requires manager approval
- Cold storage threshold: 5°C
- Hot holding threshold: 63°C
- Eligible recovery channels: Marketplace, NGO, Compost
Include an informational note:
“AI recommendations cannot override your safety policy.”

DESIGN COMPONENTS TO INCLUDE
- Dashboard cards
- Line chart, bar chart, donut chart, confidence band chart
- High / medium / low risk badges
- Food category images and menu image thumbnails
- Tabs, segmented controls, sliders, toggles, dropdowns, filter chips
- Confirmation modals
- Toast notification
- Action cards with Accept / Modify / Route buttons
- Tables with filter and status columns
- Empty state for no surplus available
- Loading skeleton for data-rich sections
- Responsive navigation behavior
- Accessibility-conscious contrast and large touch targets

FOOD IMAGERY REQUIREMENTS
Use realistic, appetizing, editorial-quality food thumbnail images within card layouts. Images must be integrated carefully as small rounded thumbnails or image strips, not huge hero photos.
Include visually distinct images for:
- Paneer tikka: grilled paneer cubes with herbs
- Masala omelette: Indian spiced omelette
- Pancakes with berries
- Fresh cut fruit bowl
- Aloo paratha with curd
- Jeera rice
- Bread basket / bakery goods
- Milk / dairy carton or glass bottle
All imagery should use warm natural lighting, Indian restaurant/hotel buffet styling, consistent crop ratio, subtle rounded corners, and no visible brand labels.

COPY STYLE
Use concise, actionable operational language:
- “Reduce tomorrow’s prep by 18 portions”
- “Move 22 units to discount lane”
- “Donate surplus before 8:00 PM”
- “Forecast confidence: High”
- “Learning signal recorded”
- “AI recommendations are explainable and manager-controlled.”

FINAL OUTPUT REQUIREMENT
Produce all screens as a coherent product design file:
- A desktop app design system and core desktop pages
- A mobile kitchen operator experience
- Consistent component variants and spacing rules
- Connected user flow from Command Center → Forecast & Prep → Waste Log → Surplus Hub → Impact
- Polished, presentation-ready UI with no code, no wireframes, no generic placeholder dashboard content.