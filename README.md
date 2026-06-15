# Fleet Fuel Analytics

Fleet Fuel Analytics is a small fuel management + analytics app for tracking vehicle fuel usage and viewing operational insights.

## What the app can do

### Fleet structure (scoped by company)
- Companies
  - View a list of companies
  - Delete a company (also deletes its drivers + vehicles)
- Drivers
  - Drivers are listed per company
- Vehicles
  - Create vehicles under a selected company
    - Vehicle name (required)
    - VIN (optional)
    - Assign driver (optional)
  - Delete vehicles (also deletes that vehicle’s fuel logs)

### Fuel logs
- Record fuel entries: date, odometer start/end (km), fuel used (liters), notes (optional)
- Automatically compute:
  - distance_km = end - start
  - liters_per_100km
- View logged entries in a table

### Analytics
- Vehicle-scoped analytics (KPIs + charts)
  - Total distance (km)
  - Total fuel (L)
  - Avg liters/100km
  - Histogram of liters/100km distribution
  - Trend of liters/100km over time

- Scope-based analytics (KPIs cards)
  - Switch between **Vehicle / Driver / Company** scopes
  - Uses aggregated fuel logs across the selected scope

### Operational (ops_data) insights
- `fuel_logs.ops_data` is stored as `jsonb` for flexible operational fields (e.g. speed/RPM)
- Analytics extracts optional metrics when present:
  - `avgSpeedKmh`
  - `avgRpm`

## How to use (UI flow)
1. Open **Fuel Logs**
2. Select a **Company**
3. Register a **Vehicle** (optional—seed data provides example vehicles)
4. Select a **Vehicle**
5. Add fuel log entries
6. Use **Analytics (KPIs & Charts)** for vehicle charts
7. Use **Analytics Insights** to see KPI cards by scope

## Analytics details (KPIs, histogram, charts)
- KPIs (total distance, total fuel, avg liters/100km) are computed from the selected vehicle’s fuel logs (or aggregated across the selected scope).
- Histogram shows the distribution (bins) of `litersPer100km` across all entries.
- Trend chart plots `litersPer100km` over time using the fuel log dates.


## How it’s built

- Frontend: React + Vite
  - `frontend/src/pages/FuelLogs.jsx` - fuel logs UI (read + create)
  - `frontend/src/pages/AnalyticsInsights.jsx` - KPI cards + recent log
  - `frontend/src/pages/AnalyticsKpisAndCharts.jsx` - KPIs + histogram + trend chart
  - `frontend/src/styles.css` - green glass/gradient theme
- Backend: Node/Express REST API
  - `backend/src/routes/vehicles.js` - `/api/vehicles`
  - `backend/src/routes/fuelLogs.js` - `/api/fuellogs`
  - `backend/src/routes/analytics.js` - `/api/analytics/summary`
- Database: PostgreSQL

## Setup

### 1) Create a Postgres database
Example:
- database: `fleet_fuel_analytics`
- user/password: update as needed

### 2) Configure backend env
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your `DATABASE_URL`.

### 3) Install dependencies
From repo root:
```bash
npm install
```

### 4) Migrate + seed
```bash
npm run migrate -w backend
npm run seed -w backend
```

### 5) Run dev servers
```bash
npm run dev
```
Frontend: http://localhost:5173
Backend: http://localhost:3000

## API endpoints
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/fuellogs?vehicleId=...`
- `POST /api/fuellogs`
- `GET /api/analytics/summary?vehicleId=...`




