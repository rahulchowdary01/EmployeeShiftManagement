import { FormEvent, useEffect, useState } from 'react'
import { api, Employee } from '../lib/api'

export default function Employees() {
  const [items, setItems] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [first_name, setFirst] = useState('')
  const [last_name, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar_url, setAvatar] = useState('')
  const [uploading, setUploading] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setItems(await api.employees.list())
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
      await api.employees.create({ first_name, last_name, email, phone, avatar_url })
      setFirst(''); setLast(''); setEmail(''); setPhone(''); setAvatar('')
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const url = await api.employees.uploadAvatar(file)
      setAvatar(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid grid-2">
      <section className="panel">
        <h2 className="panel-title"><span className="title-accent">Employees</span> · Directory</h2>
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Search</label>
          <input className="input" placeholder="Search by name or email" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {loading ? <p>Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {items.filter(e => {
                const s = q.trim().toLowerCase(); if (!s) return true
                return (`${e.first_name} ${e.last_name} ${e.email}`).toLowerCase().includes(s)
              }).map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {e.avatar_url ? <img className="avatar" src={e.avatar_url} alt="avatar" /> : <span className="avatar" style={{ background: 'var(--accent)' }} />}
                  {e.first_name} {e.last_name}
                </td>
                  <td>{e.email}</td>
                  <td>{e.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title"><span className="title-accent">Add</span> · New Employee</h3>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <div className="field">
            <label>First name</label>
            <input className="input" placeholder="First name" value={first_name} onChange={e => setFirst(e.target.value)} required />
          </div>
          <div className="field">
            <label>Last name</label>
            <input className="input" placeholder="Last name" value={last_name} onChange={e => setLast(e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Phone</label>
            <input className="input" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Picture (optional)</label>
            <input className="input" type="file" accept="image/*" onChange={onPickFile} />
            {uploading ? <small>Uploading...</small> : avatar_url ? <small>Ready ✓</small> : null}
          </div>
          <div>
            <button className="btn btn-primary" type="submit">Create Employee</button>
          </div>
        </form>
      </section>
    </div>
  )
}

