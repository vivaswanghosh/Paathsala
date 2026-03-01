import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineCalendar, HiOutlineTicket, HiOutlineDownload } from 'react-icons/hi'
import jsPDF from 'jspdf'

function Events() {
    const { user, role } = useAuth()
    const [events, setEvents] = useState([])
    const [certificates, setCertificates] = useState([])

    useEffect(() => {
        fetchEvents()
        fetchCertificates()
    }, [])

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events')
            setEvents(res.data.events)
        } catch (err) {
            toast.error('Failed to fetch events')
        }
    }

    const fetchCertificates = async () => {
        try {
            const res = await api.get('/events/my-certificates')
            setCertificates(res.data.certificates)
        } catch (err) {
            console.error(err)
        }
    }

    const handleRegister = async (eventId) => {
        try {
            await api.post(`/events/${eventId}/register`)
            toast.success('Registered successfully!')
            fetchEvents()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed')
        }
    }

    const generateCertificate = (event) => {
        const doc = new jsPDF('landscape')

        // Border
        doc.setDrawColor(22, 78, 99)
        doc.setLineWidth(5)
        doc.rect(5, 5, 287, 200)

        // Title
        doc.setFontSize(40)
        doc.setTextColor(22, 78, 99)
        doc.text('Certificate of Participation', 148.5, 50, { align: 'center' })

        // Content
        doc.setFontSize(20)
        doc.setTextColor(0, 0, 0)
        doc.text('This is to certify that', 148.5, 80, { align: 'center' })

        // User Name
        doc.setFontSize(35)
        doc.setTextColor(59, 130, 246)
        doc.text(user.name, 148.5, 100, { align: 'center' })

        // Event Details
        doc.setFontSize(18)
        doc.setTextColor(0, 0, 0)
        doc.text(`Successfully participated in ${event.title}`, 148.5, 120, { align: 'center' })
        doc.text(`held on ${new Date(event.date).toLocaleDateString()}`, 148.5, 135, { align: 'center' })

        // Date
        doc.setFontSize(12)
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 190)

        // Save
        doc.save(`Certificate_${event.title}.pdf`)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Events & Workshops</h1>

            {/* My Certificates Section */}
            {certificates.length > 0 && (
                <div className="card bg-green-50 border-green-200">
                    <h3 className="font-bold text-green-800 mb-3">My Certificates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {certificates.map(cert => (
                            <div key={cert._id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded border">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{cert.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Attended on {new Date(cert.date).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => generateCertificate(cert)}
                                    className="btn bg-green-600 text-white text-xs flex items-center gap-1"
                                >
                                    <HiOutlineDownload className="w-4 h-4" /> Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {events.map(event => {
                    const isRegistered = event.registrants.some(r => r.user?._id === user._id)
                    const isAttended = event.registrants.some(r => r.user?._id === user._id && r.status === 'attended')

                    return (
                        <div key={event._id} className="card hover:shadow-md transition-shadow">
                            <div className="flex justify-between mb-2">
                                <span className="badge badge-blue capitalize">{event.category}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{event.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{event.description}</p>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                <HiOutlineCalendar className="w-4 h-4" />
                                {event.location || 'Online'}
                            </div>

                            {isAttended ? (
                                <div className="btn bg-green-100 text-green-700 w-full text-center cursor-default">
                                    ✓ Attended
                                </div>
                            ) : isRegistered ? (
                                <div className="btn bg-blue-100 text-blue-700 w-full text-center cursor-default">
                                    Registered
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleRegister(event._id)}
                                    className="btn-primary w-full"
                                >
                                    Register Now
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Events
