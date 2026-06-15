import { Router } from 'express'
import { pool } from '../lib/db.js'

export const fuelLogsRouter = Router()

fuelLogsRouter.get('/fuellogs', async (req, res) => {
  const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : null
  if (!vehicleId) return res.json([])

  const { rows } = await pool.query(
    `select 
      fl.id,
      fl.date,
      fl.odometer_start_km as odometerStartKm,
      fl.odometer_end_km as odometerEndKm,
      fl.fuel_liters as fuelLiters,
      fl.price_per_liter as pricePerLiter,
      fl.ops_data as opsData,
      fl.notes,
      (fl.odometer_end_km - fl.odometer_start_km) as distance_km,
      case 
        when (fl.odometer_end_km - fl.odometer_start_km) > 0 then (fl.fuel_liters / (fl.odometer_end_km - fl.odometer_start_km)) * 100
        else null
      end as liters_per_100km,
      (fl.fuel_liters * fl.price_per_liter) as cost
    from fuel_logs fl
    where fl.vehicle_id = $1
    order by fl.date desc, fl.id desc`,
    [vehicleId]
  )

  const normalized = rows.map((r) => ({
    id: r.id,
    date: r.date,
    odometerStartKm: r.odometerstartkm ?? r.odometerStartKm,
    odometerEndKm: r.odometerEndKm,
    fuelLiters: r.fuelLiters,
    pricePerLiter: r.pricePerLiter,
    cost: r.cost,
    opsData: r.opsData || {},
    notes: r.notes,
    distanceKm: r.distance_km,
    litersPer100km: r.liters_per_100km
  }))

  res.json(normalized)
})

fuelLogsRouter.post('/fuellogs', async (req, res) => {
  const { vehicleId, date, odometerStartKm, odometerEndKm, fuelLiters, pricePerLiter, opsData, notes } = req.body || {}

  if (!vehicleId) return res.status(400).json({ error: 'vehicleId is required' })
  if (!date) return res.status(400).json({ error: 'date is required' })
  if (odometerStartKm === undefined || odometerEndKm === undefined) {
    return res.status(400).json({ error: 'odometerStartKm and odometerEndKm are required' })
  }
  if (fuelLiters === undefined) return res.status(400).json({ error: 'fuelLiters is required' })

  const price = pricePerLiter === undefined || pricePerLiter === null || pricePerLiter === ''
    ? 0
    : Number(pricePerLiter)

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'pricePerLiter must be a non-negative number' })
  }

  // opsData is flexible: store as provided (default to {}).
  let ops = opsData
  if (ops === undefined || ops === null) ops = {}

  const { rows } = await pool.query(
    `insert into fuel_logs (vehicle_id, date, odometer_start_km, odometer_end_km, fuel_liters, price_per_liter, ops_data, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning id, vehicle_id, date, odometer_start_km, odometer_end_km, fuel_liters, price_per_liter, ops_data, notes`,
    [
      Number(vehicleId),
      date,
      Number(odometerStartKm),
      Number(odometerEndKm),
      Number(fuelLiters),
      price,
      ops,
      notes || null
    ]
  )

  res.status(201).json(rows[0])
})


