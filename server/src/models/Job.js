import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    type: { type: String, enum: ['Internship', 'Full-time', 'Part-time'], required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    stipendOrSalary: { type: String },
    deadline: { type: Date, required: true },
    eligibility: {
        minCgpa: { type: Number },
        allowedBranches: [{ type: String }],
        batches: [{ type: Number }]
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Job', jobSchema)
