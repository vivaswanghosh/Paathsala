import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, required: true },
    dueDate: { type: Date, required: true },
    points: { type: Number, default: 100 },
    fileUrl: { type: String }, // Teacher's attachment (optional)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Assignment', assignmentSchema)
