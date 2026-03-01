import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineChatAlt2, HiOutlineLockClosed, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi'

function Feedback() {
    const { user, role } = useAuth()
    const [feedbacks, setFeedbacks] = useState([])
    const [loading, setLoading] = useState(true)

    // Student Form State
    const [newFeedback, setNewFeedback] = useState({
        title: '', category: 'Academic', description: '', isAnonymous: false
    })

    useEffect(() => {
        fetchFeedbacks()
    }, [role])

    const fetchFeedbacks = async () => {
        try {
            setLoading(true)
            const endpoint = role === 'student' ? '/feedback/my-history' : '/feedback'
            const response = await api.get(endpoint)
            setFeedbacks(response.data.feedbacks || [])
        } catch (error) {
            toast.error('Failed to load feedback data')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.post('/feedback', newFeedback)
            toast.success('Feedback submitted successfully!')
            setNewFeedback({ title: '', category: 'Academic', description: '', isAnonymous: false })
            fetchFeedbacks()
        } catch (error) {
            toast.error('Failed to submit feedback')
        }
    }

    const handleUpdateStatus = async (id, status, notes) => {
        try {
            await api.patch(`/feedback/${id}`, { status, adminNotes: notes })
            toast.success('Status updated')
            fetchFeedbacks()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            case 'In Progress': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
            case 'Resolved':
            case 'Closed': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Grievance & Feedback Cell</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {role === 'student' ? 'Submit concerns or suggestions anonymously.' : 'Review and resolve student feedback.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Student Submission Form */}
                {role === 'student' && (
                    <div className="card lg:col-span-1 h-fit bg-gradient-to-br from-white to-gray-50 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <HiOutlineChatAlt2 className="w-5 h-5 text-primary-600" />
                            New Submission
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input required type="text" value={newFeedback.title} onChange={e => setNewFeedback({ ...newFeedback, title: e.target.value })} className="input" placeholder="Brief summary" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                <select value={newFeedback.category} onChange={e => setNewFeedback({ ...newFeedback, category: e.target.value })} className="input">
                                    <option>Academic</option>
                                    <option>Infrastructure</option>
                                    <option>Hostel</option>
                                    <option>Canteen</option>
                                    <option>Library</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label>
                                <textarea required rows={5} value={newFeedback.description} onChange={e => setNewFeedback({ ...newFeedback, description: e.target.value })} className="input" placeholder="Explain your concern..."></textarea>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <input
                                    type="checkbox"
                                    id="anonymous"
                                    checked={newFeedback.isAnonymous}
                                    onChange={e => setNewFeedback({ ...newFeedback, isAnonymous: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded"
                                />
                                <label htmlFor="anonymous" className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1 cursor-pointer">
                                    <HiOutlineLockClosed className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    Submit Anonymously
                                </label>
                            </div>
                            {!newFeedback.isAnonymous && <p className="text-xs text-gray-500 dark:text-gray-400 italic px-1">Non-anonymous feedback rewards +2 XP.</p>}

                            <button type="submit" className="btn btn-primary w-full shadow-md hover:shadow-lg transition-all">Submit Feedback</button>
                        </form>
                    </div>
                )}

                {/* History / Review List */}
                <div className={`space-y-4 ${role === 'student' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {role === 'student' ? 'My Feedback History' : 'Student Submissions'}
                    </h2>

                    {feedbacks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <HiOutlineExclamationCircle className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No records found</p>
                            <p className="text-sm text-gray-400 mt-1">If you have a concern, please submit it.</p>
                        </div>
                    ) : (
                        feedbacks.map(item => (
                            <div key={item._id} className="card hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{item.category}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                                {item.isAnonymous && <span className="text-xs bg-gray-800 dark:bg-gray-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1"><HiOutlineLockClosed /> Anonymous</span>}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{item.title}</h3>
                                        </div>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-300 mt-3 text-sm">{item.description}</p>

                                    {item.adminNotes && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-700 text-sm text-blue-900 dark:text-blue-100 rounded-r-md">
                                            <strong>Admin Response:</strong> {item.adminNotes}
                                        </div>
                                    )}

                                    <div className="mt-4 text-xs text-gray-400">
                                        Submitted: {new Date(item.createdAt).toLocaleString()}
                                        {(role === 'admin' || role === 'hod') && !item.isAnonymous && item.studentId && (
                                            <span className="ml-4 text-gray-600 dark:text-gray-400">By: {item.studentId.name} ({item.studentId.department}, {item.studentId.email})</span>
                                        )}
                                    </div>
                                </div>

                                {/* Admin Actions */}
                                {(role === 'admin' || role === 'hod') && (
                                    <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-4 flex flex-col justify-end">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Update Status</label>
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleUpdateStatus(item._id, e.target.value, item.adminNotes)}
                                                className="input text-sm py-1"
                                            >
                                                <option>Open</option>
                                                <option>In Progress</option>
                                                <option>Resolved</option>
                                                <option>Closed</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Feedback
