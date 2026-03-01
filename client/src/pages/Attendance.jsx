import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { HiOutlineQrcode, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

function Attendance() {
    const { user, role } = useAuth()

    // Teacher State
    const [activeSessions, setActiveSessions] = useState([])
    const [newSession, setNewSession] = useState({ subject: '', department: user?.department || '', batch: user?.batch || 2024, validMinutes: 10 })
    const [sessionRecords, setSessionRecords] = useState([])
    const [viewingSession, setViewingSession] = useState(null)

    // Student State
    const [isScanning, setIsScanning] = useState(false)
    const [recentAttendance, setRecentAttendance] = useState(null)
    const [stats, setStats] = useState(null)

    useEffect(() => {
        if (role === 'teacher' || role === 'admin') {
            fetchSessions()
        } else if (role === 'student') {
            fetchStats()
        }
    }, [role])

    const fetchStats = async () => {
        try {
            const res = await api.get('/attendance/stats')
            setStats(res.data)
        } catch (error) {
            console.error('Failed to fetch attendance stats', error)
        }
    }

    const fetchSessions = async () => {
        try {
            const response = await api.get('/attendance/session/active')
            setActiveSessions(response.data.sessions)
        } catch (error) {
            toast.error('Failed to load active sessions')
        }
    }

    const handleCreateSession = async (e) => {
        e.preventDefault()
        try {
            await api.post('/attendance/session', newSession)
            toast.success('Session created!')
            setNewSession({ ...newSession, subject: '' })
            fetchSessions()
        } catch (error) {
            toast.error('Failed to create session')
        }
    }

    const handleCloseSession = async (id) => {
        try {
            await api.post(`/attendance/session/${id}/close`)
            toast.success('Session closed')
            fetchSessions()
        } catch (error) {
            toast.error('Failed to close session')
        }
    }

    const handleScan = async (text) => {
        if (!text) return
        setIsScanning(false)

        // Attempt to get geolocation
        let location = null
        if ('geolocation' in navigator) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject)
                })
                location = { latitude: position.coords.latitude, longitude: position.coords.longitude }
            } catch (err) {
                console.warn('Geolocation failed or denied')
            }
        }

        try {
            const response = await api.post('/attendance/mark', { qrToken: text, location })
            setRecentAttendance(response.data.record)
            toast.success(`Attendance marked! +${response.data.xpGained} XP`)
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to mark attendance')
        }
    }

    // Teacher View
    if (role === 'teacher' || role === 'admin') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Smart Attendance</h1>
                    <p className="text-gray-500 dark:text-gray-400">Generate QR codes for dynamic secure roll calling</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="card lg:col-span-1 h-fit">
                        <h2 className="text-lg font-semibold mb-4 text-primary-900">Start New Session</h2>
                        <form onSubmit={handleCreateSession} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                <input required type="text" value={newSession.subject} onChange={e => setNewSession({ ...newSession, subject: e.target.value })} className="input" placeholder="e.g. Data Structures" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                    <input required type="text" value={newSession.department} onChange={e => setNewSession({ ...newSession, department: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch</label>
                                    <input required type="number" value={newSession.batch} onChange={e => setNewSession({ ...newSession, batch: e.target.value })} className="input" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid For (Minutes)</label>
                                <input required type="number" min="1" max="60" value={newSession.validMinutes} onChange={e => setNewSession({ ...newSession, validMinutes: e.target.value })} className="input" />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">Generate QR Code</button>
                        </form>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Sessions</h2>
                        {activeSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                <HiOutlineQrcode className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">No active attendance sessions</p>
                            </div>
                        ) : (
                            activeSessions.map(session => (
                                <div key={session._id} className="card flex flex-col md:flex-row gap-6 items-center">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <QRCodeSVG value={session.qrCode} size={200} />
                                    </div>
                                    <div className="flex-1 w-full space-y-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{session.subject}</h3>
                                            <p className="text-gray-500 dark:text-gray-400">{session.department} • Batch {session.batch}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md font-medium">
                                            <HiOutlineClock className="w-5 h-5" />
                                            Expires: {new Date(session.expiresAt).toLocaleTimeString()}
                                        </div>
                                        <div className="pt-2 flex gap-3">
                                            <button onClick={() => handleCloseSession(session._id)} className="btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex-1 hover:bg-gray-200">
                                                Close Session
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Student View
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: QR Scanner */}
                <div className="space-y-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mark Attendance</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Scan the QR code displayed by your teacher</p>
                    </div>

                    {!isScanning && !recentAttendance && (
                        <button
                            onClick={() => setIsScanning(true)}
                            className="w-full flex flex-col items-center justify-center p-12 bg-primary-50 rounded-2xl border-2 border-dashed border-primary-200 hover:bg-primary-100 transition-colors cursor-pointer"
                        >
                            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mb-4 text-white shadow-lg">
                                <HiOutlineQrcode className="w-10 h-10" />
                            </div>
                            <span className="font-semibold text-primary-900 text-lg">Tap to Scan QR Code</span>
                        </button>
                    )}

                    {isScanning && (
                        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-black relative">
                            <Scanner
                                onResult={handleScan}
                                onError={(e) => console.log(e)}
                                components={{
                                    audio: false,
                                    onOff: false,
                                    torch: false,
                                    zoom: false,
                                    finder: true,
                                }}
                            />
                            <button
                                onClick={() => setIsScanning(false)}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 py-2 px-6 bg-white dark:bg-gray-800/90 backdrop-blur text-gray-900 dark:text-gray-100 font-medium rounded-full shadow-lg"
                            >
                                Cancel Scan
                            </button>
                        </div>
                    )}

                    {recentAttendance && (
                        <div className="card text-center py-10 border-green-100 bg-green-50/30">
                            <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                <HiOutlineCheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Attendance Marked!</h2>
                            <p className="text-gray-600 dark:text-gray-400">You have been marked present.</p>
                            <div className="mt-6 font-medium text-primary-600 bg-primary-50 inline-block px-4 py-2 rounded-full">
                                +5 XP
                            </div>
                            <button
                                onClick={() => {
                                    setRecentAttendance(null);
                                    fetchStats(); // Refresh stats
                                }}
                                className="mt-8 text-gray-500 dark:text-gray-400 underline text-sm block mx-auto"
                            >
                                Scan another code
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Analytics */}
                <div className="space-y-6">
                    {stats && (
                        <>
                            <div className="card text-center">
                                <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">Total Attendance</h2>
                                <div className={`text-4xl font-bold ${stats.overallPercentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                    {stats.overallPercentage}%
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{stats.totalAttended} / {stats.totalSessions} Classes</p>
                            </div>

                            {stats.subjectStats.length > 0 && (
                                <div className="card">
                                    <h3 className="text-md font-semibold mb-4">Subject-wise Attendance</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.subjectStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                                <XAxis type="number" domain={[0, 100]} />
                                                <YAxis dataKey="subject" type="category" width={80} tick={{ fontSize: 12 }} />
                                                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                                                    {stats.subjectStats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.percentage < 75 ? '#ef4444' : '#10b981'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {stats.subjectStats.some(s => s.percentage < 75) && (
                                        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                            <span>⚠️</span> Warning: You have subjects below 75% attendance.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Attendance
