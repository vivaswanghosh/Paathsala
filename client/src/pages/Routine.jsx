import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineUser } from 'react-icons/hi'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIME_SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
]

function Routine() {
  const { role, user } = useAuth()
  const [routine, setRoutine] = useState([])
  const [swapRequests, setSwapRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const requests = [api.get('/routine')]
      if (role === 'teacher') {
        requests.push(api.get('/routine/swap-requests'))
      }

      const [routineRes, swapRes] = await Promise.all(requests)
      setRoutine(routineRes.data.routine || [])
      if (role === 'teacher' && swapRes) {
        setSwapRequests(swapRes.data.requests || [])
      }
    } catch (error) {
      toast.error('Failed to load routine')
    } finally {
      setLoading(false)
    }
  }

  const markUnavailable = async () => {
    if (!selectedSlot) return

    try {
      await api.post('/routine/mark-unavailable', selectedSlot)
      toast.success('Marked as unavailable. Teachers will be notified.')
      setShowUnavailableModal(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark unavailable')
    }
  }

  const claimSwap = async (requestId) => {
    try {
      await api.post(`/routine/claim-swap/${requestId}`)
      toast.success('Class claimed successfully!')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to claim class')
    }
  }

  const getSlotContent = (day, timeSlot) => {
    return routine.find(r => r.day === day && `${r.timeSlot.start}-${r.timeSlot.end}` === timeSlot)
  }

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Class Routine</h1>
        {role === 'teacher' && (
          <button
            onClick={() => toast.success('Click on a class to mark as unavailable')}
            className="btn-secondary"
          >
            Mark Unavailable
          </button>
        )}
      </div>

      {/* Routine Grid */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">Time</th>
              {DAYS.map(day => (
                <th key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(timeSlot => (
              <tr key={timeSlot} className="border-t border-gray-100 dark:border-gray-700">
                <td className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">{timeSlot}</td>
                {DAYS.map(day => {
                  const slot = getSlotContent(day, timeSlot)
                  return (
                    <td key={`${day}-${timeSlot}`} className="p-2">
                      {slot ? (
                        <div
                          className={`p-2 rounded-lg text-center cursor-pointer transition-colors ${slot.status === 'unavailable'
                            ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                            : slot.status === 'swapped'
                              ? 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                              : 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-800/50'
                            }`}
                          onClick={() => {
                            if (role === 'teacher' && slot.teacherId === user?._id) {
                              setSelectedSlot({
                                routineId: slot._id,
                                day,
                                timeSlot,
                                date: new Date().toISOString()
                              })
                              setShowUnavailableModal(true)
                            }
                          }}
                        >
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{slot.subject}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{slot.room}</p>
                          {slot.status === 'unavailable' && (
                            <span className="text-xs text-red-600 dark:text-red-400">Unavailable</span>
                          )}
                          {slot.status === 'swapped' && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">Swapped</span>
                          )}
                        </div>
                      ) : (
                        <div className="h-16"></div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Swap Requests (Teachers only) */}
      {role === 'teacher' && swapRequests.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Available Classes to Take</h2>
          <div className="space-y-3">
            {swapRequests.map(request => (
              <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium">{request.subject}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <HiOutlineClock className="w-4 h-4" />
                      {request.day} • {request.timeSlot}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiOutlineLocationMarker className="w-4 h-4" />
                      {request.room}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => claimSwap(request._id)}
                  className="btn-primary"
                >
                  Take This Class
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Modal */}
      {showUnavailableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Mark as Unavailable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This will notify all teachers in your department that you're unavailable for this class.
              Another teacher can take this class.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnavailableModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={markUnavailable}
                className="btn-danger flex-1"
              >
                Mark Unavailable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Routine
