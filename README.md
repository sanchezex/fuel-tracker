# Fleet Fuel Analytics (Rebuild)

A small fuel management + analytics app:
- Frontend: React (Vite)
- Backend: Node/Express
- Database: PostgreSQL

## Setup

### 1) Create Postgres DB
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
Frontend on http://localhost:5173
Backend on http://localhost:3000

## API endpoints
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/fuellogs?vehicleId=...`
- `POST /api/fuellogs`
- `GET /api/analytics/summary?vehicleId=...`


