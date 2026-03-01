import express from 'express'
import Exam from '../models/Exam.js'
import ExamAttempt from '../models/ExamAttempt.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'

const router = express.Router()

const activeExamSessions = new Map()

router.get('/', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    const role = getRole(req)

    let query = {}
    if (role === 'student') {
      query = { department: user.department, isPublished: true }
    }

    const exams = await Exam.find(query).sort({ startTime: 1 }).lean()

    for (const exam of exams) {
      const attempt = await ExamAttempt.findOne({
        examId: exam._id,
        studentId: user._id
      })

      exam.attempt = attempt
      exam.totalQuestions = exam.questions.length
      exam.totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0)
    }

    res.json({ exams })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const exam = await Exam.findById(req.params.id)
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: user._id
    })

    if (attempt && attempt.status !== 'in_progress') {
      return res.status(403).json({ error: 'Exam already completed' })
    }

    res.json({
      exam: {
        ...exam.toObject(),
        questions: exam.questions.map(q => ({
          _id: q._id,
          text: q.text,
          type: q.type,
          options: q.options,
          points: q.points
        }))
      },
      attempt
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// --- NEW: Endpoint to Start Exam Early ---
router.patch('/:id/status', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { status } = req.body
    const exam = await Exam.findById(req.params.id)

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    // Only allow changing status to 'live' for now (Start Early)
    if (status === 'live') {
      exam.status = 'live'
      exam.isPublished = true // Ensure it's visible
      await exam.save()
      return res.json({ message: 'Exam started successfully', exam })
    }

    res.status(400).json({ error: 'Invalid status update' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/start', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const exam = await Exam.findById(req.params.id)
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    const existingAttempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: user._id
    })

    if (existingAttempt && existingAttempt.status !== 'cancelled') {
      return res.status(400).json({ error: 'Exam already started or completed' })
    }

    const sessionKey = `${exam._id}:${user._id}`
    if (activeExamSessions.has(sessionKey)) {
      return res.status(400).json({ error: 'Session already active' })
    }

    activeExamSessions.set(sessionKey, {
      startedAt: Date.now(),
      ip: req.ip
    })

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: user._id,
      status: 'in_progress',
      startedAt: new Date()
    })

    res.json({ success: true, attempt })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/submit', checkJwt, async (req, res) => {
  try {
    const { answers } = req.body
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const exam = await Exam.findById(req.params.id)
    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId: user._id,
      status: 'in_progress'
    })

    if (!attempt) {
      return res.status(404).json({ error: 'No active attempt found' })
    }

    let score = 0
    for (const question of exam.questions) {
      const answer = answers[question._id]
      if (answer === question.correctAnswer ||
        String(answer).toLowerCase() === String(question.correctAnswer).toLowerCase()) {
        score += question.points
      }
    }

    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = Math.round((score / totalPoints) * 100)

    attempt.answers = answers
    attempt.status = 'submitted'
    attempt.submittedAt = new Date()
    attempt.score = score
    attempt.percentage = percentage
    await attempt.save()

    const xpGained = score * 2
    user.xp = (user.xp || 0) + xpGained
    await user.save()

    const sessionKey = `${exam._id}:${user._id}`
    activeExamSessions.delete(sessionKey)

    res.json({ success: true, score, totalPoints, percentage, xpGained })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/auto-submit', checkJwt, async (req, res) => {
  try {
    const { reason } = req.body
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const attempt = await ExamAttempt.findOne({
      examId: req.params.id,
      studentId: user._id,
      status: 'in_progress'
    })

    if (!attempt) {
      return res.status(404).json({ error: 'No active attempt' })
    }

    const exam = await Exam.findById(req.params.id)

    let score = 0
    if (attempt.answers) {
      for (const question of exam.questions) {
        const answer = attempt.answers.get(question._id)
        if (answer === question.correctAnswer) {
          score += question.points
        }
      }
    }

    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0)

    attempt.status = 'auto_submitted'
    attempt.submittedAt = new Date()
    attempt.autoSubmitReason = reason
    attempt.score = score
    attempt.percentage = Math.round((score / totalPoints) * 100)
    attempt.requiresReapproval = true
    attempt.reapprovalStatus = 'pending'
    await attempt.save()

    const sessionKey = `${exam._id}:${user._id}`
    activeExamSessions.delete(sessionKey)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
