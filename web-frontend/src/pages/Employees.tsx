import { FormEvent, useEffect, useState } from 'react'
import { api, Employee } from '../lib/api'

export default function Employees() {
  const [items, setItems] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
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

  function validateForm() {
    const errors: {[key: string]: string} = {}
    
    if (!first_name.trim()) errors.first_name = 'First name is required'
    if (!last_name.trim()) errors.last_name = 'Last name is required'
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (phone) {
      // Remove all non-digit characters to check length
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits'
      } else if (!/^\d{10}$/.test(digitsOnly)) {
        errors.phone = 'Phone number must contain only digits'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validateForm()) return
    
    try {
      await api.employees.create({ first_name, last_name, email, phone, avatar_url })
      setFirst(''); setLast(''); setEmail(''); setPhone(''); setAvatar('')
      setValidationErrors({})
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
      // Reset the file input
      e.target.value = ''
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Are you sure you want to delete this employee? This will also remove all their shift assignments.')) return
    try {
      await api.employees.delete(id)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="grid grid-2">
      <section className="panel" style={{ background: 'linear-gradient(135deg, var(--charcoal-light) 0%, rgba(212, 175, 55, 0.05) 100%)', border: '2px solid var(--accent)' }}>
        <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 20 }}>
          <span className="title-accent">👥 Employees</span> · Directory
        </h2>
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Search</label>
          <input className="input" placeholder="Search by name or email" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {loading ? <p>Loading...</p> : (
          <div style={{ background: 'var(--charcoal)', borderRadius: 12, padding: 20, border: '1px solid rgba(212, 175, 55, 0.2)', overflowX: 'auto' }}>
            <table className="table" style={{ background: 'transparent', border: 'none', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--accent)' }}>
                  <th style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>ID</th>
                  <th style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>🖼️ Photo</th>
                  <th style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>👤 Employee</th>
                  <th style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>📧 Email</th>
                  <th style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>📞 Phone</th>
                  <th style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, padding: '16px 12px' }}>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(e => {
                  const s = q.trim().toLowerCase(); if (!s) return true
                  return (`${e.first_name} ${e.last_name} ${e.email}`).toLowerCase().includes(s)
                }).map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', transition: 'all 0.3s ease' }}>
                    <td style={{ padding: '16px 12px', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{e.id}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      {e.avatar_url ? (
                        <img 
                          className="avatar" 
                          src={e.avatar_url} 
                          alt="avatar" 
                          style={{ 
                            width: 80, 
                            height: 80, 
                            borderRadius: '50%', 
                            border: '3px solid var(--accent)',
                            objectFit: 'cover',
                            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
                          }} 
                        />
                      ) : (
                        <div 
                          className="avatar" 
                          style={{ 
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', 
                            width: 80, 
                            height: 80, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'var(--charcoal)', 
                            fontWeight: 700, 
                            fontSize: 24, 
                            border: '3px solid var(--accent)',
                            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                            margin: '0 auto'
                          }}
                        >
                          {e.first_name[0]}{e.last_name[0]}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)', marginBottom: 4 }}>{e.first_name}</div>
                        <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{e.last_name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{e.email}</td>
                    <td style={{ padding: '16px 12px', fontSize: 15, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{e.phone || 'Not provided'}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <button 
                        onClick={() => onDelete(e.id)} 
                        style={{ 
                          background: 'linear-gradient(135deg, #ff4757, #ff3742)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '12px 16px', 
                          borderRadius: 8, 
                          cursor: 'pointer', 
                          fontSize: 18, 
                          fontWeight: 600, 
                          minWidth: '50px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        🗑️
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
        <h3 className="panel-title"><span className="title-accent">Add</span> · New Employee</h3>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <div className="field">
            <label>First name</label>
            <input className="input" placeholder="First name" value={first_name} onChange={e => setFirst(e.target.value)} required />
            {validationErrors.first_name && <small style={{ color: 'var(--danger)' }}>{validationErrors.first_name}</small>}
          </div>
          <div className="field">
            <label>Last name</label>
            <input className="input" placeholder="Last name" value={last_name} onChange={e => setLast(e.target.value)} required />
            {validationErrors.last_name && <small style={{ color: 'var(--danger)' }}>{validationErrors.last_name}</small>}
          </div>
          <div className="field">
            <label>Email</label>
            <input className="input" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            {validationErrors.email && <small style={{ color: 'var(--danger)' }}>{validationErrors.email}</small>}
          </div>
          <div className="field">
            <label>Phone (10 digits)</label>
            <input 
              className="input" 
              placeholder="e.g., 9876543210" 
              value={phone} 
              onChange={e => {
                // Only allow digits and limit to 10 characters
                const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(value)
              }}
              maxLength={10}
              type="tel"
            />
            {validationErrors.phone && <small style={{ color: 'var(--danger)' }}>{validationErrors.phone}</small>}
          </div>
          <div className="field">
            <label>Picture (optional)</label>
            <input className="input" type="file" accept="image/*" onChange={onPickFile} />
            {uploading ? <small>Uploading...</small> : avatar_url ? <small>Ready ✓</small> : null}
          </div>
          {avatar_url && (
            <div className="field">
              <label>Preview</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--charcoal-light)', borderRadius: 8 }}>
                <img src={avatar_url} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '2px solid var(--accent)' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Image uploaded</div>
                  <button type="button" onClick={() => setAvatar('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            </div>
          )}
          <div>
            <button className="btn btn-primary" type="submit">Create Employee</button>
          </div>
        </form>
      </section>
    </div>
  )
}

