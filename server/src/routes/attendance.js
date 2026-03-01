import express from 'express'
import crypto from 'crypto'
import AttendanceSession from '../models/AttendanceSession.js'
import AttendanceRecord from '../models/AttendanceRecord.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'

const router = express.Router()

// Teacher creates a new attendance session
router.post('/session', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const { subject, department, batch, validMinutes = 10 } = req.body
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        // Generate secure random token for QR code
        const qrToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + validMinutes * 60000)

        const session = await AttendanceSession.create({
            teacherId: user._id,
            subject,
            department,
            batch,
            qrCode: qrToken,
            expiresAt
        })

        res.status(201).json({ session })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Teacher gets active sessions
router.get('/session/active', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        // Auto-close expired sessions
        await AttendanceSession.updateMany(
            { teacherId: user._id, isActive: true, expiresAt: { $lt: new Date() } },
            { $set: { isActive: false } }
        )

        const sessions = await AttendanceSession.find({
            teacherId: user._id,
            isActive: true
        }).sort({ createdAt: -1 })

        res.json({ sessions })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Teacher closes a session manually
router.post('/session/:id/close', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const session = await AttendanceSession.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        )
        res.json({ session })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Teacher gets attendance records for a session
router.get('/session/:id/records', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const records = await AttendanceRecord.find({ sessionId: req.params.id })
            .populate('studentId', 'name email')
            .sort({ timestamp: -1 })
        res.json({ records })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Student marks attendance via scanned QR token
router.post('/mark', checkJwt, async (req, res) => {
    try {
        const { qrToken, location } = req.body
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        if (user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can mark attendance' })
        }

        const session = await AttendanceSession.findOne({
            qrCode: qrToken,
            isActive: true,
            expiresAt: { $gt: new Date() }
        })

        if (!session) {
            return res.status(400).json({ error: 'Invalid or expired QR code' })
        }

        if (session.department !== user.department || session.batch !== user.batch) {
            return res.status(403).json({ error: 'You do not belong to this class batch' })
        }

        const existingRecord = await AttendanceRecord.findOne({
            sessionId: session._id,
            studentId: user._id
        })

        if (existingRecord) {
            return res.status(400).json({ error: 'Attendance already marked' })
        }

        const record = await AttendanceRecord.create({
            sessionId: session._id,
            studentId: user._id,
            locationData: location
        })

        // Gamification
        user.xp = (user.xp || 0) + 5 // +5 XP for attending class
        await user.save()

        res.json({ success: true, record, xpGained: 5 })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Student gets their attendance stats
router.get('/stats', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        if (user.role !== 'student') {
            return res.status(403).json({ error: 'Only students can view their attendance stats' })
        }

        // 1. Get all sessions for the student's department and batch
        const allSessions = await AttendanceSession.find({
            department: user.department,
            batch: user.batch
        })

        // 2. Get all records for this student
        const studentRecords = await AttendanceRecord.find({
            studentId: user._id
        })

        const attendedSessionIds = new Set(studentRecords.map(r => r.sessionId.toString()))

        // 3. Calculate per-subject stats
        const subjectStats = {}
        let totalSessions = 0
        let totalAttended = 0

        allSessions.forEach(session => {
            if (!subjectStats[session.subject]) {
                subjectStats[session.subject] = { total: 0, attended: 0 }
            }
            subjectStats[session.subject].total++
            totalSessions++

            if (attendedSessionIds.has(session._id.toString())) {
                subjectStats[session.subject].attended++
                totalAttended++
            }
        })

        const statsArray = Object.keys(subjectStats).map(subject => {
            const data = subjectStats[subject]
            return {
                subject,
                percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
                attended: data.attended,
                total: data.total
            }
        })

        res.json({
            overallPercentage: totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0,
            subjectStats: statsArray,
            totalSessions,
            totalAttended
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
