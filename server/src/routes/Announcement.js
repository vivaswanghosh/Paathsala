import express from 'express'
import Announcement from '../models/Announcement.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

// Get Announcements (Public to logged in users)
router.get('/', checkJwt, async (req, res) => {
    try {
        const role = getRole(req)
        // Fetch announcements meant for 'all' or specific user role
        const filter = role === 'admin' ? {} : { $or: [{ targetRole: 'all' }, { targetRole: role }] }

        const announcements = await Announcement.find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('createdBy', 'name')
            .lean()

        res.json(announcements)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create Announcement (Admin/Teacher only)
router.post('/', checkJwt, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const announcement = await Announcement.create({
            ...req.body,
            createdBy: user._id
        })

        res.status(201).json(announcement)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
