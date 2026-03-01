import mongoose from 'mongoose'

const attendanceSessionSchema = new mongoose.Schema({
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    department: { type: String, required: true },
    batch: { type: Number, required: true },
    qrCode: { type: String, required: true, unique: true }, // The string data embedded in the QR
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('AttendanceSession', attendanceSessionSchema)
