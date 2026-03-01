import Notification from '../models/Notification.js'

// Helper to push a notification both to DB and live via Socket.io
export const createAndSendNotification = async (app, userId, notificationData) => {
    try {
        // 1. Create the persistent database record
        const notification = await Notification.create({
            userId,
            ...notificationData
        })

        // 2. Check if the user is currently connected via Socket.io
        const io = app.get('io')
        const userSockets = app.get('userSockets')

        if (io && userSockets) {
            // Find all sockets for this user (they might be logged in on multiple tabs)
            const socketId = userSockets.get(userId.toString())
            if (socketId) {
                io.to(socketId).emit('new_notification', notification)
            }
        }

        return notification
    } catch (error) {
        console.error('Failed to send notification via service:', error)
        return null
    }
}
