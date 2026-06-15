import 'dotenv/config'
import { pool } from '../lib/db.js'

async function main() {
  const client = await pool.connect()
  try {
    // Seed a company + drivers + vehicles, then fuel logs.
    const companyName = 'Acme Fleet'
    const { rows: companyRows } = await client.query('select id from companies where name=$1 limit 1', [companyName])

    let companyId
    if (!companyRows.length) {
      const inserted = await client.query(
        'insert into companies (name) values ($1) returning id',
        [companyName]
      )
      companyId = inserted.rows[0].id
    } else {
      companyId = companyRows[0].id
    }

    const driverNames = ['John Driver', 'Maria Driver']
    const driverIds = []
    for (const dn of driverNames) {
      const { rows } = await client.query('select id from drivers where company_id=$1 and name=$2 limit 1', [companyId, dn])
      if (rows.length) {
        driverIds.push(rows[0].id)
      } else {
        const inserted = await client.query(
          'insert into drivers (company_id, name) values ($1,$2) returning id',
          [companyId, dn]
        )
        driverIds.push(inserted.rows[0].id)
      }
    }

    // Ensure at least 2 vehicles exist under the company.
    const vehicles = [
      { name: 'Fleet Truck 1', vin: null, driverId: driverIds[0] },
      { name: 'Fleet Van 2', vin: null, driverId: driverIds[1] }
    ]

    const vehicleIds = []
    for (const v of vehicles) {
      const { rows } = await client.query(
        'select id from vehicles where company_id=$1 and name=$2 limit 1',
        [companyId, v.name]
      )

      if (rows.length) {
        vehicleIds.push(rows[0].id)
      } else {
        const inserted = await client.query(
          'insert into vehicles (company_id, driver_id, name, vin) values ($1,$2,$3,$4) returning id',
          [companyId, v.driverId, v.name, v.vin]
        )
        vehicleIds.push(inserted.rows[0].id)
      }
    }

    // Seed fuel logs for both vehicles if empty.
    for (let idx = 0; idx < vehicleIds.length; idx += 1) {
      const vehicleId = vehicleIds[idx]
      const { rows: existingLogs } = await client.query('select id from fuel_logs where vehicle_id=$1 limit 1', [vehicleId])
      if (existingLogs.length) continue

      const base = idx === 0 ? 120000 : 54000
      const seed = idx === 0
        ? [
            { date: '2026-01-10', s: base, e: base + 320, liters: 38.7, notes: 'city' },
            { date: '2026-02-12', s: base + 320, e: base + 910, liters: 62.4, notes: 'mixed' },
            { date: '2026-03-15', s: base + 910, e: base + 1380, liters: 48.1, notes: 'highway' }
          ]
        : [
            { date: '2026-01-20', s: base, e: base + 180, liters: 24.9, notes: 'city' },
            { date: '2026-02-18', s: base + 180, e: base + 460, liters: 28.3, notes: 'mixed' },
            { date: '2026-03-17', s: base + 460, e: base + 720, liters: 26.7, notes: 'highway-ish' }
          ]

      // Insert seed logs with deterministic ops_data.
      for (const row of seed) {
        const opsData = {
          avgSpeedKmh: idx === 0 ? 68 : 55,
          avgRpm: idx === 0 ? 1950 : 2100
        }

        await client.query(
          `insert into fuel_logs (vehicle_id, date, odometer_start_km, odometer_end_km, fuel_liters, ops_data, notes)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [vehicleId, row.date, row.s, row.e, row.liters, opsData, row.notes]
        )
      }

    }

    console.log('Seed complete')

  } finally {
    client.release()
  }
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

