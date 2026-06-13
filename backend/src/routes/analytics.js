import { Router } from 'express'
import { pool } from '../lib/db.js'

export const analyticsRouter = Router()

analyticsRouter.get('/summary', async (req, res) => {
  const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : null
  if (!vehicleId) return res.json(null)

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
    where fl.vehicle_id = $1`,
    [vehicleId]
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
     where fl.vehicle_id = $1
     order by fl.date desc, fl.id desc
     limit 1`,
    [vehicleId]
  )

  res.json({
    totalDistanceKm: agg.total_distance_km || 0,
    totalFuelLiters: agg.total_fuel_liters || 0,
    avgLitersPer100km: agg.avg_liters_per_100km,
    lastLog: last.rows[0] || null
  })
})

