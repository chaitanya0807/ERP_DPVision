import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Shield, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { apiUrl } from '@/lib/api'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Extend window to hold Razorpay constructor
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: { email?: string; name?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayInstance {
  open: () => void
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id  = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { companyData, pricingData, selectedModules, setPaymentData } = useOnboarding()

  const [status, setStatus]   = useState<'idle' | 'loading' | 'paying' | 'verifying' | 'error'>('idle')
  const [error, setError]     = useState<string | null>(null)

  const total      = pricingData?.total ?? 0
  const totalPaise = Math.round(total * 100)
  const isDev      = import.meta.env.DEV

  function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
  }

  function handleSimulateSuccess() {
    setPaymentData({
      orderId:   'dev_order_' + Date.now(),
      paymentId: 'dev_pay_'   + Date.now(),
      status:    'paid',
    })
    navigate('/dashboard')
  }

  async function handlePay() {
    setStatus('loading')
    setError(null)

    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setError('Failed to load Razorpay SDK. Check your internet connection.')
      setStatus('error')
      return
    }

    // 2. Create order via backend
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''

    let orderData: { orderId: string; amount: number; currency: string; key: string }
    try {
      const res = await fetch(apiUrl('/api/payments/order'), {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: companyData,
          amount:    totalPaise,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Order creation failed')
      }
      orderData = await res.json()
    } catch (err: any) {
      setError(err.message ?? 'Could not create payment order. Please try again.')
      setStatus('error')
      return
    }

    setStatus('paying')

    // 3. Open Razorpay widget
    const rzp = new window.Razorpay({
      key:         orderData.key,
      amount:      orderData.amount,
      currency:    orderData.currency ?? 'INR',
      name:        'WorkspaceOS',
      description: 'Workspace Subscription',
      order_id:    orderData.orderId,
      prefill: {
        email: companyData?.primaryEmail,
        name:  companyData?.name,
      },
      theme: { color: '#2563eb' },
      modal: {
        ondismiss: () => setStatus('idle'),
      },
      handler: async (response: RazorpayResponse) => {
        setStatus('verifying')
        try {
          const verifyRes = await fetch(apiUrl('/api/payments/verify'), {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          })
          if (!verifyRes.ok) throw new Error('Verification failed')
          setPaymentData({
            orderId:   response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            status:    'paid',
          })
          navigate('/dashboard')
        } catch {
          setError('Payment verification failed. Contact support with your payment ID.')
          setStatus('error')
        }
      },
    })

    rzp.open()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1 pb-2">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Complete Payment</CardTitle>
          <p className="text-sm text-muted-foreground">Secure checkout via Razorpay</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          {/* Order summary */}
          <div className="rounded-lg border px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Order Summary</p>
            {selectedModules.map((m) => (
              <div key={m.moduleId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m.name}</span>
                <span>₹{(m.pricePerUser * (companyData?.userCount ?? 1)).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (15%)</span>
              <span>{fmt(pricingData?.taxAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-blue-600">{fmt(total)}</span>
            </div>
          </div>

          {/* Pay button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11"
            onClick={handlePay}
            disabled={status === 'loading' || status === 'paying' || status === 'verifying'}
          >
            {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'verifying' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'loading'   && 'Preparing Payment…'}
            {status === 'paying'    && 'Complete in Razorpay…'}
            {status === 'verifying' && 'Verifying Payment…'}
            {(status === 'idle' || status === 'error') && (
              <>
                <CreditCard className="h-4 w-4" />
                Pay {fmt(total)}
              </>
            )}
          </Button>

          {/* Dev-only simulate button */}
          {isDev && (
            <div className="rounded-lg border border-dashed border-yellow-400 bg-yellow-50 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-yellow-700">🛠 Dev Mode — Skip Razorpay</p>
              <Button
                variant="outline"
                className="w-full border-yellow-400 text-yellow-800 hover:bg-yellow-100 gap-2"
                onClick={handleSimulateSuccess}
              >
                Simulate Payment Success
              </Button>
            </div>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            256-bit SSL · Secured by Razorpay
          </div>

          {/* Accepted methods */}
          <div className="text-center text-xs text-muted-foreground">
            Visa · Mastercard · UPI · GPay · PhonePe · Paytm · Razorpay Wallet
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
