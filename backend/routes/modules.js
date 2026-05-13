import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { attachProfile } from '../middleware/attachProfile.js'

const router = Router()

/**
 * GET /api/modules
 * Public — returns all active modules (no auth required, catalog is read-only)
 */
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('modules')
    .select('id, name, slug, price_per_user, parent_slug, is_active')
    .eq('is_active', true)
    .order('parent_slug', { nullsFirst: true })
    .order('name')

  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
})

/**
 * POST /api/modules/subscriptions
 * Protected: authenticated + has a profile
 * Body: { modules: string[], status?: 'trial'|'active', trialEndsAt?: string }
 *
 * Bulk-inserts one subscription row per module for the caller's company.
 */
router.post('/subscriptions', verifyJWT, attachProfile, async (req, res) => {
  const {
    modules,
    status      = 'trial',
    trialEndsAt = null,
  } = req.body

  if (!Array.isArray(modules) || modules.length === 0) {
    return res.status(400).json({ error: 'modules must be a non-empty array of module IDs.' })
  }

  const { data: companyRow } = await supabase
    .from('companies')
    .select('user_count')
    .eq('id', req.profile.company_id)
    .single()

  const userCount = companyRow?.user_count ?? 1

  const rows = modules.map((moduleId) => ({
    company_id:    req.profile.company_id,
    module_id:     moduleId,
    user_count:    userCount,
    status,
    trial_ends_at: status === 'trial' ? trialEndsAt : null,
    activated_at:  status === 'active' ? new Date().toISOString() : null,
  }))

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(rows, { onConflict: 'company_id,module_id' })
    .select()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json({ subscriptions: data })
})

export default router
