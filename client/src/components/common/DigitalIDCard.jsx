import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { QRCodeSVG } from 'qrcode.react'

function DigitalIDCard() {
    const { user } = useAuth()
    const [time, setTime] = useState(new Date().toLocaleTimeString())

    useEffect(() => {
        // Timer for the visual clock (updates every second)
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Generate a "Hourly Code" that changes every hour
    // Math.floor(Date.now() / 3600000) creates a unique number for every hour
    const hourCode = Math.floor(Date.now() / 3600000)

    const verifyData = JSON.stringify({
        id: user?._id,
        name: user?.name,
        // This code is stable for 1 hour, then changes automatically
        hourCode: hourCode
    })

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-1 shadow-xl w-full max-w-sm mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute top-0 right-0 opacity-10 text-8xl font-bold text-indigo-600 transform translate-x-4 -translate-y-4">
                    ID
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-inner">
                        {user?.name?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{user?.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                        <p className="text-xs text-gray-400">{user?.department}</p>
                    </div>
                </div>

                <div className="border-t border-dashed pt-4 flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user?._id?.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Batch: {user?.batch || '2024'}</p>
                    </div>

                    {/* Secure QR Code */}
                    <div className="bg-white dark:bg-gray-800 p-1 rounded shadow-sm">
                        <QRCodeSVG value={verifyData} size={64} level="H" />
                    </div>
                </div>

                {/* Live Timer for Security */}
                <div className="mt-4 bg-gray-900 text-green-400 rounded text-center py-1 text-xs font-mono">
                    LIVE: {time} <span className="animate-pulse">●</span>
                </div>
            </div>
        </div>
    )
}

export default DigitalIDCard
