import { supabase } from '../lib/supabase.js'

/**
 * Extracts the Bearer token from Authorization header,
 * verifies it via supabase.auth.getUser(), and attaches
 * the user object to req.user.
 */
export async function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'] ?? ''
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' })
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }

  req.user = data.user
  next()
}
