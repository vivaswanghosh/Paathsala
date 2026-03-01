import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineCode, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi'

function Labs() {
  const { role } = useAuth()
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLabs()
  }, [])

  const fetchLabs = async () => {
    try {
      const response = await api.get('/lab')
      setLabs(response.data.labs || [])
    } catch (error) {
      toast.error('Failed to load labs')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lab Assignments</h1>
        {(role === 'teacher' || role === 'admin') && (
          <Link to="/app/labs/create" className="btn-primary">
            Create Lab
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map(lab => (
          <div key={lab._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="badge badge-blue">{lab.language}</span>
              {lab.submitted ? (
                <span className="badge badge-green">Completed</span>
              ) : lab.dueDate && new Date(lab.dueDate) < new Date() ? (
                <span className="badge badge-red">Overdue</span>
              ) : (
                <span className="badge badge-yellow">Pending</span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{lab.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{lab.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <HiOutlineClock className="w-4 h-4" />
                Due: {new Date(lab.dueDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineCheckCircle className="w-4 h-4" />
                {lab.points} pts
              </span>
            </div>

            {lab.submitted && (
              <div className="mb-4 p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Score: {lab.score}/{lab.totalPoints}
                </p>
              </div>
            )}
            
            <Link
              to={`/app/labs/${lab._id}`}
              className="btn-primary w-full text-center block"
            >
              {lab.submitted ? 'View Submission' : 'Start Lab'}
            </Link>
          </div>
        ))}
      </div>

      {labs.length === 0 && (
        <div className="text-center py-12">
          <HiOutlineCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No lab assignments available</p>
        </div>
      )}
    </div>
  )
}

export default Labs
