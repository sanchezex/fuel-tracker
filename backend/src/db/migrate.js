import 'dotenv/config'
import { pool } from '../lib/db.js'

async function main() {
  const client = await pool.connect()
  try {
    // Core entities
    await client.query(`
      create table if not exists companies (
        id bigserial primary key,
        name text not null,
        created_at timestamptz not null default now()
      );

      create table if not exists drivers (
        id bigserial primary key,
        company_id bigint not null references companies(id) on delete cascade,
        name text not null,
        created_at timestamptz not null default now()
      );

      create table if not exists vehicles (
        id bigserial primary key,
        company_id bigint not null references companies(id) on delete cascade,
        driver_id bigint null references drivers(id) on delete set null,
        name text not null,
        vin text,
        created_at timestamptz not null default now()
      );
    `)

    // If vehicles table already existed, add missing columns.
    await client.query(`
      do $$ begin
        if not exists (
          select 1 from information_schema.columns
          where table_name = 'vehicles' and column_name = 'company_id'
        ) then
          alter table vehicles add column company_id bigint;
        end if;

        if not exists (
          select 1 from information_schema.columns
          where table_name = 'vehicles' and column_name = 'driver_id'
        ) then
          alter table vehicles add column driver_id bigint;
        end if;

        -- Ensure NOT NULL going forward. Existing rows may still have null until seed runs.
        begin
          alter table vehicles alter column company_id set not null;
        exception when others then
          null;
        end;
      end $$;

    `)

    // Add FKs if missing. (Existing data may not satisfy constraints; seed/dev will populate.)
    // NOTE: we intentionally do NOT set company_id NOT NULL on pre-existing rows here.
    // Seed/dev will create companies and associate existing vehicles.
    await client.query(`
      do $$ begin
        if not exists (
          select 1 from information_schema.table_constraints
          where table_name = 'vehicles' and constraint_name = 'vehicles_company_id_fkey'
        ) then
          alter table vehicles
            add constraint vehicles_company_id_fkey
            foreign key (company_id) references companies(id) on delete cascade;
        end if;

        if not exists (
          select 1 from information_schema.table_constraints
          where table_name = 'vehicles' and constraint_name = 'vehicles_driver_id_fkey'
        ) then
          alter table vehicles
            add constraint vehicles_driver_id_fkey
            foreign key (driver_id) references drivers(id) on delete set null;
        end if;
      exception when others then
        null;
      end $$;
    `)




    await client.query(`
      create table if not exists fuel_logs (
        id bigserial primary key,
        vehicle_id bigint not null references vehicles(id) on delete cascade,
        date date not null,
        odometer_start_km numeric not null,
        odometer_end_km numeric not null,
        fuel_liters numeric not null,
        ops_data jsonb not null default '{}'::jsonb,
        notes text,
        created_at timestamptz not null default now()
      );

      create index if not exists fuel_logs_vehicle_id_date_idx
        on fuel_logs(vehicle_id, date desc);

      -- Add ops_data column to existing installations.
      do $$ begin
        if not exists (
          select 1 from information_schema.columns
          where table_name = 'fuel_logs' and column_name = 'ops_data'
        ) then
          alter table fuel_logs add column ops_data jsonb not null default '{}'::jsonb;
        end if;
      end $$;
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

