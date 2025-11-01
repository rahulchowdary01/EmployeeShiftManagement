/**
 * API client for communicating with the FastAPI backend.
 * 
 * This module provides a centralized API client that handles all HTTP requests
 * to the backend services. It includes type definitions for data models and
 * utility functions for making API calls with proper error handling.
 */

// Base URL for API requests - defaults to localhost:8000 for development
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

/**
 * Type definition for Employee data structure.
 * Matches the backend Employee model schema.
 */
export type Employee = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: number | null
  avatar_url?: string | null
}

/**
 * Generic function to make HTTP requests to the API.
 * 
 * @param path - API endpoint path (e.g., '/employees/')
 * @param init - Optional fetch configuration (method, body, etc.)
 * @returns Promise resolving to the parsed JSON response
 * @throws Error if the HTTP request fails
 */
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
    },
    delete: (id: number) => fetchJson(`/employees/${id}`, { method: 'DELETE' }),
  },
  shifts: {
    list: () => fetchJson<any[]>('/shifts/'),
    create: (body: any) => fetchJson<any>('/shifts/', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: number) => fetchJson(`/shifts/${id}`, { method: 'DELETE' }),
  },
  ai: {
    optimizeSchedule: () => fetchJson('/ai/optimize-schedule', { method: 'POST' }),
    suggestAssignment: (employeeId: number, shiftId: number) => 
      fetchJson(`/ai/suggest-assignment?employee_id=${employeeId}&shift_id=${shiftId}`, { method: 'POST' }),
    getInsights: () => fetchJson('/ai/insights', { method: 'POST' }),
    chat: (query: string) => fetchJson('/ai/chat', { 
      method: 'POST', 
      body: JSON.stringify({ query }) 
    }),
    analyzeWorkforce: (analysisType: string = 'comprehensive') => fetchJson('/ai/analyze-workforce', {
      method: 'POST',
      body: JSON.stringify({ analysis_type: analysisType })
    }),
    getLangChainInfo: () => fetchJson('/ai/langchain-info'),
    generateSchedule: (body?: { start_date?: string, weeks?: number }) =>
      fetchJson('/ai/generate-schedule', {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      }),
  },
  assignments: {
    list: () => fetchJson<any[]>('/assignments/'),
    listByRange: (start: string, end: string) =>
      fetchJson<any[]>(`/assignments/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
    listAll: () => fetchJson<any[]>('/assignments/?start=1970-01-01&end=2100-12-31'),
    create: (body: any) => fetchJson<any>('/assignments/', { method: 'POST', body: JSON.stringify(body) }),
    autoBalance: () => fetchJson<{ created: number }>('/assignments/auto-balance', { method: 'POST' }),
    update: (id: number, body: any) => fetchJson(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => fetchJson(`/assignments/${id}`, { method: 'DELETE' }),
  },
}
