import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext.jsx'
import { HiOutlineBell, HiOutlineCheck } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../utils/api.js'

function NotificationBell() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (!user?._id) return;

        // Fetch initial persistent notifications from backend
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/notifications')
                setNotifications(response.data.notifications)
                setUnreadCount(response.data.notifications.filter(n => !n.isRead).length)
            } catch (error) {
                console.error('Failed to load notifications', error)
            }
        }
        fetchNotifications()

        // Initialize Socket Connection
        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        })

        socket.on('connect', () => {
            socket.emit('register', user._id)
        })

        socket.on('new_notification', (data) => {
            setNotifications(prev => [data, ...prev])
            setUnreadCount(prev => prev + 1)
            toast(data.title, {
                icon: '🔔',
                style: { borderRadius: '10px', background: '#333', color: '#fff' },
            })
        })

        return () => {
            socket.disconnect()
        }
    }, [user?._id])

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Failed to mark notification as read', error)
        }
    }

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all')
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Failed to mark all as read', error)
        }
    }

    const getIconColor = (type) => {
        switch (type) {
            case 'exam': return 'bg-red-100 text-red-600'
            case 'lab': return 'bg-amber-100 text-amber-600'
            case 'placement': return 'bg-purple-100 text-purple-600'
            case 'routine': return 'bg-blue-100 text-blue-600'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:bg-gray-800 transition-colors relative"
            >
                <span className="sr-only">View notifications</span>
                <HiOutlineBell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden origin-top-right transform transition-all">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                                <HiOutlineCheck className="w-4 h-4" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                You're all caught up!
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-gray-50 dark:bg-gray-900 transition-colors ${!notification.isRead ? 'bg-primary-50/30' : ''}`}
                                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-0.5 w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center ${getIconColor(notification.type)}`}>
                                                <HiOutlineBell className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{notification.message}</p>
                                                {notification.link && (
                                                    <Link to={notification.link} className="mt-2 inline-block text-xs font-medium text-primary-600 hover:text-primary-800">
                                                        View details &rarr;
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                        <Link
                            to="/app/notifications"
                            className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center justify-center gap-1"
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications &rarr;
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell
