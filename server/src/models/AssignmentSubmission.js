import mongoose from 'mongoose'

const assignmentSubmissionSchema = new mongoose.Schema({
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true }, // Student's submitted file
    comments: { type: String },
    grade: { type: Number },
    feedback: { type: String },
    submittedAt: { type: Date, default: Date.now }
})

export default mongoose.model('AssignmentSubmission', assignmentSubmissionSchema)
