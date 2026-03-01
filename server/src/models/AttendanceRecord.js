import mongoose from 'mongoose'

const attendanceRecordSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
    locationData: { // Optional: for geo-fencing validation
        latitude: { type: Number },
        longitude: { type: Number }
    },
    timestamp: { type: Date, default: Date.now }
})

export default mongoose.model('AttendanceRecord', attendanceRecordSchema)
