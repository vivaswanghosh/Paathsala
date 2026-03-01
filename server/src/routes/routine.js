import express from 'express'
import WeeklyRoutine from '../models/WeeklyRoutine.js'
import RoutineSwapRequest from '../models/RoutineSwapRequest.js'
import User from '../models/User.js'
import { checkJwt, requireRole, getAuth0Id, getRole, getDepartment } from '../middleware/auth.js'
import { createAndSendNotification } from '../services/notificationService.js'

const router = express.Router()

router.get('/', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    const department = user.department
    const routine = await WeeklyRoutine.find({ department, status: { $ne: 'cancelled' } })
      .sort({ day: 1, 'timeSlot.start': 1 })

    res.json({ routine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/mark-unavailable', checkJwt, requireRole('teacher'), async (req, res) => {
  try {
    const { routineId, date, reason } = req.body
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const routine = await WeeklyRoutine.findById(routineId)
    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' })
    }

    if (routine.teacherId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not your class' })
    }

    routine.status = 'unavailable'
    await routine.save()

    const swapRequest = await RoutineSwapRequest.create({
      baseRoutineId: routineId,
      date: new Date(date),
      day: routine.day,
      timeSlot: routine.timeSlot,
      subject: routine.subject,
      department: routine.department,
      room: routine.room,
      requestedBy: user._id,
      reason
    })

    // Notify other teachers in the department
    const teachers = await User.find({ role: 'teacher', department: routine.department, _id: { $ne: user._id } })
    for (const teacher of teachers) {
      createAndSendNotification(req.app, teacher._id, {
        title: 'Class Takeover Request',
        message: `${user.name} requested cover for ${routine.subject} on ${routine.day} (${routine.timeSlot.start}).`,
        type: 'routine',
        link: '/app/routine'
      })
    }

    // Notify students that the class is unavailable/cancelled for now
    const students = await User.find({ role: 'student', department: routine.department })
    for (const student of students) {
      createAndSendNotification(req.app, student._id, {
        title: 'Class Cancelled',
        message: `${routine.subject} by ${user.name} on ${routine.day} (${routine.timeSlot.start}) is currently cancelled.`,
        type: 'routine'
      })
    }

    res.json({ success: true, swapRequest })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/swap-requests', checkJwt, requireRole('teacher'), async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    const department = user.department
    const requests = await RoutineSwapRequest.find({
      department,
      status: 'open'
    }).populate('requestedBy', 'name')

    res.json({ requests })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/claim-swap/:id', checkJwt, requireRole('teacher'), async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })

    const swapRequest = await RoutineSwapRequest.findById(req.params.id)
    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found' })
    }

    if (swapRequest.status !== 'open') {
      return res.status(400).json({ error: 'Already claimed' })
    }

    swapRequest.status = 'claimed'
    swapRequest.claimedBy = user._id
    swapRequest.claimedAt = new Date()
    await swapRequest.save()

    const routine = await WeeklyRoutine.findById(swapRequest.baseRoutineId)
    if (routine) {
      routine.status = 'swapped'
      routine.replacementTeacherId = user._id
      await routine.save()

      // Notify students of swapped class
      const students = await User.find({ role: 'student', department: routine.department, batch: routine.batch })
      students.forEach(student => {
        createAndSendNotification(req.app, student._id, {
          title: 'Routine Update',
          message: `${routine.subject} class has been taken by ${user.name}`,
          type: 'routine'
        })
      })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', checkJwt, requireRole('admin'), async (req, res) => {
  try {
    const { teacherId, room, day, timeSlot, department } = req.body

    // 1. Clash Detection
    const existingClash = await WeeklyRoutine.findOne({
      day,
      'timeSlot.start': timeSlot.start,
      'timeSlot.end': timeSlot.end,
      status: { $ne: 'cancelled' },
      $or: [
        { teacherId },
        { room: room ? room : 'UNLIKELY_EXACT_MATCH' }
      ]
    })

    if (existingClash) {
      const clashMsg = `Timetable Clash detected on ${day} (${timeSlot.start}-${timeSlot.end}). ${existingClash.teacherId.toString() === teacherId ? 'Teacher is already busy.' : 'Room is already booked.'}`

      // Notify Admin who is assigning
      const auth0Id = getAuth0Id(req)
      const admin = await User.findOne({ auth0Id })
      if (admin) {
        createAndSendNotification(req.app, admin._id, {
          title: 'Routine Clash Warning',
          message: clashMsg,
          type: 'clash'
        })
      }

      // Notify Teacher who got dual assigned
      if (existingClash.teacherId.toString() === teacherId) {
        createAndSendNotification(req.app, teacherId, {
          title: 'Routine Clash Warning',
          message: clashMsg,
          type: 'clash'
        })
      }

      return res.status(409).json({ error: clashMsg, details: existingClash })
    }

    const routine = await WeeklyRoutine.create(req.body)
    res.json({ routine })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
