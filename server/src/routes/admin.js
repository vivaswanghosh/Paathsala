import express from 'express'
import User from '../models/User.js'
import ExamAttempt from '../models/ExamAttempt.js'
import { checkJwt, requireRole, getAuth0Id } from '../middleware/auth.js'
import { provisionUsers } from '../services/userProvisioning.js'

const router = express.Router()

router.get('/users', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Gamification: Get top students by XP
router.get('/leaderboard', checkJwt, async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'student' })
      .sort({ xp: -1 }) // Sort descending by XP
      .limit(10)
      .select('name department xp batch')

    res.json({ leaderboard: topUsers })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/provision-users', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const { csvData, instituteCode } = req.body
    const lines = csvData.trim().split('\n')

    const results = []
    for (let i = 0; i < lines.length; i++) {
      const [firstName, lastName, dateOfBirth, batchYear, role, department] = lines[i].split(',')

      try {
        const result = await provisionUsers({
          firstName: firstName?.trim(),
          lastName: lastName?.trim(),
          dateOfBirth: dateOfBirth?.trim(),
          batchYear: parseInt(batchYear),
          role: role?.trim() || 'student',
          department: department?.trim(),
          instituteCode: instituteCode || process.env.INSTITUTION_CODE
        })
        results.push({ email: result.email, status: 'created' })
      } catch (error) {
        results.push({ line: i + 1, status: 'failed', error: error.message })
      }
    }

    res.json({
      total: lines.length,
      successful: results.filter(r => r.status === 'created').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reapproval-requests', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const requests = await ExamAttempt.find({
      requiresReapproval: true,
      reapprovalStatus: 'pending'
    })
      .populate('studentId', 'name email')
      .populate('examId', 'title subject')
      .sort({ submittedAt: -1 })

    const formattedRequests = requests.map(r => ({
      _id: r._id,
      studentName: r.studentId?.name,
      studentEmail: r.studentId?.email,
      examTitle: r.examId?.title,
      autoSubmitReason: r.autoSubmitReason
    }))

    res.json({ requests: formattedRequests })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/reapproval/:id/approve', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const admin = await User.findOne({ auth0Id })

    const attempt = await ExamAttempt.findById(req.params.id)
    if (!attempt) {
      return res.status(404).json({ error: 'Request not found' })
    }

    attempt.reapprovalStatus = 'approved'
    attempt.reapprovedBy = admin._id
    attempt.status = 'cancelled'
    await attempt.save()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/reapproval/:id/reject', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.id)
    if (!attempt) {
      return res.status(404).json({ error: 'Request not found' })
    }

    attempt.reapprovalStatus = 'rejected'
    await attempt.save()

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
