import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Package, ArrowRight } from 'lucide-react'
import { useOnboarding } from '@/context/OnboardingContext'
import type { SelectedModule } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'

interface ApiModule {
  id: string
  name: string
  slug: string
  price_per_user: number
  parent_slug: string | null
  is_active: boolean
}

interface ParentGroup {
  parent: ApiModule
  children: ApiModule[]
}

// Fallback seed data matching 001_init.sql — used when API is unreachable
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

function groupModules(modules: ApiModule[]): ParentGroup[] {
  const parents = modules.filter((m) => m.parent_slug === null)
  return parents.map((p) => ({
    parent: p,
    children: modules.filter((m) => m.parent_slug === p.slug),
  }))
}

export default function ModulesPage() {
  const navigate = useNavigate()
  const { companyData, setSelectedModules, setPricingData } = useOnboarding()
  const userCount = companyData?.userCount ?? 1

  const [groups, setGroups]             = useState<ParentGroup[]>([])
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [checked, setChecked]           = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(true)

  // Fetch modules
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/modules')
        if (!res.ok) throw new Error('API unavailable')
        const data: ApiModule[] = await res.json()
        setGroups(groupModules(data))
      } catch {
        setGroups(groupModules(FALLBACK_MODULES))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Toggle accordion open/closed
  function toggleSection(slug: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  // Toggle parent: auto-select / deselect all children
  function toggleParent(group: ParentGroup) {
    const childIds = group.children.map((c) => c.id)
    const allSelected = childIds.every((id) => checked.has(id))
    setChecked((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        // deselect all children
        childIds.forEach((id) => next.delete(id))
      } else {
        // select all children (paid only — free parents have no price)
        childIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  // Toggle a single child
  function toggleChild(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Derive parent checkbox state
  function parentState(group: ParentGroup): boolean | 'indeterminate' {
    if (group.children.length === 0) return false
    const selectedCount = group.children.filter((c) => checked.has(c.id)).length
    if (selectedCount === 0) return false
    if (selectedCount === group.children.length) return true
    return 'indeterminate'
  }

  // All selected paid sub-modules across all groups
  const allPaidModules = groups.flatMap((g) => g.children)
  const selectedPaid   = allPaidModules.filter((m) => checked.has(m.id))
  const selectedCount  = selectedPaid.length

  function handleNext() {
    const selectedMods: SelectedModule[] = selectedPaid.map((m) => ({
      moduleId:     m.id,
      slug:         m.slug,
      name:         m.name,
      pricePerUser: m.price_per_user,
    }))

    const subtotal   = selectedMods.reduce((sum, m) => sum + m.pricePerUser * userCount, 0)
    const taxRate    = 0.15
    const taxAmount  = subtotal * taxRate
    const total      = subtotal + taxAmount

    setSelectedModules(selectedMods)
    setPricingData({ subtotal, taxRate, taxAmount, total })
    navigate('/onboarding/billing')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading modules…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Module Selection</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Choose the modules for your workspace</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="mx-auto max-w-2xl space-y-3">
          {groups.map((group) => {
            const isOpen    = openSections.has(group.parent.slug)
            const pState    = parentState(group)
            const hasChildren = group.children.length > 0

            return (
              <Card key={group.parent.id} className="overflow-hidden">
                <Collapsible
                  open={isOpen}
                  onOpenChange={() => hasChildren && toggleSection(group.parent.slug)}
                >
                  {/* Parent row */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors select-none">
                      {/* Parent checkbox */}
                      <Checkbox
                        checked={pState === 'indeterminate' ? 'indeterminate' : pState}
                        onCheckedChange={() => toggleParent(group)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                        disabled={!hasChildren}
                      />

                      <Package className="h-4 w-4 text-blue-600 shrink-0" />

                      <span className="flex-1 font-semibold text-sm">{group.parent.name}</span>

                      {group.parent.price_per_user === 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      )}

                      {hasChildren && (
                        isOpen
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  {/* Children */}
                  {hasChildren && (
                    <CollapsibleContent>
                      <Separator />
                      <div className="divide-y">
                        {group.children.map((child) => (
                          <label
                            key={child.id}
                            className="flex items-center gap-3 px-4 py-2.5 pl-10 cursor-pointer hover:bg-accent/30 transition-colors"
                          >
                            <Checkbox
                              checked={checked.has(child.id)}
                              onCheckedChange={() => toggleChild(child.id)}
                              className="h-4 w-4"
                            />
                            <span className="flex-1 text-sm">{child.name}</span>
                            <span className="text-sm font-medium text-blue-700 whitespace-nowrap">
                              ₹{child.price_per_user.toLocaleString('en-IN')} /user/month
                            </span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg px-4 py-3">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="font-semibold text-blue-600">Selected: {selectedCount} item{selectedCount !== 1 ? 's' : ''}</span>
            {selectedCount > 0 && (
              <span className="text-muted-foreground ml-2">
                · ₹{selectedPaid.reduce((s, m) => s + m.price_per_user * userCount, 0).toLocaleString('en-IN')} /month
              </span>
            )}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleNext}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
