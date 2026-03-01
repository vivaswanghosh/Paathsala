import express from 'express'
import Job from '../models/Job.js'
import JobApplication from '../models/JobApplication.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'
import { createAndSendNotification } from '../services/notificationService.js'

const router = express.Router()

// Get all jobs (Students see open, TPO/Admin see all)
router.get('/', checkJwt, async (req, res) => {
    try {
        const role = getRole(req)
        let query = {}

        if (role === 'student') {
            query.status = 'Open'
            // Could further filter by eligibility here based on user's batch/cgpa
        }

        const jobs = await Job.find(query)
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 })
            .lean()

        // If student, attach their application status
        if (role === 'student') {
            const auth0Id = getAuth0Id(req)
            const user = await User.findOne({ auth0Id })

            for (const job of jobs) {
                const application = await JobApplication.findOne({
                    jobId: job._id,
                    studentId: user._id
                })
                job.hasApplied = !!application
                job.applicationStatus = application?.status
            }
        }

        res.json({ jobs })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create a new job posting (TPO/Admin)
router.post('/', checkJwt, requireRole('tpo', 'admin'), async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const job = await Job.create({
            ...req.body,
            postedBy: user._id
        })

        // Notify all students
        const students = await User.find({ role: 'student' })
        const notifications = students.map(student =>
            createAndSendNotification(req.app, student._id, {
                title: 'New Placement Drive',
                message: `${job.company} is hiring for ${job.title}`,
                type: 'placement'
            })
        )
        await Promise.all(notifications)

        res.status(201).json({ job })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Apply for a job (Student)
router.post('/:id/apply', checkJwt, async (req, res) => {
    try {
        const { resumeLink, notes } = req.body
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        if (user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can apply' })
        }

        const job = await Job.findById(req.params.id)
        if (!job || job.status !== 'Open') {
            return res.status(400).json({ error: 'Job is not available' })
        }

        const existingApp = await JobApplication.findOne({
            jobId: job._id,
            studentId: user._id
        })

        if (existingApp) {
            return res.status(400).json({ error: 'Already applied for this job' })
        }

        const application = await JobApplication.create({
            jobId: job._id,
            studentId: user._id,
            resumeLink,
            notes
        })

        res.status(201).json({ success: true, application })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get applications for a specific job (TPO/Admin)
router.get('/:id/applications', checkJwt, requireRole('tpo', 'admin'), async (req, res) => {
    try {
        const applications = await JobApplication.find({ jobId: req.params.id })
            .populate('studentId', 'name email department batch xp')
            .sort({ appliedAt: -1 })

        res.json({ applications })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Update application status (TPO/Admin)
router.patch('/applications/:appId', checkJwt, requireRole('tpo', 'admin'), async (req, res) => {
    try {
        const { status } = req.body

        const application = await JobApplication.findByIdAndUpdate(
            req.params.appId,
            { status, updatedAt: Date.now() },
            { new: true }
        )

        if (!application) {
            return res.status(404).json({ error: 'Application not found' })
        }

        res.json({ application })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
