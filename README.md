# Fleet Fuel Analytics

A small fuel management + analytics app.

## What you can do in the app
- Manage vehicles
  - Add vehicles (name + optional VIN)
  - List vehicles for selection
- Track fuel logs per vehicle
  - Record date, odometer start/end (km), fuel used (liters), and optional notes
  - View computed distance and estimated liters/100km per entry
- View analytics summary
  - Total distance and total fuel for the selected vehicle
  - Average liters/100km (based on logged entries)
  - Most recent fuel log

## Architecture
- Frontend: React + Vite
- Backend: Node/Express REST API
- Database: PostgreSQL

## Project structure
- `frontend/` - Vite React app
  - `src/pages/FuelLogs.jsx` - fuel log CRUD UI (read + create)
  - `src/pages/AnalyticsInsights.jsx` - summary dashboard
- `backend/` - Express API
  - `src/routes/vehicles.js` - vehicles endpoints
  - `src/routes/fuelLogs.js` - fuel log endpoints
  - `src/routes/analytics.js` - analytics summary endpoint

## Setup

### 1) Create a Postgres database
Example:
- database: `fleet_fuel_analytics`
- user/password: update as needed

### 2) Configure backend env
Copy:
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



