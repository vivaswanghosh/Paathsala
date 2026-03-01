import express from 'express'
import LabAssignment from '../models/LabAssignment.js'
import LabSubmission from '../models/LabSubmission.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole } from '../middleware/auth.js'
import { executeCode, runTestCases } from '../services/codeExecutor.js'

const router = express.Router()

router.get('/', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    const role = getRole(req)

    let query = {}
    if (role === 'student') {
      query = { department: user.department }
    }

    const labs = await LabAssignment.find(query)
      .sort({ dueDate: 1 })
      .lean()

    for (const lab of labs) {
      const submission = await LabSubmission.findOne({
        assignmentId: lab._id,
        studentId: user._id,
        status: 'submitted'
      }).sort({ submittedAt: -1 })

      lab.submitted = !!submission
      lab.score = submission?.score
      lab.totalPoints = lab.testCases.reduce((sum, tc) => sum + tc.points, 0)
    }

    res.json({ labs })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const lab = await LabAssignment.findById(req.params.id)
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' })
    }

    const submission = await LabSubmission.findOne({
      assignmentId: lab._id,
      studentId: user._id
    }).sort({ submittedAt: -1 })

    res.json({
      lab: {
        ...lab.toObject(),
        testCases: lab.testCases.filter(tc => !tc.isHidden)
      },
      submission
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/run', checkJwt, async (req, res) => {
  try {
    const { code } = req.body
    const lab = await LabAssignment.findById(req.params.id)

    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' })
    }

    const results = await runTestCases(lab, code)

    res.json({ results })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/submit', checkJwt, async (req, res) => {
  try {
    const { code } = req.body
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const lab = await LabAssignment.findById(req.params.id)
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' })
    }

    const attemptCount = await LabSubmission.countDocuments({
      assignmentId: lab._id,
      studentId: user._id
    })

    if (attemptCount >= lab.maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts reached' })
    }

    const results = await runTestCases(lab, code)
    const score = results.filter(r => r.passed).reduce((sum, r) => {
      const tc = lab.testCases.find(t => t._id.toString() === r.testCaseId?.toString())
      return sum + (tc?.points || 0)
    }, 0)

    const totalPoints = lab.testCases.reduce((sum, tc) => sum + tc.points, 0)

    const submission = await LabSubmission.create({
      assignmentId: lab._id,
      studentId: user._id,
      code,
      language: lab.language,
      testResults: results,
      score,
      totalPoints,
      attemptNumber: attemptCount + 1,
      status: 'submitted'
    })

    // Gamification: Award XP equivalent to the score
    user.xp = (user.xp || 0) + score
    await user.save()

    res.json({ results, score, totalPoints, submission, xpGained: score })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', checkJwt, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const lab = await LabAssignment.create({
      ...req.body,
      createdBy: user._id
    })

    res.json({ lab })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
