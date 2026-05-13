import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, CreditCard, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function ActivatePage() {
  const navigate = useNavigate()
  const { companyData, selectedModules, pricingData, setPaymentData } = useOnboarding()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleFreeTrial() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      await fetch('/api/modules/subscriptions', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId:    companyData,
          modules:      selectedModules.map((m) => m.moduleId),
          status:       'trial',
          trialEndsAt,
        }),
      })
      setPaymentData({ orderId: '', paymentId: '', status: 'trial' })
    } catch {
      // Non-blocking — backend may not be running yet
    }
    navigate('/dashboard')
    setLoading(false)
  }

  function handlePayNow() {
    navigate('/payment/checkout')
  }

  const total = pricingData?.total ?? 0

  function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Activate Your Workspace</h1>
          <p className="text-sm text-muted-foreground">Choose how you want to get started</p>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 text-center">
            {error}
          </p>
        )}

        {/* Two option cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Free Trial card */}
          <Card className={cn(
            'relative overflow-hidden border-2 border-blue-600 shadow-md cursor-pointer hover:shadow-lg transition-shadow',
          )}>
            {/* Badge */}
            <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              FREE
            </div>

            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg text-blue-700">3-Day Free Trial</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  'Full access for 3 days',
                  'No credit card required',
                  'All selected modules included',
                  'Upgrade anytime',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleFreeTrial}
                disabled={loading}
              >
                <Zap className="h-4 w-4" />
                {loading ? 'Activating…' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>

          {/* Pay Now card */}
          <Card className="border-2 border-border shadow-md cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <CreditCard className="h-5 w-5 text-gray-600" />
              </div>
              <CardTitle className="text-lg">Pay Now</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  'Instant full activation',
                  'Credit / Debit / UPI',
                  'Razorpay secure checkout',
                  'Invoice generated immediately',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="text-center text-lg font-bold text-gray-800">
                {fmt(total)}
                <span className="text-sm font-normal text-muted-foreground"> /month</span>
              </div>

              <Button
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
                onClick={handlePayNow}
                disabled={loading}
              >
                <CreditCard className="h-4 w-4" />
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
