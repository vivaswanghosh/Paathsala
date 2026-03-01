import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineBell, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi'
import { Link } from 'react-router-dom'

function Notifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications')
            setNotifications(res.data.notifications)
        } catch (err) {
            toast.error('Failed to fetch notifications')
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
        } catch (error) {
            toast.error('Failed to mark as read')
        }
    }

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            toast.success('All marked as read')
        } catch (error) {
            toast.error('Failed to mark all as read')
        }
    }

    const getIconColor = (type) => {
        switch (type) {
            case 'exam': return 'bg-red-100 text-red-600'
            case 'lab': return 'bg-amber-100 text-amber-600'
            case 'placement': return 'bg-purple-100 text-purple-600'
            case 'routine': return 'bg-blue-100 text-blue-600'
            case 'clash': return 'bg-orange-100 text-orange-600'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <HiOutlineBell className="w-8 h-8 text-primary-600" /> Notifications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Stay updated with your latest alerts and messages</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={markAllRead}
                        className="btn bg-primary-50 text-primary-700 hover:bg-primary-100 flex items-center gap-2"
                    >
                        <HiOutlineCheck className="w-5 h-5" /> Mark All Read
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-12 pl-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <HiOutlineBell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No notifications yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">When you get notifications, they'll show up here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-4 sm:p-6 transition-colors hover:bg-gray-50 dark:bg-gray-900 flex items-start gap-4 ${!notification.isRead ? 'bg-primary-50/20' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                                    <HiOutlineBell className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 mb-1">
                                        <h4 className={`text-base truncate ${!notification.isRead ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(notification.createdAt).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>

                                    <div className="flex items-center gap-4 mt-3">
                                        {notification.link && (
                                            <Link
                                                to={notification.link}
                                                className="text-sm font-medium text-primary-600 hover:text-primary-800"
                                            >
                                                View Details &rarr;
                                            </Link>
                                        )}
                                        {!notification.isRead && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {!notification.isRead && (
                                    <div className="w-2.5 h-2.5 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Notifications
