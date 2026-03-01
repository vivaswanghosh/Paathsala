import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    location: { type: String },
    category: { type: String, enum: ['workshop', 'seminar', 'hackathon', 'cultural'], default: 'workshop' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registrants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['registered', 'attended'], default: 'registered' },
        registeredAt: { type: Date, default: Date.now }
    }],
    certificateTemplate: { type: String }, // URL to background image if any
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Event', eventSchema)
