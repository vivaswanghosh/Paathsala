import mongoose from 'mongoose'

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  questions: [{
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short', 'long'], required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
    points: { type: Number, default: 10 }
  }],
  duration: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalQuestions: { type: Number },
  totalPoints: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false },
  // NEW: Status field to control exam state manually
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Exam', examSchema)
