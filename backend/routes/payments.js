import { Router } from 'express'
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils.js'
import { razorpay } from '../lib/razorpay.js'
import { supabase } from '../lib/supabase.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { attachProfile } from '../middleware/attachProfile.js'

const router = Router()

/**
 * POST /api/payments/order
 * Protected: authenticated + has a profile
 * Body: { amount } — amount in paise (INR × 100)
 *
 * Creates a Razorpay order and returns { orderId, amount, currency, key }
 */
router.post('/order', verifyJWT, attachProfile, async (req, res) => {
  const { amount } = req.body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount (in paise) is required and must be a positive number.' })
  }

  const companyId = req.profile.company_id ?? req.user.id

  let order
  try {
    order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt:  `rcpt_${companyId.slice(0, 8)}_${Date.now()}`,
      notes: {
        company_id: companyId,
        user_id:    req.user.id,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: err.message ?? 'Failed to create Razorpay order.' })
  }

  res.json({
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    key:      process.env.RAZORPAY_KEY_ID,
  })
})

/**
 * POST /api/payments/verify
 * Protected: authenticated + has a profile
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Validates HMAC signature, then:
 *   - Inserts/updates payments table with status='paid'
 *   - Updates all company subscriptions to status='active'
 */
router.post('/verify', verifyJWT, attachProfile, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.' })
  }

  // 1. Validate HMAC signature
  let isValid = false
  try {
    isValid = validatePaymentVerification(
      { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      process.env.RAZORPAY_SECRET
    )
  } catch {
    return res.status(500).json({ error: 'Signature validation failed.' })
  }

  if (!isValid) {
    return res.status(400).json({ error: 'Payment signature is invalid.' })
  }

  // 2. Fetch order details from Razorpay to get amount
  let orderDetails
  try {
    orderDetails = await razorpay.orders.fetch(razorpay_order_id)
  } catch {
    orderDetails = { amount: 0 }
  }

  // 3. Insert payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      company_id:          req.profile.company_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount:              orderDetails.amount / 100, // store in INR
      status:              'paid',
    })

  if (paymentError) {
    return res.status(500).json({ error: paymentError.message })
  }

  // 4. Activate all subscriptions for this company
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status:       'active',
      activated_at: new Date().toISOString(),
    })
    .eq('company_id', req.profile.company_id)

  if (subError) {
    return res.status(500).json({ error: subError.message })
  }

  res.json({ success: true, paymentId: razorpay_payment_id })
})

export default router
