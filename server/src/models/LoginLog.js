import mongoose from 'mongoose'

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auth0Id: { type: String, required: true },
  email: { type: String, required: true },
  
  eventType: { 
    type: String, 
    enum: ['success', 'failed', 'mfa_required', 'password_change', 'logout'],
    required: true 
  },
  
  ipAddress: { type: String },
  userAgent: { type: String },
  deviceType: { type: String },
  browser: { type: String },
  os: { type: String },
  city: { type: String },
  country: { type: String },
  
  isSuspicious: { type: Boolean, default: false },
  suspicionReasons: [{ type: String }],
  
  algorandTxId: { type: String },
  auth0LogId: { type: String },
  
  timestamp: { type: Date, default: Date.now }
})

loginLogSchema.index({ userId: 1, timestamp: -1 })
loginLogSchema.index({ auth0Id: 1, timestamp: -1 })
loginLogSchema.index({ isSuspicious: 1 })
loginLogSchema.index({ eventType: 1 })

export default mongoose.model('LoginLog', loginLogSchema)
