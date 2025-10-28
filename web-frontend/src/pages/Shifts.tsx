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
      <section className="panel">
        <h2 className="panel-title"><span className="title-accent">Shifts</span> · Schedule</h2>
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Search</label>
          <input className="input" placeholder="Search by name or date" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        {loading ? <p>Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Date</th><th>Start</th><th>End</th><th>Type</th>
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
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.date}</td>
                  <td>{s.start_time}</td>
                  <td>{s.end_time}</td>
                  <td>{s.shift_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <select className="select" value={shift_type} onChange={e => setType(e.target.value as any)}>
              <option value="MORNING">MORNING</option>
              <option value="AFTERNOON">AFTERNOON</option>
              <option value="NIGHT">NIGHT</option>
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

