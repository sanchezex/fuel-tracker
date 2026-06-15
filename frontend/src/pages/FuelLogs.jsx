import React, { useEffect, useMemo, useState } from 'react'

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function FuelLogs() {
  const [companies, setCompanies] = useState([])
  const [companyId, setCompanyId] = useState('')

  const [drivers, setDrivers] = useState([])
  const [driverId, setDriverId] = useState('')

  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState('')


  const [logs, setLogs] = useState([])

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    odometerStartKm: '',
    odometerEndKm: '',
    fuelLiters: '',
    notes: ''
  })

  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    vin: '',
    assignDriverId: ''
  })

  async function api(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json()
  }

  async function loadCompanies() {
    const data = await api('/api/companies')
    setCompanies(data)
    if (data[0]?.id) setCompanyId(String(data[0].id))
  }

  async function loadDrivers(nextCompanyId) {
    const cid = nextCompanyId !== undefined ? nextCompanyId : companyId
    if (!cid) return
    const data = await api('/api/drivers?companyId=' + encodeURIComponent(cid))
    setDrivers(data)
    if (data[0]?.id) setDriverId(String(data[0].id))
  }

  async function loadVehicles(nextCompanyId) {
    const cid = nextCompanyId !== undefined ? nextCompanyId : companyId
    if (!cid) return
    const data = await api('/api/vehicles?companyId=' + encodeURIComponent(cid))
    setVehicles(data)
    if (data[0]?.id) setVehicleId(String(data[0].id))
  }


  async function loadLogs() {
    const data = await api('/api/fuellogs?vehicleId=' + encodeURIComponent(vehicleId || ''))
    setLogs(data)
  }

  useEffect(() => {
    loadCompanies()
      .then(() => {
        loadDrivers().catch(console.error)
        loadVehicles().catch(console.error)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!companyId) return
    loadDrivers().catch(console.error)
    loadVehicles().catch(console.error)
  }, [companyId])


  useEffect(() => {
    if (vehicleId) loadLogs().catch(console.error)
  }, [vehicleId])

  const computed = useMemo(() => {
    const start = Number(form.odometerStartKm)
    const end = Number(form.odometerEndKm)
    const liters = Number(form.fuelLiters)
    const distanceKm = Number.isFinite(start) && Number.isFinite(end) ? end - start : null

    let litersPer100km = null
    if (distanceKm && liters) {
      litersPer100km = (liters / distanceKm) * 100
    }

    return {
      distanceKm: distanceKm && Number.isFinite(distanceKm) ? distanceKm : null,
      litersPer100km
    }
  }, [form])

  async function submit(e) {
    e.preventDefault()
    if (!vehicleId) return

    const payload = {
      vehicleId: Number(vehicleId),
      date: form.date,
      odometerStartKm: Number(form.odometerStartKm),
      odometerEndKm: Number(form.odometerEndKm),
      fuelLiters: Number(form.fuelLiters),
      notes: form.notes || null
    }

    await api('/api/fuellogs', { method: 'POST', body: JSON.stringify(payload) })

    setForm({
      date: new Date().toISOString().slice(0, 10),
      odometerStartKm: '',
      odometerEndKm: '',
      fuelLiters: '',
      notes: ''
    })

    loadLogs().catch(console.error)
  }

  async function deleteVehicle(id) {
    if (!id) return
    const ok = window.confirm('Delete this vehicle? This will also delete its fuel logs.')
    if (!ok) return

    await api('/api/vehicles/' + encodeURIComponent(id), { method: 'DELETE' })

    // Reload current company vehicles.
    await loadVehicles().catch(console.error)

    // Clear selection if deleted.
    if (vehicleId && String(id) === String(vehicleId)) setVehicleId('')

    // Reload logs if vehicle still selected.
    if (vehicleId && String(id) !== String(vehicleId)) {
      loadLogs().catch(console.error)
    } else {
      setLogs([])
    }
  }

  async function deleteCompany(id) {
    if (!id) return
    const ok = window.confirm('Delete this company? This will delete all its drivers and vehicles.')
    if (!ok) return

    await api('/api/companies/' + encodeURIComponent(id), { method: 'DELETE' })

    // Reset everything and reload lists.
    setCompanyId('')
    setDriverId('')
    setVehicleId('')
    setDrivers([])
    setVehicles([])
    setLogs([])

    await loadCompanies().catch(console.error)
  }


  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Fuel Logs</h2>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Company</label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value)
                  setVehicleId('')
                }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: 160 }}>
              <label style={{ opacity: 0 }}>Delete</label>
              <button
                type="button"
                disabled={!companyId}
                onClick={() => deleteCompany(companyId)}
                style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                title="Delete company"
              >
                Delete
              </button>
            </div>
          </div>


          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: 140 }}>
              <label style={{ opacity: 0 }}>Delete</label>
              <button
                type="button"
                disabled={!vehicleId}
                onClick={() => deleteVehicle(vehicleId)}
                style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                title="Delete vehicle"
              >
                Delete
              </button>
            </div>
          </div>


          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.35)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Register Vehicle</h3>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!companyId) return
                const payload = {
                  companyId: Number(companyId),
                  name: vehicleForm.name,
                  vin: vehicleForm.vin || null,
                  driverId: vehicleForm.assignDriverId ? Number(vehicleForm.assignDriverId) : null
                }

                const created = await api('/api/vehicles', { method: 'POST', body: JSON.stringify(payload) })

                // Reload vehicles for current company and select the created one.
                await loadVehicles(companyId).catch(console.error)
                if (created?.id) setVehicleId(String(created.id))

                setVehicleForm({ name: '', vin: '', assignDriverId: '' })
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <label>Vehicle name *</label>
                <input
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>VIN (optional)</label>
                <input
                  value={vehicleForm.vin}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                  placeholder="e.g. 1HGCM82633A004352"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Assign driver (optional)</label>
                <select
                  value={vehicleForm.assignDriverId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, assignDriverId: e.target.value })}
                >
                  <option value="">— Unassigned —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={!companyId} style={{ width: '100%' }}>
                Create vehicle
              </button>
            </form>
          </div>


          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Distance (km)</th>
                <th>Fuel (L)</th>
                <th>Liters / 100km</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.date).toLocaleDateString()}</td>
                  <td>{fmt(l.distanceKm)}</td>
                  <td>{fmt(l.fuelLiters)}</td>
                  <td>{fmt(l.litersPer100km)}</td>
                  <td>{l.notes || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '18px 0', color: '#64748b' }}>
                    No logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="col-4">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Add Fuel Entry</h3>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 10 }}>
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Odometer Start (km)</label>
              <input
                inputMode="numeric"
                value={form.odometerStartKm}
                onChange={(e) => setForm({ ...form, odometerStartKm: e.target.value })}
                placeholder="e.g. 125000"
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Odometer End (km)</label>
              <input
                inputMode="numeric"
                value={form.odometerEndKm}
                onChange={(e) => setForm({ ...form, odometerEndKm: e.target.value })}
                placeholder="e.g. 125420"
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Fuel Used (liters)</label>
              <input
                inputMode="decimal"
                value={form.fuelLiters}
                onChange={(e) => setForm({ ...form, fuelLiters: e.target.value })}
                placeholder="e.g. 42.5"
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Notes (optional)</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. highway / city mix"
              />
            </div>

            <div style={{ margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Distance</span>
                <b>{fmt(computed.distanceKm)} km</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Estimated liters / 100km</span>
                <b>{computed.litersPer100km === null ? '—' : fmt(computed.litersPer100km)}</b>
              </div>
            </div>

            <button type="submit" disabled={!vehicleId} style={{ width: '100%' }}>
              Save
            </button>
          </form>

          <p style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
            Tip: pick a company; seed/dev creates drivers + vehicles under it.
          </p>

        </div>
      </div>
    </div>
  )
}

