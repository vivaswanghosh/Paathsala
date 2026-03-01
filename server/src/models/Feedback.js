import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: {
        type: String,
        enum: ['Academic', 'Infrastructure', 'Hostel', 'Canteen', 'Library', 'Other'],
        default: 'Other'
    },
    description: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },

    // Only populated if not anonymous
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: String },
    batch: { type: Number },

    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    adminNotes: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export default mongoose.model('Feedback', feedbackSchema)
