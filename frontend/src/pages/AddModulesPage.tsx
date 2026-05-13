import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ArrowRight, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { useOnboarding } from '@/context/OnboardingContext'
import type { SelectedModule } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

interface ApiModule {
  id: string
  name: string
  slug: string
  price_per_user: number
  parent_slug: string | null
  is_active: boolean
}

const FALLBACK_MODULES: ApiModule[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'CRM',                       slug: 'crm',              price_per_user: 0,   parent_slug: null,   is_active: true },
  { id: '00000000-0000-0000-0000-000000000002', name: 'WhatsApp API Integration',  slug: 'whatsapp-api',     price_per_user: 200, parent_slug: 'crm',  is_active: true },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Lead Management',           slug: 'lead-management',  price_per_user: 100, parent_slug: 'crm',  is_active: true },
  { id: '00000000-0000-0000-0000-000000000004', name: 'HRMS',                      slug: 'hrms',             price_per_user: 0,   parent_slug: null,   is_active: true },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Attendance',                slug: 'attendance',       price_per_user: 100, parent_slug: 'hrms', is_active: true },
  { id: '00000000-0000-0000-0000-000000000006', name: 'Payroll',                   slug: 'payroll',          price_per_user: 250, parent_slug: 'hrms', is_active: true },
  { id: '00000000-0000-0000-0000-000000000007', name: 'LMS',                       slug: 'lms',              price_per_user: 150, parent_slug: null,   is_active: true },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Bill Book',                 slug: 'bill-book',        price_per_user: 100, parent_slug: null,   is_active: true },
  { id: '00000000-0000-0000-0000-000000000009', name: 'Finance',                   slug: 'finance',          price_per_user: 200, parent_slug: null,   is_active: true },
  { id: '00000000-0000-0000-0000-000000000010', name: 'Fleet Management',          slug: 'fleet-management', price_per_user: 150, parent_slug: null,   is_active: true },
]

export default function AddModulesPage() {
  const navigate = useNavigate()
  const { companyData, selectedModules, setSelectedModules, setPricingData } = useOnboarding()
  const userCount = companyData?.userCount ?? 1

  const subscribedIds = new Set(selectedModules.map((m) => m.moduleId))

  const [allModules, setAllModules] = useState<ApiModule[]>([])
  const [checked, setChecked]       = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiUrl('/api/modules'))
        if (!res.ok) throw new Error('API unavailable')
        const data: ApiModule[] = await res.json()
        setAllModules(data)
      } catch {
        setAllModules(FALLBACK_MODULES)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function toggleModule(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Group for display
  const parents      = allModules.filter((m) => m.parent_slug === null)
  const standalone   = parents.filter((p) => !allModules.some((m) => m.parent_slug === p.slug))
  const withChildren = parents.filter((p) => allModules.some((m) => m.parent_slug === p.slug))

  // Selected new modules (checked + not already subscribed)
  const selectedNew   = allModules.filter((m) => checked.has(m.id) && !subscribedIds.has(m.id))
  const selectedCount = selectedNew.length

  function handleNext() {
    const newMods: SelectedModule[] = selectedNew.map((m) => ({
      moduleId:     m.id,
      slug:         m.slug,
      name:         m.name,
      pricePerUser: m.price_per_user,
    }))

    const subtotal   = newMods.reduce((sum, m) => sum + m.pricePerUser * userCount, 0)
    const taxRate    = 0.15
    const taxAmount  = subtotal * taxRate
    const total      = subtotal + taxAmount

    setSelectedModules([...selectedModules, ...newMods])
    setPricingData({ subtotal, taxRate, taxAmount, total })
    navigate('/dashboard/add-billing', { state: { newModuleIds: newMods.map((m) => m.moduleId) } })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading available modules…</p>
      </div>
    )
  }

  const allSubscribed = allModules.every((m) => subscribedIds.has(m.id))

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Add More Modules</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Select additional modules for your workspace</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="mx-auto max-w-2xl space-y-3">
          {allSubscribed && (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">All modules are already subscribed!</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </Card>
          )}

          {/* Standalone free modules (LMS, Bill Book, Finance, Fleet) */}
          {standalone.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-2 bg-muted">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Free Modules</p>
              </div>
              <div className="divide-y">
                {standalone.map((mod) => {
                  const isSubscribed = subscribedIds.has(mod.id)
                  const isChecked    = checked.has(mod.id)

                  return (
                    <label
                      key={mod.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isSubscribed ? 'bg-green-50/50 cursor-default' : 'cursor-pointer hover:bg-accent/30'
                      }`}
                    >
                      <Checkbox
                        checked={isSubscribed ? true : isChecked}
                        onCheckedChange={() => !isSubscribed && toggleModule(mod.id)}
                        disabled={isSubscribed}
                        className="h-4 w-4"
                      />
                      <Package className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="flex-1 text-sm font-medium">{mod.name}</span>
                      {isSubscribed ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Parent modules with paid children (CRM, HRMS) */}
          {withChildren.map((parent) => {
            const children = allModules.filter((m) => m.parent_slug === parent.slug)
            const parentSubscribed = subscribedIds.has(parent.id)

            return (
              <Card key={parent.id} className="overflow-hidden">
                {/* Parent header */}
                <div className={`flex items-center gap-3 px-4 py-3 ${parentSubscribed ? 'bg-green-50/30' : ''}`}>
                  <Package className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="flex-1 font-semibold text-sm">{parent.name}</span>
                  {parentSubscribed ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </div>

                <Separator />

                {/* Children */}
                <div className="divide-y">
                  {children.map((child) => {
                    const isSubscribed = subscribedIds.has(child.id)
                    const isChecked    = checked.has(child.id)

                    return (
                      <label
                        key={child.id}
                        className={`flex items-center gap-3 px-4 py-2.5 pl-10 transition-colors ${
                          isSubscribed ? 'bg-green-50/50 cursor-default' : 'cursor-pointer hover:bg-accent/30'
                        }`}
                      >
                        <Checkbox
                          checked={isSubscribed ? true : isChecked}
                          onCheckedChange={() => !isSubscribed && toggleModule(child.id)}
                          disabled={isSubscribed}
                          className="h-4 w-4"
                        />
                        <span className="flex-1 text-sm">{child.name}</span>
                        {isSubscribed ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-blue-700 whitespace-nowrap">
                            ₹{child.price_per_user.toLocaleString('en-IN')} /user/month
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold text-blue-600">Adding: {selectedCount} module{selectedCount !== 1 ? 's' : ''}</span>
            {selectedCount > 0 && (
              <span className="text-muted-foreground ml-2">
                · ₹{selectedNew.reduce((s, m) => s + m.price_per_user * userCount, 0).toLocaleString('en-IN')} /month
              </span>
            )}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleNext}
            disabled={selectedCount === 0}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
