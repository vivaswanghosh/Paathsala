import express from 'express'
import User from '../models/User.js'
import WeeklyRoutine from '../models/WeeklyRoutine.js'
import LabAssignment from '../models/LabAssignment.js'
import LabSubmission from '../models/LabSubmission.js'
import ExamAttempt from '../models/ExamAttempt.js'
import AttendanceRecord from '../models/AttendanceRecord.js'
import Exam from '../models/Exam.js'
import LibraryResource from '../models/LibraryResource.js'
import Announcement from '../models/Announcement.js' // Added
import { checkJwt, getAuth0Id, getRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/stats', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    const role = getRole(req)

    const today = new Date()
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

    const pendingLabs = await LabAssignment.countDocuments({
      department: user.department,
      dueDate: { $gte: today }
    })

    const upcomingExams = await Exam.countDocuments({
      department: user.department,
      endTime: { $gte: today }
    })

    const classesToday = await WeeklyRoutine.countDocuments({
      department: user.department,
      day: dayName,
      status: { $ne: 'cancelled' }
    })

    const libraryResources = await LibraryResource.countDocuments()

    const todaySchedule = await WeeklyRoutine.find({
      department: user.department,
      day: dayName,
      status: { $ne: 'cancelled' }
    })
      .populate('teacherId', 'name')
      .sort({ 'timeSlot.start': 1 })

    // Fetch Announcements
    // Filter by role (e.g., students see 'all' or 'student')
    const filter = role === 'admin' ? {} : { $or: [{ targetRole: 'all' }, { targetRole: role }] }
    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    res.json({
      stats: {
        pendingLabs,
        upcomingExams,
        classesToday,
        libraryResources
      },
      todaySchedule: todaySchedule.map(s => ({
        time: `${s.timeSlot.start} - ${s.timeSlot.end}`,
        subject: s.subject,
        room: s.room,
        teacher: s.teacherId?.name
      })),
      announcements: announcements.map(a => ({
        title: a.title,
        message: a.message,
        date: a.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/analytics', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Analytics primarily available for students' })
    }

    // 1. Fetch Lab Performance
    const labSubmissions = await LabSubmission.find({ studentId: user._id })
      .populate('assignmentId', 'title')
      .sort({ submittedAt: 1 })

    const labScores = labSubmissions.map(sub => ({
      name: sub.assignmentId?.title || 'Lab',
      score: (sub.score / sub.totalPoints) * 100
    })).filter(item => !isNaN(item.score))

    // 2. Fetch Exam Performance
    const examAttempts = await ExamAttempt.find({ studentId: user._id, status: { $in: ['submitted', 'auto_submitted'] } })
      .populate('examId', 'title')
      .sort({ submittedAt: 1 })

    const examScores = examAttempts.map(att => ({
      name: att.examId?.title || 'Exam',
      score: att.percentage
    })).filter(item => !isNaN(item.score))

    // 3. Fetch Attendance Stats
    const totalAttendance = await AttendanceRecord.countDocuments({ studentId: user._id })

    // 4. Academic Health Predictor
    const avgLab = labScores.reduce((sum, item) => sum + item.score, 0) / (labScores.length || 1)
    const avgExam = examScores.reduce((sum, item) => sum + item.score, 0) / (examScores.length || 1)

    let healthStatus = 'Good'
    let healthMessage = "You're doing great! Keep it up."

    if (avgExam < 50 || avgLab < 50) {
      healthStatus = 'Needs Attention'
      healthMessage = 'Your average scores are slipping. Consider joining study groups.'
    } else if (avgExam > 85 && avgLab > 85) {
      healthStatus = 'Excellent'
      healthMessage = 'Outstanding performance across labs and exams.'
    }

    res.json({
      labTrend: labScores,
      examTrend: examScores,
      attendanceCount: totalAttendance,
      health: {
        status: healthStatus,
        message: healthMessage,
        avgExam: Math.round(avgExam),
        avgLab: Math.round(avgLab)
      }
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
