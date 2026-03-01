import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineBriefcase, HiOutlineLocationMarker, HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineUsers } from 'react-icons/hi'

function Jobs() {
    const { role } = useAuth()
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedJob, setSelectedJob] = useState(null)

    // Application form state
    const [resumeLink, setResumeLink] = useState('')
    const [notes, setNotes] = useState('')

    // --- NEW: State for Admin Applicant Modal ---
    const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false)
    const [applicants, setApplicants] = useState([])
    const [loadingApplicants, setLoadingApplicants] = useState(false)

    // New Job formulation state (for TPO/Admin)
    const [newJob, setNewJob] = useState({
        title: '', company: '', type: 'Full-time', location: '', description: '', deadline: ''
    })

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs')
            setJobs(response.data.jobs)
        } catch (error) {
            toast.error('Failed to load jobs')
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async (e) => {
        e.preventDefault()
        try {
            await api.post(`/jobs/${selectedJob._id}/apply`, { resumeLink, notes })
            toast.success('Application submitted successfully!')
            setIsModalOpen(false)
            setResumeLink('')
            setNotes('')
            fetchJobs() // Refresh to update status
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to apply')
        }
    }

    // --- NEW: Function to fetch applicants for a job ---
    const handleViewApplicants = async (jobId) => {
        setSelectedJob(jobs.find(j => j._id === jobId))
        setLoadingApplicants(true)
        setIsApplicantsModalOpen(true)
        try {
            const response = await api.get(`/jobs/${jobId}/applications`)
            setApplicants(response.data.applications)
        } catch (error) {
            toast.error('Failed to load applicants')
        } finally {
            setLoadingApplicants(false)
        }
    }

    // --- NEW: Function to update application status ---
    const handleUpdateStatus = async (appId, status) => {
        try {
            await api.patch(`/jobs/applications/${appId}`, { status })
            toast.success(`Application ${status}`)
            // Update the local state to reflect change immediately
            setApplicants(prev =>
                prev.map(app => app._id === appId ? { ...app, status } : app)
            )
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const handleCreateJob = async (e) => {
        e.preventDefault()
        try {
            await api.post('/jobs', newJob)
            toast.success('Job posted successfully!')
            setNewJob({ title: '', company: '', type: 'Full-time', location: '', description: '', deadline: '' })
            fetchJobs()
        } catch (error) {
            toast.error('Failed to post job')
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Placement & Internships</h1>
                    <p className="text-gray-500 dark:text-gray-400">Explore opportunities and manage applications</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Job List */}
                <div className="lg:col-span-2 space-y-4">
                    {jobs.length === 0 ? (
                        <div className="card text-center py-12">
                            <HiOutlineBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No open positions found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Check back later for new opportunities.</p>
                        </div>
                    ) : (
                        jobs.map(job => (
                            <div key={job._id} className="card hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h3>
                                        <p className="text-primary-600 font-medium">{job.company}</p>
                                    </div>
                                    {role === 'student' && job.hasApplied && (
                                        <span className="badge badge-green">Applied</span>
                                    )}
                                </div>

                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <HiOutlineBriefcase className="w-4 h-4" />
                                        {job.type}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <HiOutlineLocationMarker className="w-4 h-4" />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <HiOutlineClock className="w-4 h-4" />
                                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                                    </div>
                                </div>

                                <p className="mt-4 text-gray-700 dark:text-gray-300 line-clamp-3">{job.description}</p>

                                <div className="mt-6 flex justify-end gap-2">
                                    {/* --- NEW: Admin Button --- */}
                                    {(role === 'tpo' || role === 'admin') && (
                                        <button
                                            onClick={() => handleViewApplicants(job._id)}
                                            className="btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 flex items-center gap-2"
                                        >
                                            <HiOutlineUsers className="w-5 h-5" />
                                            View Applicants
                                        </button>
                                    )}

                                    {role === 'student' && !job.hasApplied && (
                                        <button
                                            onClick={() => { setSelectedJob(job); setIsModalOpen(true); }}
                                            className="btn btn-primary"
                                        >
                                            Apply Now
                                        </button>
                                    )}
                                    {role === 'student' && job.hasApplied && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 italic self-center">Status: {job.applicationStatus || 'Under Review'}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar / TPO Controls */}
                <div className="space-y-6">
                    {(role === 'tpo' || role === 'admin') && (
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-4">Post New Job</h2>
                            <form onSubmit={handleCreateJob} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                                    <input type="text" required value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                                    <input type="text" required value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} className="input" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value })} className="input">
                                            <option>Full-time</option>
                                            <option>Part-time</option>
                                            <option>Internship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                        <input type="text" required value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} className="input" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                                    <input type="date" required value={newJob.deadline} onChange={e => setNewJob({ ...newJob, deadline: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea required rows={4} value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="input"></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-full">Post Job</button>
                            </form>
                        </div>
                    )}

                    <div className="card bg-primary-50 border-none">
                        <h3 className="font-semibold text-primary-900 mb-2">Resume Tips</h3>
                        <ul className="text-sm text-primary-800 space-y-2 list-disc list-inside">
                            <li>Keep it strictly 1 page.</li>
                            <li>Highlight your most complex projects.</li>
                            <li>Quantify achievements (e.g., "Increased performance by 20%").</li>
                            <li>Include a link to your GitHub and live deployments.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Application Modal (Student) */}
            {isModalOpen && selectedJob && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-1">Apply for {selectedJob.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{selectedJob.company}</p>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resume Link (Google Drive / Notion)</label>
                                <input
                                    type="url"
                                    required
                                    value={resumeLink}
                                    onChange={e => setResumeLink(e.target.value)}
                                    className="input"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Letter Notes (Optional)</label>
                                <textarea
                                    rows={4}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="input"
                                    placeholder="Why are you a good fit?"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- NEW: Applicants Modal (Admin) --- */}
            {isApplicantsModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold">Applicants</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedJob?.title} at {selectedJob?.company}</p>
                            </div>
                            <button onClick={() => setIsApplicantsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-2xl">&times;</button>
                        </div>

                        {loadingApplicants ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : applicants.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No applications yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {applicants.map(app => (
                                    <div key={app._id} className="border rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{app.studentId?.name || 'Unknown'}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{app.studentId?.email} • {app.studentId?.department}</p>
                                            <div className="mt-2 flex gap-2">
                                                <a href={app.resumeLink} target="_blank" rel="noreferrer" className="text-primary-600 text-sm hover:underline">View Resume</a>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-xs text-gray-400">Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`badge ${app.status === 'Shortlisted' ? 'badge-green' : app.status === 'Rejected' ? 'badge-red' : 'badge-gray'}`}>
                                                {app.status}
                                            </span>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleUpdateStatus(app._id, 'Shortlisted')} className="btn-xs bg-green-100 text-green-700 hover:bg-green-200">Shortlist</button>
                                                <button onClick={() => handleUpdateStatus(app._id, 'Rejected')} className="btn-xs bg-red-100 text-red-700 hover:bg-red-200">Reject</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Jobs
