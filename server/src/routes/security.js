import express from 'express'
import { checkJwt, getAuth0Id } from '../middleware/auth.js'
import LoginLog from '../models/LoginLog.js'
import User from '../models/User.js'
import { 
  logLoginEvent, 
  getLoginHistory, 
  getUserLoginStats,
  getAllUsersLoginHistory,
  getGlobalSecurityStats,
  getUsersWithSuspiciousActivity,
  getUserSecurityTimeline
} from '../services/securityService.js'
import { verifyAuditTrail, getExplorerUrl } from '../services/algorandService.js'
import fetch from 'node-fetch'

const router = express.Router()

function requireRole(req, res, next, allowedRoles) {
  const role = req.auth?.['https://smart-college/role'] || 'student'
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Access denied' })
  }
  next()
}

router.get('/history', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { limit, offset, includeFailed } = req.query
    const history = await getLoginHistory(user._id, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      includeFailed: includeFailed !== 'false'
    })

    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/stats', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const stats = await getUserLoginStats(user._id)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/timeline', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const user = await User.findOne({ auth0Id })
    const days = parseInt(req.query.days) || 30
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const timeline = await getUserSecurityTimeline(user._id, days)
    res.json(timeline)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/verify/:txId', checkJwt, async (req, res) => {
  try {
    const { txId } = req.params
    const auditData = await verifyAuditTrail(txId)
    const explorerUrl = getExplorerUrl(txId)
    
    if (!auditData) {
      return res.status(404).json({ error: 'Audit trail not found' })
    }

    res.json({ verified: true, data: auditData, explorerUrl })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin/all-users', checkJwt, async (req, res) => {
  try {
    requireRole(req, res, () => {}, ['admin', 'hod'])
    
    const { 
      limit, 
      offset, 
      eventType, 
      isSuspicious, 
      userId,
      email,
      startDate,
      endDate
    } = req.query

    const result = await getAllUsersLoginHistory({
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      eventType,
      isSuspicious: isSuspicious === 'true' ? true : isSuspicious === 'false' ? false : undefined,
      userId,
      email,
      startDate,
      endDate
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin/stats', checkJwt, async (req, res) => {
  try {
    requireRole(req, res, () => {}, ['admin', 'hod'])
    
    const stats = await getGlobalSecurityStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin/suspicious-users', checkJwt, async (req, res) => {
  try {
    requireRole(req, res, () => {}, ['admin', 'hod'])
    
    const days = parseInt(req.query.days) || 7
    const users = await getUsersWithSuspiciousActivity(days)
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin/user/:userId', checkJwt, async (req, res) => {
  try {
    requireRole(req, res, () => {}, ['admin', 'hod'])
    
    const { userId } = req.params
    const { limit, offset, includeFailed } = req.query

    const [history, stats, timeline] = await Promise.all([
      getLoginHistory(userId, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        includeFailed: includeFailed !== 'false'
      }),
      getUserLoginStats(userId),
      getUserSecurityTimeline(userId, 30)
    ])

    res.json({ history, stats, timeline })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/log', async (req, res) => {
  try {
    const webhookSecret = req.headers['x-webhook-secret']
    if (webhookSecret !== process.env.AUTH0_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' })
    }

    const eventData = req.body
    const log = await logLoginEvent(eventData)
    
    res.json({ success: true, logId: log._id })
  } catch (error) {
    console.error('Failed to log login event:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/sync-auth0', checkJwt, async (req, res) => {
  try {
    requireRole(req, res, () => {}, ['admin'])
    
    const token = await getManagementToken()
    const response = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/logs?sort=-date&per_page=100`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const logs = await response.json()
    let synced = 0
    
    for (const log of logs) {
      try {
        await logLoginEvent({
          auth0Id: log.user_id,
          email: log.user_name || log.email || 'unknown',
          eventType: mapAuth0EventType(log.type),
          ipAddress: log.ip,
          userAgent: log.user_agent,
          auth0LogId: log._id,
          city: log.geo_info?.city,
          country: log.geo_info?.country_name
        })
        synced++
      } catch (e) {
        // Skip duplicates
      }
    }

    res.json({ synced, total: logs.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/admin/users-list', checkJwt, async (req, res) => {
  try {
    requireRole(req, res, () => {}, ['admin', 'hod'])
    
    const users = await User.find({})
      .select('name email role department')
      .sort({ name: 1 })
    
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

async function getManagementToken() {
  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      grant_type: 'client_credentials'
    })
  })
  const data = await response.json()
  return data.access_token
}

function mapAuth0EventType(auth0Type) {
  const mapping = {
    's': 'success',
    'seccft': 'success',
    'secc': 'success',
    'f': 'failed',
    'fapi': 'failed',
    'fu': 'failed',
    'fotp': 'failed',
    'mfa': 'mfa_required',
    'mfa_sfa': 'mfa_required',
    'pwd_change': 'password_change',
    'scpr': 'password_change',
    'slo': 'logout'
  }
  return mapping[auth0Type] || 'success'
}

export default router
