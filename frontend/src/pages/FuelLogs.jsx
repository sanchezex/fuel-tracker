import React, { useEffect, useMemo, useState } from 'react'

function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function FuelLogs() {
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

  async function loadVehicles() {
    const data = await api('/api/vehicles')
    setVehicles(data)
    if (data[0]?.id) setVehicleId(String(data[0].id))
  }

  async function loadLogs() {
    const data = await api('/api/fuellogs?vehicleId=' + encodeURIComponent(vehicleId || ''))
    setLogs(data)
  }

  useEffect(() => {
    loadVehicles().catch(console.error)
  }, [])

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

  return (
    <div className="grid">
      <div className="col-8">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Fuel Logs</h2>

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
            Tip: add at least one vehicle in the backend seed/dev endpoint.
          </p>
        </div>
      </div>
    </div>
  )
}

