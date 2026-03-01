import LoginLog from '../models/LoginLog.js'
import User from '../models/User.js'
import { notarizeSuspiciousActivity } from './algorandService.js'

const THRESHOLDS = {
  maxFailedAttempts: 5,
  failedAttemptsWindow: 15 * 60 * 1000,
  newDeviceCooldown: 24 * 60 * 60 * 1000
}

export async function logLoginEvent(eventData) {
  const {
    auth0Id,
    email,
    eventType,
    ipAddress,
    userAgent,
    auth0LogId,
    city,
    country
  } = eventData

  const user = await User.findOne({ auth0Id })
  
  const deviceInfo = parseUserAgent(userAgent)
  
  const suspicionCheck = await detectSuspiciousActivity({
    userId: user?._id,
    auth0Id,
    ipAddress,
    deviceInfo,
    userAgent
  })

  const loginLog = new LoginLog({
    userId: user?._id || null,
    auth0Id,
    email,
    eventType,
    ipAddress,
    userAgent,
    auth0LogId,
    city,
    country,
    ...deviceInfo,
    isSuspicious: suspicionCheck.isSuspicious,
    suspicionReasons: suspicionCheck.reasons
  })

  await loginLog.save()

  if (suspicionCheck.isSuspicious) {
    const txId = await notarizeSuspiciousActivity(loginLog)
    if (txId) {
      loginLog.algorandTxId = txId
      await loginLog.save()
    }
    
    await notifySuspiciousActivity(loginLog, user)
  }

  return loginLog
}

async function detectSuspiciousActivity({ userId, auth0Id, ipAddress, deviceInfo, userAgent }) {
  const reasons = []

  const recentFailures = await LoginLog.countDocuments({
    auth0Id,
    eventType: 'failed',
    timestamp: { $gte: new Date(Date.now() - THRESHOLDS.failedAttemptsWindow) }
  })

  if (recentFailures >= THRESHOLDS.maxFailedAttempts) {
    reasons.push('multiple_failed_attempts')
  }

  if (userId) {
    const knownDevices = await LoginLog.distinct('userAgent', {
      userId,
      eventType: 'success'
    })

    const isNewDevice = userAgent && !knownDevices.some(ua => ua && ua.includes(deviceInfo.browser))

    if (isNewDevice && knownDevices.length > 0) {
      reasons.push('new_device')
    }
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons
  }
}

function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown', deviceType: 'unknown' }
  
  const browser = userAgent.includes('Edg/') ? 'Edge' :
                  userAgent.includes('Chrome') && !userAgent.includes('Edg') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') && !userAgent.includes('Chrome') ? 'Safari' :
                  userAgent.includes('Opera') || userAgent.includes('OPR/') ? 'Opera' : 'Unknown'
  
  const os = userAgent.includes('Windows NT 10') ? 'Windows 10/11' :
             userAgent.includes('Windows NT 6') ? 'Windows' :
             userAgent.includes('Mac OS X') ? 'macOS' :
             userAgent.includes('Linux') && !userAgent.includes('Android') ? 'Linux' :
             userAgent.includes('Android') ? 'Android' :
             userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : 'Unknown'

  const deviceType = /Mobile|Android|iPhone/i.test(userAgent) && !/Tablet|iPad/i.test(userAgent) ? 'mobile' :
                     /Tablet|iPad/i.test(userAgent) ? 'tablet' : 'desktop'

  return { browser, os, deviceType }
}

async function notifySuspiciousActivity(loginLog, user) {
  console.log(`[SECURITY ALERT] Suspicious login detected for ${loginLog.email}`)
  console.log(`  Reasons: ${loginLog.suspicionReasons.join(', ')}`)
  console.log(`  IP: ${loginLog.ipAddress}`)
  console.log(`  Device: ${loginLog.browser} on ${loginLog.os}`)
}

export async function getLoginHistory(userId, options = {}) {
  const { limit = 50, offset = 0, includeFailed = true } = options

  const query = { userId }
  if (!includeFailed) {
    query.eventType = { $ne: 'failed' }
  }

  return LoginLog.find(query)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
}

export async function getAllUsersLoginHistory(options = {}) {
  const { 
    limit = 100, 
    offset = 0, 
    eventType,
    isSuspicious,
    userId,
    email,
    startDate,
    endDate
  } = options

  const query = {}
  
  if (eventType) query.eventType = eventType
  if (isSuspicious !== undefined) query.isSuspicious = isSuspicious
  if (userId) query.userId = userId
  if (email) query.email = { $regex: email, $options: 'i' }
  if (startDate || endDate) {
    query.timestamp = {}
    if (startDate) query.timestamp.$gte = new Date(startDate)
    if (endDate) query.timestamp.$lte = new Date(endDate)
  }

  const [logs, total] = await Promise.all([
    LoginLog.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .populate('userId', 'name email role department'),
    LoginLog.countDocuments(query)
  ])

  return { logs, total, limit, offset }
}

export async function getUserLoginStats(userId) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const [totalLogins, failedAttempts, suspiciousEvents, uniqueDevices, lastLogin] = await Promise.all([
    LoginLog.countDocuments({ userId, eventType: 'success', timestamp: { $gte: thirtyDaysAgo } }),
    LoginLog.countDocuments({ userId, eventType: 'failed', timestamp: { $gte: thirtyDaysAgo } }),
    LoginLog.countDocuments({ userId, isSuspicious: true, timestamp: { $gte: thirtyDaysAgo } }),
    LoginLog.distinct('userAgent', { userId, eventType: 'success' }),
    LoginLog.findOne({ userId, eventType: 'success' }).sort({ timestamp: -1 })
  ])

  return {
    totalLogins,
    failedAttempts,
    suspiciousEvents,
    uniqueDevices: uniqueDevices.length,
    lastLogin: lastLogin?.timestamp || null,
    period: '30 days'
  }
}

export async function getGlobalSecurityStats() {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const [
    totalLogins24h,
    failedLogins24h,
    suspiciousEvents24h,
    totalLogins7d,
    suspiciousEvents7d,
    activeUsers24h,
    topBrowsers,
    topOs,
    topCountries
  ] = await Promise.all([
    LoginLog.countDocuments({ eventType: 'success', timestamp: { $gte: twentyFourHoursAgo } }),
    LoginLog.countDocuments({ eventType: 'failed', timestamp: { $gte: twentyFourHoursAgo } }),
    LoginLog.countDocuments({ isSuspicious: true, timestamp: { $gte: twentyFourHoursAgo } }),
    LoginLog.countDocuments({ eventType: 'success', timestamp: { $gte: sevenDaysAgo } }),
    LoginLog.countDocuments({ isSuspicious: true, timestamp: { $gte: sevenDaysAgo } }),
    LoginLog.distinct('userId', { eventType: 'success', timestamp: { $gte: twentyFourHoursAgo } }),
    LoginLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    LoginLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    LoginLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo }, country: { $exists: true } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ])

  return {
    last24Hours: {
      totalLogins: totalLogins24h,
      failedLogins: failedLogins24h,
      suspiciousEvents: suspiciousEvents24h,
      activeUsers: activeUsers24h.length
    },
    last7Days: {
      totalLogins: totalLogins7d,
      suspiciousEvents: suspiciousEvents7d
    },
    topBrowsers: topBrowsers.map(b => ({ name: b._id, count: b.count })),
    topOs: topOs.map(o => ({ name: o._id, count: o.count })),
    topCountries: topCountries.map(c => ({ name: c._id, count: c.count }))
  }
}

export async function getUsersWithSuspiciousActivity(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const suspiciousUsers = await LoginLog.aggregate([
    { 
      $match: { 
        isSuspicious: true, 
        timestamp: { $gte: since } 
      } 
    },
    {
      $group: {
        _id: '$userId',
        email: { $first: '$email' },
        suspiciousCount: { $sum: 1 },
        lastSuspicious: { $max: '$timestamp' },
        reasons: { $addToSet: '$suspicionReasons' }
      }
    },
    { $sort: { suspiciousCount: -1 } },
    { $limit: 50 }
  ])

  return suspiciousUsers
}

export async function getUserSecurityTimeline(userId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const timeline = await LoginLog.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ])

  return timeline
}
