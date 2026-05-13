import { Link } from 'react-router-dom'
import { CheckCircle2, Package, Zap, LayoutDashboard, ShoppingBag, Plus } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function DashboardPage() {
  const { companyData, selectedModules, pricingData, paymentData } = useOnboarding()

  const isTrialActivation = paymentData?.status === 'trial'
  const isPaidActivation  = paymentData?.status === 'paid'
  const isActivated       = isTrialActivation || isPaidActivation

  const total = pricingData?.total ?? 0

  function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Success banner */}
        {isActivated && (
          <Card className="border-2 border-green-500 bg-green-50 shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">
                Welcome to Your Workspace!
              </CardTitle>
              <p className="text-sm font-semibold text-green-700 mt-1">
                Setup Complete! Your subscription is now active.
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Company info */}
              {companyData && (
                <div className="rounded-lg bg-white border px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workspace</p>
                  <p className="font-bold text-lg">{companyData.name}</p>
                  {companyData.domain && (
                    <p className="text-sm text-muted-foreground">{companyData.domain}</p>
                  )}
                </div>
              )}

              {/* Activated modules */}
              {selectedModules.length > 0 && (
                <div className="rounded-lg bg-white border overflow-hidden">
                  <div className="px-4 py-2 bg-muted">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Activated Modules
                    </p>
                  </div>
                  <div className="divide-y">
                    {selectedModules.map((mod) => (
                      <div key={mod.moduleId} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-sm font-medium">{mod.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ₹{mod.pricePerUser.toLocaleString('en-IN')} /user/month
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing plan */}
              <div className="rounded-lg bg-white border px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Billing Plan</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan type</span>
                  <span className="flex items-center gap-1 font-medium">
                    {isTrialActivation ? (
                      <><Zap className="h-3.5 w-3.5 text-blue-500" /> 3-Day Free Trial</>
                    ) : (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Active Subscription</>
                    )}
                  </span>
                </div>

                {pricingData && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Users</span>
                      <span className="font-medium">{companyData?.userCount ?? 1}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{fmt(pricingData.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">GST (15%)</span>
                      <span>{fmt(pricingData.taxAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-bold">
                      <span>Total / month</span>
                      <span className="text-blue-600">{fmt(total)}</span>
                    </div>
                  </>
                )}

                {isPaidActivation && paymentData?.paymentId && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Payment ID: <span className="font-mono">{paymentData.paymentId}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add More Modules card */}
        {isActivated && (
          <Card className="shadow-md border-2 border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Add More Modules</CardTitle>
                  <p className="text-sm text-muted-foreground">Expand your workspace with additional modules</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {selectedModules.length > 0 && selectedModules.map((mod) => (
                  <div key={mod.moduleId} className="flex items-center justify-between rounded-lg bg-white border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-sm">{mod.name}</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  </div>
                ))}
              </div>
              <Link to="/dashboard/add-modules">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 mt-2">
                  <Plus className="h-4 w-4" />
                  Add New Modules
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Empty state (direct nav / no context) */}
        {!isActivated && (
          <Card className="shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <LayoutDashboard className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">Your workspace is ready.</p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground py-4">
                Module dashboards coming soon. Complete onboarding to activate your workspace.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
