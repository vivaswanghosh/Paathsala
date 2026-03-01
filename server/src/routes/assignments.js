import express from 'express'
import multer from 'multer'
import path from 'path'
import Assignment from '../models/Assignment.js'
import AssignmentSubmission from '../models/AssignmentSubmission.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'

const router = express.Router()

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/assignments/') // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        if (extname) return cb(null, true)
        cb('Error: Only documents, images, or zip files are allowed!')
    }
})

// Get all assignments for student/teacher
router.get('/', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })
        const role = getRole(req)

        let query = {}
        if (role === 'student') {
            query = { department: user.department }
        }

        const assignments = await Assignment.find(query)
            .sort({ dueDate: 1 })
            .populate('createdBy', 'name')
            .lean()

        // Attach submission status for students
        if (role === 'student') {
            for (const assignment of assignments) {
                const submission = await AssignmentSubmission.findOne({
                    assignmentId: assignment._id,
                    studentId: user._id
                })
                assignment.submission = submission
            }
        }

        res.json({ assignments })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Create new assignment (Teacher/Admin)
router.post('/', checkJwt, requireRole('teacher', 'admin'), upload.single('file'), async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const assignment = await Assignment.create({
            ...req.body,
            fileUrl: req.file ? `/uploads/assignments/${req.file.filename}` : null,
            createdBy: user._id
        })

        res.json({ assignment })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Submit assignment (Student)
router.post('/:id/submit', checkJwt, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })
        const { comments } = req.body

        const existingSubmission = await AssignmentSubmission.findOne({
            assignmentId: req.params.id,
            studentId: user._id
        })

        if (existingSubmission) {
            return res.status(400).json({ error: 'Assignment already submitted' })
        }

        const submission = await AssignmentSubmission.create({
            assignmentId: req.params.id,
            studentId: user._id,
            fileUrl: `/uploads/assignments/${req.file.filename}`,
            comments
        })

        res.json({ submission })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Grade submission (Teacher)
router.post('/submissions/:id/grade', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { grade, feedback } = req.body

        const submission = await AssignmentSubmission.findByIdAndUpdate(
            req.params.id,
            { grade, feedback },
            { new: true }
        )

        res.json({ submission })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
