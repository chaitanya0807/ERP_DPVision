/**
 * Factory that returns a middleware enforcing role-based access.
 * Usage: requireRole(['admin', 'superadmin'])
 * Must run after verifyJWT + attachProfile.
 *
 * @param {string[]} allowedRoles
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({ error: 'Profile not attached. Ensure verifyJWT and attachProfile run first.' })
    }

    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({
        error: 'You do not have permission to access this page.',
        required: allowedRoles,
        current: req.profile.role,
      })
    }

    next()
  }
}
