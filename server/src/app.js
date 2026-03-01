import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import fs from 'fs'
import path from 'path'

import authRoutes from './routes/auth.js'
import routineRoutes from './routes/routine.js'
import labRoutes from './routes/lab.js'
import examRoutes from './routes/exam.js'
import calendarRoutes from './routes/calendar.js'
import aiMentorRoutes from './routes/aiMentor.js'
import libraryRoutes from './routes/library.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import jobsRoutes from './routes/jobs.js'
import attendanceRoutes from './routes/attendance.js'
import feedbackRoutes from './routes/feedback.js'
import notificationRoutes from './routes/notifications.js'
import forumRoutes from './routes/forum.js'
import announcementRoutes from './routes/announcements.js'
import assignmentRoutes from './routes/assignments.js'
import eventRoutes from './routes/events.js' // Added

import { errorHandler } from './middleware/error.js'

dotenv.config()

// Ensure Upload Directories Exist
const uploadsDir = path.join(process.cwd(), 'uploads')
const assignmentsDir = path.join(uploadsDir, 'assignments')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)
if (!fs.existsSync(assignmentsDir)) fs.mkdirSync(assignmentsDir)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST']
  }
})

// Store io instance on app to use in routes
app.set('io', io)

// Simple socket management
const userSockets = new Map() // Maps userId -> socketId
app.set('userSockets', userSockets)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Wait for client to identify themselves
  socket.on('register', (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id)
      console.log(`User ${userId} registered with socket ${socket.id}`)
    }
  })

  // --- COLLABORATIVE STUDY ROOMS ---

  // Join a study room
  socket.on('join_room', ({ roomId, user }) => {
    socket.join(roomId)
    console.log(`Socket ${socket.id} (User: ${user.name}) joined room ${roomId}`)

    // Broadcast to others in the room
    socket.to(roomId).emit('user_joined', {
      socketId: socket.id,
      user
    })
  })

  // Leave a study room
  socket.on('leave_room', ({ roomId, user }) => {
    socket.leave(roomId)
    socket.to(roomId).emit('user_left', {
      socketId: socket.id,
      user
    })
  })

  // Handle live chat in room
  socket.on('send_message', ({ roomId, message }) => {
    // message = { id, text, user, timestamp }
    io.to(roomId).emit('new_message', message)
  })

  // Sync cursor/typing positions
  socket.on('cursor_move', ({ roomId, cursorData }) => {
    // cursorData = { userId, x, y, name }
    socket.to(roomId).emit('cursor_update', cursorData)
  })

  // Handle document deltas (changes only)
  socket.on('document_delta', ({ roomId, delta }) => {
    // Broadcast the delta to everyone ELSE in the room
    socket.to(roomId).emit('document_delta', delta)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    // Find and remove the socket from the map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId)
        break
      }
    }
  })
})

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use('/api/', limiter)

app.use('/api/auth', authRoutes)
app.use('/api/routine', routineRoutes)
app.use('/api/lab', labRoutes)
app.use('/api/exam', examRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/ai-mentor', aiMentorRoutes)
app.use('/api/library', libraryRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/forum', forumRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/events', eventRoutes) // Added

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5001

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-college')
  .then(() => {
    console.log('Connected to MongoDB')
    // Start httpServer instead of express app directly
    httpServer.listen(PORT, () => {
      console.log(`Server & Socket.io running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  })

export default app
