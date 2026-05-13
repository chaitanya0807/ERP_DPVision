import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, Shield, Loader2, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { apiUrl } from '@/lib/api'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(!!window.Razorpay)
      return
    }
    const s = document.createElement('script')
    s.id = 'razorpay-script'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(!!window.Razorpay)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function AddCheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { companyData, pricingData, selectedModules, setPaymentData } = useOnboarding()

  const newModuleIds: string[] = (location.state as { newModuleIds?: string[] })?.newModuleIds ?? []
  const newModules = selectedModules.filter((m) => newModuleIds.includes(m.moduleId))

  const [status, setStatus] = useState<'idle' | 'loading' | 'paying' | 'verifying' | 'error'>('idle')
  const [error, setError]   = useState<string | null>(null)

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

    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setError('Failed to load Razorpay SDK. Check your internet connection.')
      setStatus('error')
      return
    }

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
        body: JSON.stringify({ amount: totalPaise }),
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

    const rzp = new window.Razorpay({
      key:         orderData.key,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'WorkspaceOS Add-On',
      description: 'Add-on module subscription',
      order_id:    orderData.orderId,
      prefill: {
        name:  companyData?.name ?? '',
        email: companyData?.primaryEmail ?? '',
      },
      theme: { color: '#2563eb' },
      modal: { ondismiss: () => setStatus('idle') },
      handler: async (response) => {
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
          setError('Payment verification failed. Please contact support.')
          setStatus('error')
        }
      },
    })
    rzp.open()
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Add-On Checkout</h1>
            <p className="text-sm text-muted-foreground">Complete payment for your new modules</p>
          </div>
        </div>

        {/* Order summary */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newModules.map((mod) => (
              <div key={mod.moduleId} className="flex items-center justify-between text-sm">
                <span>{mod.name}</span>
                <span className="font-medium">₹{(mod.pricePerUser * (companyData?.userCount ?? 1)).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(pricingData?.subtotal ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GST (15%)</span>
              <span>{fmt(pricingData?.taxAmount ?? 0)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">{fmt(total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-3">{error}</p>
        )}

        {/* Pay button */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12 text-base"
          onClick={handlePay}
          disabled={status === 'loading' || status === 'paying' || status === 'verifying'}
        >
          {status === 'loading'    && <><Loader2 className="h-4 w-4 animate-spin" /> Creating Order…</>}
          {status === 'paying'     && 'Complete in Razorpay…'}
          {status === 'verifying'  && 'Verifying Payment…'}
          {(status === 'idle' || status === 'error') && (
            <><CreditCard className="h-4 w-4" /> Pay {fmt(total)}</>
          )}
        </Button>

        {/* Dev simulate */}
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
      </div>
    </div>
  )
}
