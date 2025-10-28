import { FormEvent, useEffect, useMemo, useState } from 'react'
import { api, Employee } from '../lib/api'

type Assignment = { id: number, employee_id: number, shift_id: number }
type Shift = { id: number, name: string, date: string, start_time: string, end_time: string, shift_type: string }

export default function Assignments() {
  const [items, setItems] = useState<Assignment[]>([])
  const [employee_id, setEmp] = useState<number | ''>('')
  const [shift_id, setShift] = useState<number | ''>('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
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
  const [deleting, setDeleting] = useState<number | null>(null)

  async function onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      setDeleting(id)
      await api.assignments.delete(id)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

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
          <div style={{ background: 'var(--charcoal)', borderRadius: 12, padding: 20, border: '1px solid rgba(155, 89, 182, 0.2)', overflowX: 'auto' }}>
            <table className="table" style={{ background: 'transparent', border: 'none', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--accent-3)' }}>
                  <th style={{ color: 'var(--accent-3)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>ID</th>
                  <th style={{ color: 'var(--accent-3)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>👤 Employee</th>
                  <th style={{ color: 'var(--accent-3)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>⏰ Shift Details</th>
                  <th style={{ color: 'var(--accent-3)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>📅 Date & Time</th>
                  <th style={{ color: 'var(--accent-3)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>🏷️ Type</th>
                  <th style={{ color: 'var(--accent-3)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
              {items.map(a => {
                const emp = employees.find(e => e.id === a.employee_id)
                const shift = shifts.find(s => s.id === a.shift_id)
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(155, 89, 182, 0.1)', transition: 'all 0.3s ease' }}>
                    <td style={{ padding: '16px 12px', fontSize: 16, fontWeight: 600, color: 'var(--accent-3)' }}>{a.id}</td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {emp ? `${emp.first_name} ${emp.last_name}` : `Employee ${a.employee_id}`}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {shift ? shift.name : `Shift ${a.shift_id}`}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                      {shift ? `${shift.date} • ${shift.start_time}-${shift.end_time}` : 'No details'}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      {shift ? (
                        <span style={{ 
                          background: shift.shift_type === 'MORNING' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(155, 89, 182, 0.2)', 
                          color: shift.shift_type === 'MORNING' ? '#2ecc71' : '#9b59b6',
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${shift.shift_type === 'MORNING' ? '#2ecc71' : '#9b59b6'}`
                        }}>
                          {shift.shift_type}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-muted)' }}>Unknown</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <button 
                        onClick={() => onDelete(a.id)} 
                        disabled={deleting === a.id}
                        style={{ 
                          background: deleting === a.id ? 'linear-gradient(135deg, #95a5a6, #7f8c8d)' : 'linear-gradient(135deg, #e67e22, #d35400)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '12px 16px', 
                          borderRadius: 8, 
                          cursor: deleting === a.id ? 'not-allowed' : 'pointer', 
                          fontSize: 18, 
                          fontWeight: 600, 
                          minWidth: '50px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: deleting === a.id ? 'none' : '0 4px 12px rgba(230, 126, 34, 0.3)',
                          transition: 'all 0.3s ease',
                          opacity: deleting === a.id ? 0.6 : 1
                        }}
                        onMouseOver={(e) => {
                          if (deleting !== a.id) {
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {deleting === a.id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          </div>
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

