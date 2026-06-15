# Fleet Fuel Analytics

A small fuel management + analytics app.

## What the app can do
- Vehicles
  - Add vehicles (name + optional VIN)
  - Select a vehicle to view logs and analytics
- Fuel logs
  - Record fuel entries: date, odometer start/end (km), fuel used (liters), notes (optional)
  - Automatically compute distance (end - start) and estimated liters/100km
  - View your logged entries in a table
- Analytics
  - KPIs: total distance, total fuel, and average liters/100km
  - Histogram: distribution of liters/100km
  - Trend: simple time-series of liters/100km

## Analytics details (KPIs, histogram, charts)
- KPIs (total distance, total fuel, avg liters/100km) are computed from the selected vehicle’s fuel logs.
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




