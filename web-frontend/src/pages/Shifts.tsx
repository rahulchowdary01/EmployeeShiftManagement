import { FormEvent, useEffect, useState } from 'react'
import { api } from '../lib/api'

type Shift = {
  id: number
  name: string
  date: string
  start_time: string
  end_time: string
  shift_type: 'MORNING' | 'AFTERNOON' | 'NIGHT'
}

export default function Shifts() {
  const [items, setItems] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [deleting, setDeleting] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [start_time, setStart] = useState('09:00')
  const [end_time, setEnd] = useState('17:00')
  const [shift_type, setType] = useState<Shift['shift_type']>('MORNING')

  async function load() {
    try {
      setLoading(true)
      setItems(await api.shifts.list())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleShiftTypeChange(newType: Shift['shift_type']) {
    setType(newType)
    // Set appropriate default times based on shift type
    switch (newType) {
      case 'MORNING':
        setStart('06:00')
        setEnd('14:00')
        break
      case 'AFTERNOON':
        setStart('14:00')
        setEnd('22:00')
        break
      case 'NIGHT':
        setStart('22:00')
        setEnd('06:00')
        break
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this shift? This will also remove all assignments to this shift.')) return
    try {
      setDeleting(id)
      await api.shifts.delete(id)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.shifts.create({ name, date, start_time, end_time, shift_type })
      setName(''); setDate(''); setStart('09:00'); setEnd('17:00'); setType('MORNING')
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="grid grid-2">
      <section className="panel" style={{ background: 'linear-gradient(135deg, var(--charcoal-light) 0%, rgba(52, 152, 219, 0.05) 100%)', border: '2px solid var(--accent-2)' }}>
        <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 20 }}>
          <span className="title-accent">⏰ Shifts</span> · Schedule
        </h2>
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Search</label>
          <input className="input" placeholder="Search by name or date" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        {loading ? <p>Loading...</p> : (
          <div style={{ background: 'var(--charcoal)', borderRadius: 12, padding: 20, border: '1px solid rgba(52, 152, 219, 0.2)', overflowX: 'auto' }}>
            <table className="table" style={{ background: 'transparent', border: 'none', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--accent-2)' }}>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>ID</th>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>📝 Shift Name</th>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>📅 Date</th>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>🕘 Start</th>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>🕕 End</th>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>🏷️ Type</th>
                  <th style={{ color: 'var(--accent-2)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
              {items.filter(s => {
                const q = query.trim().toLowerCase()
                if (!q) return true
                return (
                  s.name.toLowerCase().includes(q) ||
                  s.date.toLowerCase().includes(q) ||
                  s.shift_type.toLowerCase().includes(q)
                )
              }).map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(52, 152, 219, 0.1)', transition: 'all 0.3s ease' }}>
                    <td style={{ padding: '16px 12px', fontSize: 16, fontWeight: 600, color: 'var(--accent-2)' }}>{s.id}</td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.name || 'Unnamed Shift'}</td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{s.date || 'No date'}</td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{s.start_time || 'Not set'}</td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{s.end_time || 'Not set'}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ 
                        background: s.shift_type === 'MORNING' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(155, 89, 182, 0.2)', 
                        color: s.shift_type === 'MORNING' ? '#2ecc71' : '#9b59b6',
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${s.shift_type === 'MORNING' ? '#2ecc71' : '#9b59b6'}`
                      }}>
                        {s.shift_type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <button 
                        onClick={() => onDelete(s.id)} 
                        disabled={deleting === s.id}
                        style={{ 
                          background: deleting === s.id ? 'linear-gradient(135deg, #95a5a6, #7f8c8d)' : 'linear-gradient(135deg, #e74c3c, #c0392b)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '12px 16px', 
                          borderRadius: 8, 
                          cursor: deleting === s.id ? 'not-allowed' : 'pointer', 
                          fontSize: 18, 
                          fontWeight: 600, 
                          minWidth: '50px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: deleting === s.id ? 'none' : '0 4px 12px rgba(231, 76, 60, 0.3)',
                          transition: 'all 0.3s ease',
                          opacity: deleting === s.id ? 0.6 : 1
                        }}
                        onMouseOver={(e) => {
                          if (deleting !== s.id) {
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {deleting === s.id ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title"><span className="title-accent">Create</span> · New Shift</h3>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12, maxWidth: 480 }}>
          <div className="field">
            <label>Name</label>
            <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Date</label>
            <input className="input" placeholder="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Start</label>
            <input className="input" placeholder="Start" type="time" value={start_time} onChange={e => setStart(e.target.value)} required />
          </div>
          <div className="field">
            <label>End</label>
            <input className="input" placeholder="End" type="time" value={end_time} onChange={e => setEnd(e.target.value)} required />
          </div>
          <div className="field">
            <label>Type</label>
            <select className="select" value={shift_type} onChange={e => handleShiftTypeChange(e.target.value as Shift['shift_type'])}>
              <option value="MORNING">🌅 MORNING (6:00 AM - 2:00 PM)</option>
              <option value="AFTERNOON">🌞 AFTERNOON (2:00 PM - 10:00 PM)</option>
              <option value="NIGHT">🌙 NIGHT (10:00 PM - 6:00 AM)</option>
            </select>
          </div>
          <div>
            <button className="btn btn-primary" type="submit">Create Shift</button>
          </div>
        </form>
      </section>
    </div>
  )
}

