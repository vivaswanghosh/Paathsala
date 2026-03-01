import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'

const EVENT_COLORS = {
  holiday: '#ef4444',
  special_holiday: '#22c55e',
  exam: '#f97316',
  assignment_deadline: '#3b82f6',
  event: '#8b5cf6'
}

function Calendar() {
  const { role } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    type: 'event',
    description: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await api.get('/calendar')
      setEvents(response.data.events || [])
    } catch (error) {
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (e) => {
    e.preventDefault()
    try {
      await api.post('/calendar', newEvent)
      toast.success('Event created')
      setShowModal(false)
      setNewEvent({ title: '', date: '', type: 'event', description: '' })
      fetchEvents()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create event')
    }
  }

  const calendarEvents = events.map(event => ({
    id: event._id,
    title: event.title,
    start: event.date,
    backgroundColor: EVENT_COLORS[event.type] || EVENT_COLORS.event,
    borderColor: 'transparent',
    extendedProps: {
      type: event.type,
      description: event.description
    }
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        {(role === 'admin' || role === 'hod') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Add Event
          </button>
        )}
      </div>

      <div className="card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
          }}
          height="auto"
          eventClick={(info) => {
            alert(`${info.event.title}\n${info.event.extendedProps.description || ''}`)
          }}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Event Legend</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
              <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Event</h3>
            <form onSubmit={createEvent} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="input-field"
                >
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="special_holiday">Special Holiday (Green)</option>
                  <option value="exam">Exam</option>
                  <option value="assignment_deadline">Assignment Deadline</option>
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
