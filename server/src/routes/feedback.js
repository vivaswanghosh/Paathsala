import express from 'express'
import Feedback from '../models/Feedback.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id } from '../middleware/auth.js'

const router = express.Router()

// Submit new feedback (Student)
router.post('/', checkJwt, async (req, res) => {
    try {
        const { title, category, description, isAnonymous } = req.body
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const feedbackData = {
            title,
            category,
            description,
            isAnonymous
        }

        // Only attach student details if not anonymous
        if (!isAnonymous) {
            feedbackData.studentId = user._id
            feedbackData.department = user.department
            feedbackData.batch = user.batch
        }

        const feedback = await Feedback.create(feedbackData)

        // Optional Gamification: Modest XP for submitting feedback helps encourage platform use
        if (!isAnonymous) {
            user.xp = (user.xp || 0) + 2
            await user.save()
        }

        res.status(201).json({ success: true, feedback })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get all feedback (Admin / HOD)
router.get('/', checkJwt, requireRole('admin', 'hod'), async (req, res) => {
    try {
        const { status, category } = req.query
        let query = {}

        if (status) query.status = status
        if (category) query.category = category

        const feedbacks = await Feedback.find(query)
            .populate('studentId', 'name email department batch') // Will be null for anonymous entries
            .sort({ createdAt: -1 })

        res.json({ feedbacks })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update feedback status/notes (Admin)
router.patch('/:id', checkJwt, requireRole('admin', 'hod'), async (req, res) => {
    try {
        const { status, adminNotes } = req.body

        const feedback = await Feedback.findByIdAndUpdate(
            req.params.id,
            {
                status,
                adminNotes,
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('studentId', 'name email')

        if (!feedback) {
            return res.status(404).json({ error: 'Feedback not found' })
        }

        res.json({ feedback })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get own feedback history (Student - non-anonymous only)
router.get('/my-history', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        if (user.role !== 'student') {
            return res.status(403).json({ error: 'Only available for students' })
        }

        const feedbacks = await Feedback.find({ studentId: user._id })
            .sort({ createdAt: -1 })

        res.json({ feedbacks })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
