import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, Package, ArrowRight } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function AddBillingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { companyData, selectedModules, pricingData } = useOnboarding()

  const newModuleIds: string[] = (location.state as { newModuleIds?: string[] })?.newModuleIds ?? []
  const newModules = selectedModules.filter((m) => newModuleIds.includes(m.moduleId))
  const userCount  = companyData?.userCount ?? 1

  const subtotal  = pricingData?.subtotal ?? 0
  const taxAmount = pricingData?.taxAmount ?? 0
  const total     = pricingData?.total ?? 0

  function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
  }

  if (newModules.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No new modules selected.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/add-modules')}>
              Back to Module Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <h1 className="text-2xl font-bold">Add-On Billing Review</h1>
            <p className="text-sm text-muted-foreground">Review charges for your new modules</p>
          </div>
        </div>

        {/* Itemized bill */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newModules.map((mod) => (
              <div key={mod.moduleId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium">{mod.name}</span>
                </div>
                <div className="text-right text-sm">
                  <span className="text-muted-foreground">
                    ₹{mod.pricePerUser.toLocaleString('en-IN')} × {userCount} users
                  </span>
                  <span className="ml-3 font-medium">
                    ₹{(mod.pricePerUser * userCount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GST (15%)</span>
              <span>{fmt(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total / month</span>
              <span className="text-blue-600">{fmt(total)}</span>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 gap-2"
              onClick={() => navigate('/dashboard/add-checkout', { state: { newModuleIds } })}
            >
              Proceed to Payment <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
