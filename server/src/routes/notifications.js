import express from 'express'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { checkJwt, getAuth0Id } from '../middleware/auth.js'

const router = express.Router()

// Helper to send notification (can be used by other services)
export const sendNotification = async (io, userId, notificationData) => {
    const notification = await Notification.create({
        userId,
        ...notificationData
    })

    // Emit real-time event
    const userSockets = io.get('userSockets')
    const socketId = userSockets.get(String(userId))

    if (socketId) {
        io.to(socketId).emit('new_notification', notification)
    }

    return notification
}

router.get('/', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const notifications = await Notification.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(50)

        res.json({ notifications })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.post('/', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })
        const io = req.app.get('io')

        const notification = await sendNotification(io, user._id, req.body)
        res.json({ notification })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch('/:id/read', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { $set: { isRead: true } },
            { new: true }
        )

        res.json({ notification })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
