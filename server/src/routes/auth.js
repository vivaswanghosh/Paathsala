import fetch from 'node-fetch'
import express from 'express'
import User from '../models/User.js'
import { checkJwt, getAuth0Id } from '../middleware/auth.js'

const router = express.Router()

router.get('/me', checkJwt, async (req, res) => {
  try {
    const auth0Id = getAuth0Id(req)
    const email = req.auth['https://smart-college/email'] || req.auth.email
    const name = req.auth['https://smart-college/name'] || req.auth.name || email?.split('@')[0]
    const role = req.auth['https://smart-college/role'] || 'student'
    const department = req.auth['https://smart-college/department'] || ''

    const updateData = { email, name };
    if (role && role !== 'student') updateData.role = role;
    if (department) updateData.department = department;

    let user = await User.findOneAndUpdate(
      { auth0Id },
      { $set: updateData },
      { upsert: true, new: true }
    )

    // Send pending notifications count if user is found
    res.json({ user })
  } catch (error) {
    console.error('Error in /me route:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/change-password', checkJwt, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const auth0Id = getAuth0Id(req)

    const user = await User.findOne({ auth0Id })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${auth0Id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${await getManagementToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: newPassword,
        user_metadata: { mustChangePassword: false }
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update password')
    }

    user.passwordChanged = true
    await user.save()

    res.json({ success: true, message: 'Password changed successfully' })
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

export default router