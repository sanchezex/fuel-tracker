import 'dotenv/config'
import { pool } from '../lib/db.js'

async function main() {
  const client = await pool.connect()
  try {
    const { rows: vrows } = await client.query('select id from vehicles order by id limit 1')
    let vehicleId


    if (vrows.length === 0) {
      const inserted = await client.query(
        'insert into vehicles (name, vin) values ($1,$2) returning id',
        ['Fleet Truck 1', null]
      )
      vehicleId = inserted.rows[0].id
    } else {
      vehicleId = vrows[0].id
    }

    const { rows: existingLogs } = await client.query('select id from fuel_logs where vehicle_id=$1 limit 1', [vehicleId])

    if (existingLogs.length === 0) {
      const seed = [
        { date: '2026-01-10', s: 120000, e: 120320, liters: 38.7, notes: 'city' },
        { date: '2026-02-12', s: 120320, e: 120910, liters: 62.4, notes: 'mixed' },
        { date: '2026-03-15', s: 120910, e: 121380, liters: 48.1, notes: 'highway' }
      ]

      for (const row of seed) {
        await client.query(
          `insert into fuel_logs (vehicle_id, date, odometer_start_km, odometer_end_km, fuel_liters, notes)
           values ($1,$2,$3,$4,$5,$6)`,
          [vehicleId, row.date, row.s, row.e, row.liters, row.notes]
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

