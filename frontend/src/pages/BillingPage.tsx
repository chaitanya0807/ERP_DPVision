import { useNavigate } from 'react-router-dom'
import { Receipt, ArrowRight, Package } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function BillingPage() {
  const navigate = useNavigate()
  const { selectedModules, pricingData, companyData } = useOnboarding()

  const userCount  = companyData?.userCount ?? 1
  const subtotal   = pricingData?.subtotal   ?? 0
  const taxAmount  = pricingData?.taxAmount  ?? 0
  const total      = pricingData?.total      ?? 0

  function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center space-y-1 pb-2">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Itemized Bill</CardTitle>
          <p className="text-sm text-muted-foreground">
            {userCount} user{userCount !== 1 ? 's' : ''} · monthly subscription
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Module line items */}
          {selectedModules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No modules selected. Go back and select at least one module.
            </p>
          ) : (
            <div className="divide-y rounded-lg border overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Module</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>

              {selectedModules.map((mod) => (
                <div
                  key={mod.moduleId}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 items-center"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{mod.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground text-right whitespace-nowrap">
                    ₹{mod.pricePerUser.toLocaleString('en-IN')} × {userCount}
                  </span>
                  <span className="text-sm font-semibold text-right whitespace-nowrap">
                    {fmt(mod.pricePerUser * userCount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="rounded-lg border px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (15%)</span>
              <span className="font-medium">{fmt(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total / month</span>
              <span className="text-blue-600">{fmt(total)}</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={() => navigate('/onboarding/activate')}
          >
            <Receipt className="h-4 w-4" />
            Review Itemized Bill
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
