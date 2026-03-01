import mongoose from 'mongoose'

const jobApplicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'],
        default: 'Applied'
    },
    resumeLink: { type: String },
    notes: { type: String },
    appliedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export default mongoose.model('JobApplication', jobApplicationSchema)
