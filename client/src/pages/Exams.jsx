import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineClock, HiOutlineDocumentText, HiOutlinePlay } from 'react-icons/hi'

function Exams() {
  const { role } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const response = await api.get('/exam')
      setExams(response.data.exams || [])
    } catch (error) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  // NEW: Function to handle starting exam early
  const handleStartEarly = async (examId) => {
    if (!window.confirm('Are you sure you want to start this exam now? This will make it visible to all students immediately.')) return

    try {
      await api.patch(`/exam/${examId}/status`, { status: 'live' })
      toast.success('Exam started successfully!')
      fetchExams() // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start exam')
    }
  }

  const getExamStatus = (exam) => {
    // 1. Manual Override (Teacher Started Early)
    if (exam.status === 'live') return { label: 'Live Now', color: 'green' }
    if (exam.status === 'ended') return { label: 'Ended', color: 'gray' }

    // 2. Student Submission Status
    if (exam.attempt?.status === 'submitted') return { label: 'Completed', color: 'green' }
    if (exam.attempt?.status === 'auto_submitted') return { label: 'Auto-Submitted', color: 'red' }

    // 3. Time Based Logic (Default)
    const now = new Date()
    const start = new Date(exam.startTime)
    const end = new Date(exam.endTime)

    if (now < start) return { label: 'Upcoming', color: 'blue' }
    if (now >= start && now <= end) return { label: 'Available', color: 'yellow' }
    return { label: 'Ended', color: 'gray' }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Examinations</h1>
        {(role === 'teacher' || role === 'admin') && (
          <Link to="/app/exams/create" className="btn-primary">
            Create Exam
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(exam => {
          const status = getExamStatus(exam)
          return (
            <div key={exam._id} className="card">
              <div className="flex items-start justify-between mb-3">
                <span className="badge badge-blue">{exam.subject}</span>
                <span className={`badge badge-${status.color}`}>{status.label}</span>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{exam.title}</h3>

              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <HiOutlineClock className="w-4 h-4" />
                  <span>
                    {new Date(exam.startTime).toLocaleString()} - {new Date(exam.endTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span>{exam.totalQuestions} questions • {exam.duration} mins</span>
                </div>
              </div>

              {exam.attempt?.score !== undefined && (
                <div className="mb-4 p-2 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    Score: {exam.attempt.score}/{exam.totalPoints} ({exam.attempt.percentage}%)
                  </p>
                </div>
              )}

              {/* Student Actions */}
              {(status.label === 'Available' || status.label === 'Live Now') && !exam.attempt && (
                <Link
                  to={`/app/exams/${exam._id}`}
                  className="btn-primary w-full text-center block"
                >
                  Start Exam
                </Link>
              )}

              {status.label === 'Completed' && (
                <Link
                  to={`/app/exams/${exam._id}/result`}
                  className="btn-secondary w-full text-center block"
                >
                  View Result
                </Link>
              )}

              {status.label === 'Auto-Submitted' && exam.attempt?.requiresReapproval && (
                <div className="p-2 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                  Auto-submitted. Contact admin for re-approval.
                </div>
              )}

              {/* --- NEW: Teacher Actions --- */}
              {(role === 'teacher' || role === 'admin') && status.label === 'Upcoming' && exam.status !== 'live' && (
                <button
                  onClick={() => handleStartEarly(exam._id)}
                  className="btn bg-green-600 hover:bg-green-700 text-white w-full mt-2 flex items-center justify-center gap-2"
                >
                  <HiOutlinePlay className="w-5 h-5" />
                  Start Exam Now
                </button>
              )}
            </div>
          )
        })}
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12">
          <HiOutlineDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No exams scheduled</p>
        </div>
      )}
    </div>
  )
}

export default Exams
