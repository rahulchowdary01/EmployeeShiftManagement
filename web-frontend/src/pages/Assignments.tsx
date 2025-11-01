import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { api, Employee } from '../lib/api'
import { Calendar, dateFnsLocalizer, EventPropGetter, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import addDays from 'date-fns/addDays'
import startOfDay from 'date-fns/startOfDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

type Assignment = { id: number, employee_id: number, shift_id: number }
type Shift = { id: number, name: string, date: string, start_time: string, end_time: string, shift_type: string }

type CalendarEvent = {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    assignment: Assignment
    shift: Shift
    employee?: Employee
  }
}

type EventMutationArgs = {
  event: CalendarEvent
  start: Date | string
  end: Date | string
  isAllDay?: boolean
  allDay?: boolean
}

const locales = { 'en-US': enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales,
})

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

const calendarTheme = {
  lightBorder: '#3d3e4c',
  heavyBorder: '#7e5bef',
  todayBg: 'rgba(126, 91, 239, 0.12)',
  todayBorder: '#a78bfa',
  headerBg: 'rgba(126, 91, 239, 0.08)',
}

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const toDateString = (value: unknown): string | null => {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, 'yyyy-MM-dd')
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd')
    }
  }
  return null
}

const toTimeString = (value: unknown): string | null => {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, 'HH:mm:ss')
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      return trimmed.length === 5 ? `${trimmed}:00` : trimmed
    }
    const parsed = new Date(`1970-01-01T${trimmed}`)
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, 'HH:mm:ss')
    }
  }
  return null
}

const normalizeAssignments = (raw: any[]): Assignment[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): Assignment | null => {
      const id = safeNumber(item?.id)
      const employeeId = safeNumber(item?.employee_id)
      const shiftId = safeNumber(item?.shift_id)
      if (id == null || employeeId == null || shiftId == null) return null
      return { id, employee_id: employeeId, shift_id: shiftId }
    })
    .filter((item): item is Assignment => item !== null)
}

const normalizeEmployees = (raw: any[]): Employee[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): Employee | null => {
      const id = safeNumber(item?.id)
      if (id == null) return null
      const firstName = typeof item?.first_name === 'string' ? item.first_name : ''
      const lastName = typeof item?.last_name === 'string' ? item.last_name : ''
      const email = typeof item?.email === 'string' ? item.email : ''
      if (!email) return null
      const phone = typeof item?.phone === 'string' ? item.phone : undefined
      const departmentId = safeNumber(item?.department_id)
      const avatarUrl = typeof item?.avatar_url === 'string' ? item.avatar_url : undefined
      return {
        id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone ?? undefined,
        department_id: departmentId ?? undefined,
        avatar_url: avatarUrl ?? undefined,
      }
    })
    .filter((item): item is Employee => item !== null)
}

const normalizeShifts = (raw: any[]): Shift[] => {
  if (!Array.isArray(raw)) return []
  const allowedShiftTypes = new Set(['MORNING', 'AFTERNOON', 'NIGHT'])
  return raw
    .map((item): Shift | null => {
      const id = safeNumber(item?.id)
      const date = toDateString(item?.date)
      const startTime = toTimeString(item?.start_time)
      const endTime = toTimeString(item?.end_time)
      if (id == null || !date || !startTime || !endTime) return null
      const name = typeof item?.name === 'string' && item.name.trim() ? item.name : `Shift #${id}`
      const shiftTypeRaw = typeof item?.shift_type === 'string' ? item.shift_type.toUpperCase() : ''
      const shift_type = allowedShiftTypes.has(shiftTypeRaw) ? shiftTypeRaw : 'MORNING'
      return {
        id,
        name,
        date,
        start_time: startTime,
        end_time: endTime,
        shift_type,
      }
    })
    .filter((item): item is Shift => item !== null)
}

export default function Assignments() {
  const [items, setItems] = useState<Assignment[]>([])
  const [employee_id, setEmp] = useState<number | ''>('')
  const [shift_id, setShift] = useState<number | ''>('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [listRange, setListRange] = useState<{ start: Date, end: Date } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [calendarRange, setCalendarRange] = useState<{ start: Date, end: Date } | null>(null)
  const [calendarView, setCalendarView] = useState<View>('week')
  const [proposalWindow, setProposalWindow] = useState<{ start: Date, end: Date } | null>(null)
  const [calendarUpdatingId, setCalendarUpdatingId] = useState<number | null>(null)
  const [calendarNotice, setCalendarNotice] = useState<string>('')
  const [calendarError, setCalendarError] = useState<string>('')

  useEffect(() => {
    const calendarStyles = document.createElement('style')
    calendarStyles.id = 'assignments-calendar-theme'
    calendarStyles.textContent = `
      .rbc-toolbar {
        padding: 12px 16px;
        background: ${calendarTheme.headerBg};
        border-radius: 12px;
        border: 1px solid rgba(126, 91, 239, 0.2);
        margin-bottom: 16px;
        gap: 12px;
      }

      .rbc-toolbar button {
        border-radius: 999px;
        border: 1px solid rgba(126, 91, 239, 0.35);
        padding: 6px 14px;
        font-weight: 600;
        color: var(--ink);
        background: transparent;
        transition: all 0.2s ease;
      }

      .rbc-toolbar button:hover,
      .rbc-toolbar button:focus {
        background: rgba(126, 91, 239, 0.16);
        color: var(--accent-3);
        border-color: rgba(126, 91, 239, 0.45);
        box-shadow: 0 6px 18px rgba(126, 91, 239, 0.25);
      }

      .rbc-toolbar button.rbc-active {
        background: linear-gradient(135deg, #f97316, #fb923c);
        color: #111827;
        border-color: transparent;
        box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35);
      }

      .rbc-month-view,
      .rbc-time-view,
      .rbc-agenda-view {
        border-radius: 16px;
        overflow: hidden;
        background: var(--charcoal);
        border: 1px solid rgba(126, 91, 239, 0.25);
      }

      .rbc-month-row + .rbc-month-row {
        border-top: 1px solid ${calendarTheme.lightBorder};
      }

      .rbc-month-view .rbc-header {
        padding: 10px 0;
        background: rgba(126, 91, 239, 0.1);
        border-bottom: 1px solid ${calendarTheme.lightBorder};
        color: var(--accent-3);
        font-weight: 600;
      }

      .rbc-month-view .rbc-off-range-bg {
        background: rgba(255, 255, 255, 0.02);
      }

      .rbc-day-bg + .rbc-day-bg,
      .rbc-time-content > * + * > * {
        border-left: 1px solid rgba(126, 91, 239, 0.32);
        background: rgba(126, 91, 239, 0.08);
      }

      .rbc-time-content {
        border: none;
        background: transparent;
        box-shadow: none;
      }

      .rbc-timeslot-group {
        border-bottom: none !important;
        border-top: none !important;
        background: transparent;
      }

      .rbc-day-slot .rbc-events-container {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0 6px;
      }

      .rbc-time-slot {
        border-top: none !important;
        background: transparent;
      }

      .rbc-time-gutter .rbc-time-slot {
        border: none !important;
        background: transparent;
      }

      .rbc-time-view .rbc-row.rbc-row-content,
      .rbc-time-view .rbc-time-content {
        border: none;
        background: transparent;
        box-shadow: none;
      }

      .rbc-time-view .rbc-time-content > * > * {
        border-left: 1px solid rgba(126, 91, 239, 0.32);
        background: rgba(126, 91, 239, 0.08);
      }

      .rbc-now {
        color: var(--accent-3);
      }

      .rbc-today {
        background: ${calendarTheme.todayBg};
        outline: 2px solid ${calendarTheme.todayBorder};
        outline-offset: -3px;
      }

      .rbc-selected {
        background: rgba(126, 91, 239, 0.18);
      }

      .rbc-event {
        border-radius: 12px;
        padding: 6px 8px;
        font-weight: 600;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
        color: #0f172a !important;
      }

      .rbc-event-label {
        color: #0f172a !important;
        font-weight: 500;
      }

      .rbc-event-content {
        color: #0f172a !important;
      }

      .rbc-agenda-view table.rbc-agenda-table {
        border-color: rgba(126, 91, 239, 0.2);
      }

      .rbc-agenda-view table.rbc-agenda-table tbody > tr + tr {
        border-top: 1px solid rgba(126, 91, 239, 0.15);
      }
    `

    // remove any previous injection to avoid duplicates
    const existing = document.getElementById('assignments-calendar-theme')
    if (existing) existing.remove()
    document.head.appendChild(calendarStyles)

    return () => {
      calendarStyles.remove()
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [assignmentData, employeeData, shiftData] = await Promise.all([
        api.assignments.listAll(),
        api.employees.list(),
        api.shifts.list(),
      ])
      setItems(normalizeAssignments(assignmentData))
      setEmployees(normalizeEmployees(employeeData))
      setShifts(normalizeShifts(shiftData))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const [error, setError] = useState<string>('')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    setSelectedEvent(null)
    setCalendarNotice('')
    setCalendarError('')
  }, [viewMode, items])

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

  const filteredEmployees = useMemo(() => {
    const s = query.trim().toLowerCase()
    if (!s) return employees
    return employees.filter(e => (`${e.first_name} ${e.last_name} ${e.email}`).toLowerCase().includes(s))
  }, [employees, query])

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    return items
      .map<CalendarEvent | null>(assignment => {
        const shift = shifts.find(s => s.id === assignment.shift_id)
        if (!shift) return null
        const employee = employees.find(e => e.id === assignment.employee_id)
        const start = new Date(`${shift.date}T${shift.start_time}`)
        let end = new Date(`${shift.date}T${shift.end_time}`)
        if (end <= start) {
          end = addDays(end, 1)
        }

        return {
          id: assignment.id,
          title: `${shift.name}${employee ? ` · ${employee.first_name} ${employee.last_name}` : ''}`,
          start,
          end,
          resource: {
            assignment,
            shift,
            employee,
          },
        }
      })
      .filter((event): event is CalendarEvent => event !== null)
  }, [items, shifts, employees])

  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const shiftA = shifts.find(s => s.id === a.shift_id)
      const shiftB = shifts.find(s => s.id === b.shift_id)
      if (!shiftA || !shiftB) return a.id - b.id
      const startA = new Date(`${shiftA.date}T${shiftA.start_time}`).getTime()
      const startB = new Date(`${shiftB.date}T${shiftB.start_time}`).getTime()
      return startA - startB
    })

    if (!listRange) return sorted

    return sorted.filter(assignment => {
      const shift = shifts.find(s => s.id === assignment.shift_id)
      if (!shift) return false
      const start = new Date(`${shift.date}T${shift.start_time}`)
      return start >= listRange.start && start <= listRange.end
    })
  }, [items, shifts, listRange])

  const unassignedShifts = useMemo(() => {
    const assignedIds = new Set(items.map(a => a.shift_id))
    return shifts.filter(shift => !assignedIds.has(shift.id))
  }, [shifts, items])

  const eventPropGetter = useCallback<EventPropGetter<CalendarEvent>>((event: CalendarEvent) => {
    const palette: Record<string, { bg: string, border: string, text: string }> = {
      MORNING: { bg: 'rgba(129, 140, 248, 0.32)', border: '#818cf8', text: '#1f2937' },
      AFTERNOON: { bg: 'rgba(251, 191, 36, 0.32)', border: '#fbbf24', text: '#1f2937' },
      NIGHT: { bg: 'rgba(147, 51, 234, 0.32)', border: '#9333ea', text: '#0f172a' },
    }
    const colors = palette[event.resource.shift.shift_type] ?? { bg: 'rgba(52, 152, 219, 0.2)', border: '#3498db', text: '#1f618d' }
    return {
      style: {
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        borderRadius: 10,
        padding: '4px 8px',
        fontWeight: 600,
        backdropFilter: 'blur(6px)',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
      },
    }
  }, [])

  const handleRangeChange = useCallback((range: Date[] | { start: Date, end: Date }) => {
    const baseRange = Array.isArray(range)
      ? (range.length ? { start: range[0], end: range[range.length - 1] } : null)
      : (range && range.start && range.end ? { start: range.start, end: range.end } : null)

    if (!baseRange) return

    const normalized = {
      start: startOfDay(baseRange.start),
      end: addDays(startOfDay(baseRange.end), 1),
    }

    if (
      proposalWindow &&
      Math.abs(normalized.start.getTime() - proposalWindow.start.getTime()) < 1000 &&
      Math.abs(normalized.end.getTime() - proposalWindow.end.getTime()) < 1000
    ) {
      setCalendarRange(normalized)
      setListRange(normalized)
      return
    }

    setProposalWindow(null)
    setCalendarRange(normalized)
    setListRange(normalized)
  }, [proposalWindow])

  const handleNavigate = useCallback((date: Date) => {
    setCalendarDate(date)
    setProposalWindow(null)
  }, [])

  useEffect(() => {
    if (viewMode === 'list') {
      if (proposalWindow) {
        setListRange(proposalWindow)
      } else if (calendarRange) {
        setListRange(calendarRange)
      } else {
        setListRange(null)
      }
    }
  }, [viewMode, proposalWindow, calendarRange])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
  }, [])

  const findShiftByWindow = useCallback((start: Date, end: Date) => {
    const toleranceMs = 60 * 1000
    return shifts.find(shift => {
      const shiftStart = new Date(`${shift.date}T${shift.start_time}`)
      let shiftEnd = new Date(`${shift.date}T${shift.end_time}`)
      if (shiftEnd <= shiftStart) {
        shiftEnd = addDays(shiftEnd, 1)
      }
      return Math.abs(shiftStart.getTime() - start.getTime()) <= toleranceMs &&
        Math.abs(shiftEnd.getTime() - end.getTime()) <= toleranceMs
    }) ?? null
  }, [shifts])

  const processEventMutation = useCallback(async (event: CalendarEvent, startInput: Date | string, endInput: Date | string) => {
    const start = typeof startInput === 'string' ? new Date(startInput) : startInput
    const end = typeof endInput === 'string' ? new Date(endInput) : endInput
    setCalendarError('')
    setCalendarNotice('')

    const targetShift = findShiftByWindow(start, end)
    if (!targetShift) {
      setCalendarError('No matching shift exists for the selected time.')
      return
    }

    if (targetShift.id === event.resource.shift.id) {
      setCalendarNotice('Assignment already belongs to that shift.')
      return
    }

    try {
      setCalendarUpdatingId(event.id)
      await api.assignments.update(event.id, { shift_id: targetShift.id })
      setCalendarNotice(`Moved to ${targetShift.name} · ${targetShift.date}`)
      await load()
    } catch (err: any) {
      setCalendarError(err?.message ?? 'Failed to move assignment')
    } finally {
      setCalendarUpdatingId(null)
    }
  }, [findShiftByWindow, load])

  const handleEventDrop = useCallback(async ({ event, start, end }: EventMutationArgs) => {
    if (!event) return
    await processEventMutation(event, start, end)
  }, [processEventMutation])

  const handleEventResize = useCallback(async ({ event, start, end }: EventMutationArgs) => {
    if (!event) return
    await processEventMutation(event, start, end)
  }, [processEventMutation])

  useEffect(() => {
    if (viewMode === 'calendar') {
      if (proposalWindow) {
        setCalendarRange(proposalWindow)
        setCalendarDate(proposalWindow.start)
      } else if (!calendarRange) {
        const start = startOfDay(startOfWeek(new Date(), { locale: enUS }))
        const end = addDays(start, 7)
        setCalendarRange({ start, end })
        setCalendarDate(start)
      }
    }
  }, [viewMode, proposalWindow, calendarRange])

  const calendarRangeLabel = useMemo(() => {
    if (!calendarRange) return ''
    const displayEnd = addDays(calendarRange.end, -1)
    return `${format(calendarRange.start, 'MMM d')} – ${format(displayEnd, 'MMM d, yyyy')}`
  }, [calendarRange])

  const toggleButtonStyle = useCallback((active: boolean) => ({
    background: active ? 'linear-gradient(135deg, #9b59b6, #8e44ad)' : 'transparent',
    border: `1px solid ${active ? 'rgba(155, 89, 182, 0.6)' : 'rgba(155, 89, 182, 0.3)'}`,
    color: active ? '#fff' : 'var(--accent-3)',
    padding: '8px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  }), [])

  return (
    <div className="grid grid-2">
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="panel-title" style={{ margin: 0 }}><span className="title-accent">Assignments</span> · Roster</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={toggleButtonStyle(viewMode === 'list')} onClick={() => setViewMode('list')}>
              List View
            </button>
            <button type="button" style={toggleButtonStyle(viewMode === 'calendar')} onClick={() => setViewMode('calendar')}>
              Calendar View
            </button>
          </div>
        </div>
        {viewMode === 'calendar' && calendarRangeLabel && (
          <p style={{ marginTop: 0, marginBottom: 16, color: 'var(--ink-muted)', fontSize: 14 }}>
            Showing schedule for {calendarRangeLabel}
          </p>
        )}
        {viewMode === 'list' && (
          loading ? <p>Loading assignments...</p> : (
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
                {visibleItems.map(a => {
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
          )
        )}
        {viewMode === 'calendar' && (
          loading ? <p>Loading calendar...</p> : (
            <div style={{ background: 'var(--charcoal)', borderRadius: 12, padding: 20, border: '1px solid rgba(155, 89, 182, 0.2)' }}>
              <DnDCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                views={{ month: true, week: true, day: true, agenda: true }}
                view={calendarView}
                onView={setCalendarView}
                date={calendarDate}
                onNavigate={handleNavigate}
                popup
                style={{ height: 600 }}
                eventPropGetter={eventPropGetter}
                onSelectEvent={handleSelectEvent}
                onRangeChange={handleRangeChange}
                draggableAccessor={() => true}
                resizable
                selectable
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                longPressThreshold={40}
                showMultiDayTimes
              />
              {(calendarUpdatingId || calendarNotice || calendarError) && (
                <div style={{ marginTop: 12, display: 'grid', gap: 4 }}>
                  {calendarUpdatingId && (
                    <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 13 }}>
                      Updating assignment #{calendarUpdatingId}...
                    </p>
                  )}
                  {calendarNotice && (
                    <p style={{ margin: 0, color: 'var(--accent-3)', fontSize: 13 }}>{calendarNotice}</p>
                  )}
                  {calendarError && (
                    <p style={{ margin: 0, color: 'var(--danger)', fontSize: 13 }}>{calendarError}</p>
                  )}
                </div>
              )}
            </div>
          )
        )}
        {viewMode === 'calendar' && selectedEvent && (
          <div style={{ marginTop: 16, background: 'rgba(155, 89, 182, 0.08)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(155, 89, 182, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, color: 'var(--accent-3)' }}>Selected assignment</h4>
              <button type="button" onClick={() => setSelectedEvent(null)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>Clear</button>
            </div>
            <p style={{ margin: '4px 0', color: 'var(--ink)' }}><strong>Shift:</strong> {selectedEvent.resource.shift.name}</p>
            <p style={{ margin: '4px 0', color: 'var(--ink)' }}><strong>Date:</strong> {format(selectedEvent.start, 'MMM d, yyyy')}</p>
            <p style={{ margin: '4px 0', color: 'var(--ink)' }}><strong>Time:</strong> {`${format(selectedEvent.start, 'p')} - ${format(selectedEvent.end, 'p')}`}</p>
            <p style={{ margin: '4px 0', color: 'var(--ink)' }}><strong>Employee:</strong> {selectedEvent.resource.employee ? `${selectedEvent.resource.employee.first_name} ${selectedEvent.resource.employee.last_name}` : 'Unassigned'}</p>
            <p style={{ margin: '4px 0', color: 'var(--ink)' }}><strong>Shift type:</strong> {selectedEvent.resource.shift.shift_type}</p>
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
          </div>
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        </form>
        <div style={{ marginTop: 20, background: 'var(--charcoal)', borderRadius: 12, padding: 16, border: '1px solid rgba(155, 89, 182, 0.2)', display: 'grid', gap: 8 }}>
          <h4 style={{ margin: 0, color: 'var(--accent-3)' }}>Unassigned Shifts</h4>
          {unassignedShifts.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--ink-muted)' }}>All upcoming shifts are covered 🎉</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
              {unassignedShifts.map(shift => (
                <li key={shift.id} style={{ color: 'var(--ink)', fontSize: 14 }}>
                  {shift.date} · {shift.name} · {shift.start_time}-{shift.end_time} ({shift.shift_type})
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

