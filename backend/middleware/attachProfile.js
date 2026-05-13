import { supabase } from '../lib/supabase.js'

/**
 * Fetches the profiles row for req.user.id and attaches
 * req.profile with { id, role, company_id, full_name, is_primary }.
 * If no profile exists yet, creates a minimal one so the flow continues.
 * Must run after verifyJWT.
 */
export async function attachProfile(req, res, next) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, company_id, full_name, is_primary')
    .eq('id', req.user.id)
    .single()

  if (data) {
    req.profile = data
    return next()
  }

  // Profile missing — create a minimal one (no company yet)
  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      id:         req.user.id,
      role:       'superadmin',
      full_name:  req.user.user_metadata?.full_name ?? null,
      is_primary: true,
    })
    .select('id, role, company_id, full_name, is_primary')
    .single()

  if (createError || !created) {
    return res.status(404).json({
      error: 'Profile not found and could not be created. Please complete company setup first.',
    })
  }

  req.profile = created
  next()
}
