import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

function AssignmentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [assignment, setAssignment] = useState(null)
    const [file, setFile] = useState(null)
    const [comments, setComments] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchAssignment()
    }, [id])

    const fetchAssignment = async () => {
        try {
            // Assuming we have a GET /assignments/:id endpoint, otherwise use the list
            const res = await api.get('/assignments')
            const found = res.data.assignments.find(a => a._id === id)
            setAssignment(found)
        } catch (error) {
            toast.error('Failed to load assignment')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!file) return toast.error('Please select a file')

        setSubmitting(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('comments', comments)

        try {
            await api.post(`/assignments/${id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Assignment submitted successfully!')
            navigate('/app/assignments')
        } catch (error) {
            toast.error(error.response?.data?.error || 'Submission failed')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="text-center py-10">Loading...</div>
    if (!assignment) return <div className="text-center py-10">Assignment not found</div>

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="card">
                <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{assignment.description}</p>

                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                    <span>Points: {assignment.points}</span>
                </div>

                {assignment.fileUrl && (
                    <a href={`${process.env.VITE_API_URL?.replace('/api', '')}${assignment.fileUrl}`} target="_blank" rel="noreferrer" className="text-primary-600 underline">
                        Download Teacher's Attachment
                    </a>
                )}
            </div>

            {assignment.submission ? (
                <div className="card bg-green-50 border-green-200">
                    <h3 className="font-bold text-green-800 mb-2">Already Submitted</h3>
                    <p className="text-sm text-green-700">File: {assignment.submission.fileUrl.split('/').pop()}</p>
                    <p className="text-sm text-green-700">Grade: {assignment.submission.grade || 'Pending'}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Upload File (PDF, DOC, ZIP)</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="input border p-2 w-full"
                            accept=".pdf,.doc,.docx,.zip,.jpg,.png"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Comments (Optional)</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="input"
                            rows={3}
                        />
                    </div>
                    <button type="submit" disabled={submitting} className="btn-primary w-full">
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                </form>
            )}
        </div>
    )
}

export default AssignmentDetail
