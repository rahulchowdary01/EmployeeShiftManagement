import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api, Employee } from '../lib/api'

type Assignment = { id: number, employee_id: number, shift_id: number }

export default function Assignments() {
  const [items, setItems] = useState<Assignment[]>([])
  const [employee_id, setEmp] = useState<number | ''>('')
  const [shift_id, setShift] = useState<number | ''>('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      setItems(await api.assignments.list())
      setEmployees(await api.employees.list())
      setShifts(await api.shifts.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const [error, setError] = useState<string>('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (employee_id === '' || shift_id === '') return
    setError('')
    try {
      await api.assignments.create({ employee_id: Number(employee_id), shift_id: Number(shift_id) })
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function onAutoBalance() {
    const res = await api.assignments.autoBalance()
    setMsg(`Created ${res.created} assignments`)
    await load()
  }

  const filteredEmployees = useMemo(() => {
    const s = query.trim().toLowerCase()
    if (!s) return employees
    return employees.filter(e => (`${e.first_name} ${e.last_name} ${e.email}`).toLowerCase().includes(s))
  }, [employees, query])

  return (
    <div className="grid grid-2">
      <section className="panel">
        <h2 className="panel-title"><span className="title-accent">Assignments</span> · Roster</h2>
        {loading ? <p>Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Employee</th><th>Shift</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.employee_id}</td>
                  <td>{a.shift_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title"><span className="title-accent">Manage</span> · Create & Balance</h3>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12, maxWidth: 520 }}>
          <div className="field">
            <label>Find employee</label>
            <input className="input" placeholder="Search name or email" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="field">
            <label>Employee</label>
            <select className="select" value={employee_id} onChange={e => setEmp(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Choose an employee</option>
              {filteredEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name} · {e.email}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Shift</label>
            <select className="select" value={shift_id} onChange={e => setShift(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Choose a shift</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>{s.date} · {s.name} · {s.start_time}-{s.end_time} · {s.shift_type}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit">Assign</button>
            <button className="btn btn-outline" type="button" onClick={onAutoBalance}>Auto-balance</button>
          </div>
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        </form>
        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </section>
    </div>
  )
}

