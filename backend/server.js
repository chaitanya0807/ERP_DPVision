import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRouter      from './routes/auth.js'
import workspaceRouter from './routes/workspace.js'
import modulesRouter   from './routes/modules.js'
import paymentsRouter  from './routes/payments.js'

const app  = express()
const PORT = process.env.PORT ?? 4000

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL ?? 'http://localhost:5174',
  credentials: true,
}))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      authRouter)
app.use('/api/workspace', workspaceRouter)
app.use('/api/modules',   modulesRouter)
app.use('/api/payments',  paymentsRouter)

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  res.status(500).json({ error: err.message ?? 'Internal server error.' })
})

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`WorkspaceOS API running on http://localhost:${PORT}`)
})
