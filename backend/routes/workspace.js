import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { attachProfile } from '../middleware/attachProfile.js'

const router = Router()

/**
 * POST /api/workspace/company
 * Body: { name, domain, primaryEmail, billingEmail, country, currency, userRole, userCount }
 * Protected: must be authenticated (no existing profile yet, so skip attachProfile here)
 *
 * Flow:
 *   1. Insert row into companies
 *   2. Insert row into profiles with is_primary = true
 */
router.post('/company', verifyJWT, async (req, res) => {
  const {
    name,
    domain,
    primaryEmail,
    billingEmail,
    country    = 'India',
    currency   = 'INR',
    userRole   = 'superadmin',
    userCount  = 1,
  } = req.body

  if (!name || !primaryEmail) {
    return res.status(400).json({ error: 'name and primaryEmail are required.' })
  }

  // 1. Insert company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name,
      domain,
      country,
      currency,
      user_count: userCount,
    })
    .select()
    .single()

  if (companyError) {
    return res.status(500).json({ error: companyError.message })
  }

  // 2. Insert primary profile for the authenticated user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id:         req.user.id,
      company_id: company.id,
      role:       userRole,
      full_name:  req.user.user_metadata?.full_name ?? null,
      phone:      req.user.phone ?? null,
      is_primary: true,
    })
    .select()
    .single()

  if (profileError) {
    return res.status(500).json({ error: profileError.message })
  }

  res.status(201).json({ company, profile })
})

export default router
