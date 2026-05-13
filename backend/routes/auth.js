import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

/**
 * POST /api/auth/signup
 * Body: { email, password }
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' })
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return res.status(400).json({ error: error.message })

  res.status(201).json({ user: data.user, session: data.session })
})

/**
 * POST /api/auth/send-otp
 * Body: { email } — sends magic-link / OTP to email
 */
router.post('/send-otp', async (req, res) => {
  const { email, phone, channel = 'email' } = req.body

  if (!email && !phone) {
    return res.status(400).json({ error: 'email or phone is required.' })
  }

  const opts = email
    ? { email, options: { shouldCreateUser: true } }
    : { phone, options: { channel } }

  const { data, error } = await supabase.auth.signInWithOtp(opts)

  if (error) return res.status(400).json({ error: error.message })

  res.json({ message: 'OTP sent successfully.', data })
})

/**
 * POST /api/auth/verify-otp
 * Body: { email, token, type }
 * type: 'signup' | 'email' | 'sms' | 'magiclink'
 */
router.post('/verify-otp', async (req, res) => {
  const { email, phone, token, type = 'signup' } = req.body

  if (!token) {
    return res.status(400).json({ error: 'token is required.' })
  }

  const opts = email
    ? { email, token, type }
    : { phone, token, type }

  const { data, error } = await supabase.auth.verifyOtp(opts)

  if (error) return res.status(400).json({ error: error.message })

  res.json({ user: data.user, session: data.session })
})

export default router
