const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export type Employee = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: number | null
  avatar_url?: string | null
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  employees: {
    list: () => fetchJson<Employee[]>('/employees/'),
    create: (body: Omit<Employee, 'id'>) =>
      fetchJson<Employee>('/employees/', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    search: async (q: string) => {
      const all = await fetchJson<Employee[]>('/employees/')
      const s = q.trim().toLowerCase()
      return all.filter(e => (`${e.first_name} ${e.last_name} ${e.email}`).toLowerCase().includes(s))
    },
    uploadAvatar: async (file: File): Promise<string> => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE}/employees/upload-avatar`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json() as { url: string }
      return `${API_BASE}${data.url}`
    }
  },
  shifts: {
    list: () => fetchJson<any[]>('/shifts/'),
    create: (body: any) => fetchJson<any>('/shifts/', { method: 'POST', body: JSON.stringify(body) }),
  },
  assignments: {
    list: () => fetchJson<any[]>('/assignments/'),
    create: (body: any) => fetchJson<any>('/assignments/', { method: 'POST', body: JSON.stringify(body) }),
    autoBalance: () => fetchJson<{ created: number }>('/assignments/auto-balance', { method: 'POST' }),
  },
}

