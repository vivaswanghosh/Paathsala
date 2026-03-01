import express from 'express'
import Event from '../models/Event.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'

const router = express.Router()

// Get all events
router.get('/', checkJwt, async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 }).populate('createdBy', 'name')
        res.json({ events })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create event (Admin/Teacher)
router.post('/', checkJwt, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const event = await Event.create({
            ...req.body,
            createdBy: user._id
        })
        res.status(201).json(event)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Register for event
router.post('/:id/register', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const event = await Event.findById(req.params.id)
        if (!event) return res.status(404).json({ error: 'Event not found' })

        const alreadyRegistered = event.registrants.find(r => r.user.toString() === user._id.toString())
        if (alreadyRegistered) return res.status(400).json({ error: 'Already registered' })

        event.registrants.push({ user: user._id, status: 'registered' })
        await event.save()

        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Mark Attendance (Admin/Teacher)
router.post('/:id/attend/:userId', checkJwt, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
        if (!event) return res.status(404).json({ error: 'Event not found' })

        const registrant = event.registrants.find(r => r.user.toString() === req.params.userId)
        if (!registrant) return res.status(404).json({ error: 'Registrant not found' })

        registrant.status = 'attended'
        await event.save()

        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get My Certificates (Student)
router.get('/my-certificates', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const events = await Event.find({
            'registrants': {
                $elemMatch: { user: user._id, status: 'attended' }
            }
        }).populate('createdBy', 'name')

        // Filter registrants to only show current user's status
        const certificates = events.map(e => ({
            _id: e._id,
            title: e.title,
            date: e.date,
            organizer: e.createdBy?.name,
            status: e.registrants.find(r => r.user.toString() === user._id.toString())?.status
        }))

        res.json({ certificates })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
