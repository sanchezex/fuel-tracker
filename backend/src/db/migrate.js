import 'dotenv/config'
import { pool } from '../lib/db.js'

async function main() {
  const client = await pool.connect()
  try {
    await client.query(`
      create table if not exists vehicles (
        id bigserial primary key,
        name text not null,
        vin text,
        created_at timestamptz not null default now()
      );
    `)

    await client.query(`
      create table if not exists fuel_logs (
        id bigserial primary key,
        vehicle_id bigint not null references vehicles(id) on delete cascade,
        date date not null,
        odometer_start_km numeric not null,
        odometer_end_km numeric not null,
        fuel_liters numeric not null,
        notes text,
        created_at timestamptz not null default now()
      );

      create index if not exists fuel_logs_vehicle_id_date_idx
        on fuel_logs(vehicle_id, date desc);
    `)

    console.log('Migrations complete')
  } finally {
    client.release()
  }
  await pool.end()
}


main().catch((e) => {
  console.error(e)
  process.exit(1)
})

