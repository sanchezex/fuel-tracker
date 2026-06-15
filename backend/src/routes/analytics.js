import { Router } from 'express'
import { pool } from '../lib/db.js'

export const analyticsRouter = Router()

function baseAggSQL(whereClauseSql) {
  return `select
      sum(fl.odometer_end_km - fl.odometer_start_km) as total_distance_km,
      sum(fl.fuel_liters) as total_fuel_liters,
      case
        when sum(fl.odometer_end_km - fl.odometer_start_km) > 0
          then (sum(fl.fuel_liters) / sum(fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as avg_liters_per_100km
    from fuel_logs fl
    ${whereClauseSql}`
}

function lastLogSQL(whereClauseSql) {
  return `select
      fl.date,
      (fl.odometer_end_km - fl.odometer_start_km) as distance_km,
      fl.fuel_liters as fuel_liters,
      case
        when (fl.odometer_end_km - fl.odometer_start_km) > 0
          then (fl.fuel_liters / (fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as liters_per_100km
     from fuel_logs fl
     ${whereClauseSql}
     order by fl.date desc, fl.id desc
     limit 1`
}

analyticsRouter.get('/summary', async (req, res) => {
  const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : null
  if (!vehicleId) return res.json(null)

  const { rows } = await pool.query(baseAggSQL('where fl.vehicle_id = $1'), [vehicleId])
  const agg = rows[0] || {}

  const last = await pool.query(lastLogSQL('where fl.vehicle_id = $1'), [vehicleId])

  res.json({
    totalDistanceKm: agg.total_distance_km || 0,
    totalFuelLiters: agg.total_fuel_liters || 0,
    avgLitersPer100km: agg.avg_liters_per_100km,
    lastLog: last.rows[0] || null
  })
})

analyticsRouter.get('/summaryCompany', async (req, res) => {
  const companyId = req.query.companyId ? Number(req.query.companyId) : null
  if (!companyId) return res.json(null)

  const { rows } = await pool.query(
    `select
      sum(fl.odometer_end_km - fl.odometer_start_km) as total_distance_km,
      sum(fl.fuel_liters) as total_fuel_liters,
      case
        when sum(fl.odometer_end_km - fl.odometer_start_km) > 0
          then (sum(fl.fuel_liters) / sum(fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as avg_liters_per_100km
    from fuel_logs fl
    join vehicles v on v.id = fl.vehicle_id
    where v.company_id = $1`,
    [companyId]
  )

  const agg = rows[0] || {}

  const last = await pool.query(
    `select
      fl.date,
      (fl.odometer_end_km - fl.odometer_start_km) as distance_km,
      fl.fuel_liters as fuel_liters,
      case
        when (fl.odometer_end_km - fl.odometer_start_km) > 0
          then (fl.fuel_liters / (fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as liters_per_100km
     from fuel_logs fl
     join vehicles v on v.id = fl.vehicle_id
     where v.company_id = $1
     order by fl.date desc, fl.id desc
     limit 1`,
    [companyId]
  )

  res.json({
    totalDistanceKm: agg.total_distance_km || 0,
    totalFuelLiters: agg.total_fuel_liters || 0,
    avgLitersPer100km: agg.avg_liters_per_100km,
    lastLog: last.rows[0] || null
  })
})

analyticsRouter.get('/summaryDriver', async (req, res) => {
  const driverId = req.query.driverId ? Number(req.query.driverId) : null
  if (!driverId) return res.json(null)

  const { rows } = await pool.query(
    `select
      sum(fl.odometer_end_km - fl.odometer_start_km) as total_distance_km,
      sum(fl.fuel_liters) as total_fuel_liters,
      case
        when sum(fl.odometer_end_km - fl.odometer_start_km) > 0
          then (sum(fl.fuel_liters) / sum(fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as avg_liters_per_100km
    from fuel_logs fl
    join vehicles v on v.id = fl.vehicle_id
    where v.driver_id = $1`,
    [driverId]
  )

  const agg = rows[0] || {}

  const last = await pool.query(
    `select
      fl.date,
      (fl.odometer_end_km - fl.odometer_start_km) as distance_km,
      fl.fuel_liters as fuel_liters,
      case
        when (fl.odometer_end_km - fl.odometer_start_km) > 0
          then (fl.fuel_liters / (fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as liters_per_100km
     from fuel_logs fl
     join vehicles v on v.id = fl.vehicle_id
     where v.driver_id = $1
     order by fl.date desc, fl.id desc
     limit 1`,
    [driverId]
  )

  res.json({
    totalDistanceKm: agg.total_distance_km || 0,
    totalFuelLiters: agg.total_fuel_liters || 0,
    avgLitersPer100km: agg.avg_liters_per_100km,
    lastLog: last.rows[0] || null
  })
})


