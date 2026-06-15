# TODO - Company/Driver support + summative consumption

## Step 1: Update DB schema
- [ ] Modify `backend/src/db/migrate.js`
  - add `companies`, `drivers`
  - alter `vehicles` to include `company_id` (NOT NULL) and `driver_id` (nullable)
- [ ] Ensure FKs are added (`drivers.company_id`, `vehicles.company_id`, `vehicles.driver_id`)

## Step 2: Update seed data
- [ ] Modify `backend/src/db/seed.js`
  - create 1+ companies
  - create drivers per company
  - create multiple vehicles per company (some assigned to drivers)
  - seed fuel logs for vehicles

## Step 3: Backend routes + analytics
- [ ] Create `backend/src/routes/companies.js`
- [ ] Create `backend/src/routes/drivers.js`
- [ ] Update `backend/src/routes/vehicles.js` to filter by `companyId` and accept `companyId/driverId`
- [ ] Update `backend/src/routes/analytics.js`
  - add `GET /api/analytics/summaryCompany?companyId=`
  - add `GET /api/analytics/summaryDriver?driverId=`
  - keep existing vehicle summary unchanged
- [ ] Wire routers in `backend/src/index.js`

## Step 4: Frontend UI updates (vehicle/logs first)
- [x] Update `frontend/src/pages/FuelLogs.jsx`
  - [x] add company selector
  - [x] filter vehicles by company (backend supports it)
  - [ ] add forms for creating company/driver/vehicle (minimal)

## Step 5: Frontend analytics (company/driver KPIs only)
- [x] Update `frontend/src/pages/AnalyticsInsights.jsx`
  - [x] add mode selector: Vehicle / Company / Driver
  - [x] fetch appropriate summary endpoint
  - [x] render KPIs same as now
- [x] Update `frontend/src/pages/AnalyticsKpisAndCharts.jsx`
  - [x] switch to Vehicle mode only for charts (label updated)

## Step 6: Manual verification
- [x] Run migrate + seed
- [x] Validate:
  - [x] add drivers
  - [x] add vehicles under company, optional driver assignment
  - [x] add fuel logs (seed)
  - [x] company/driver KPIs match summed vehicle data


