import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Globe,
  Mail,
  Receipt,
  MapPin,
  Coins,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { apiUrl } from '@/lib/api'
import { useOnboarding } from '@/context/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Singapore', 'UAE', 'Other',
]

const ROLES = [
  { value: 'superadmin', label: 'SuperAdmin' },
  { value: 'admin',      label: 'Admin' },
  { value: 'user',       label: 'User' },
  { value: 'viewer',     label: 'Viewer' },
]

interface FormRow {
  id: keyof FormState
  label: string
  icon: React.ReactNode
  type: 'text' | 'email' | 'number' | 'select-country' | 'select-role' | 'readonly'
  placeholder?: string
  defaultValue?: string | number
}

interface FormState {
  name: string
  domain: string
  primaryEmail: string
  billingEmail: string
  country: string
  currency: string
  userRole: string
  userCount: string
}

const formRows: FormRow[] = [
  { id: 'name',         label: 'Company Name',       icon: <Building2 className="h-4 w-4" />,   type: 'text',           placeholder: 'Company Instance' },
  { id: 'domain',       label: 'Company Domain',     icon: <Globe className="h-4 w-4" />,        type: 'text',           placeholder: '@bids/company.com' },
  { id: 'primaryEmail', label: 'Primary User Email', icon: <Mail className="h-4 w-4" />,         type: 'email',          placeholder: 'admin@company.com' },
  { id: 'billingEmail', label: 'Billing User Email', icon: <Receipt className="h-4 w-4" />,      type: 'email',          placeholder: 'billing@company.com' },
  { id: 'country',      label: 'Country',            icon: <MapPin className="h-4 w-4" />,       type: 'select-country', defaultValue: 'India' },
  { id: 'currency',     label: 'Currency',           icon: <Coins className="h-4 w-4" />,        type: 'readonly',       defaultValue: 'INR - Indian Rupee' },
  { id: 'userRole',     label: 'User Role',          icon: <ShieldCheck className="h-4 w-4" />, type: 'select-role',    defaultValue: 'superadmin' },
  { id: 'userCount',    label: 'Number of Users',    icon: <Users className="h-4 w-4" />,        type: 'number',         placeholder: '8', defaultValue: '8' },
]

export default function CompanySetupPage() {
  const navigate = useNavigate()
  const { setCompanyData } = useOnboarding()

  const [form, setForm] = useState<FormState>({
    name:         '',
    domain:       '',
    primaryEmail: '',
    billingEmail: '',
    country:      'India',
    currency:     'INR - Indian Rupee',
    userRole:     'superadmin',
    userCount:    '8',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function setField(id: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.primaryEmail) {
      setError('Company name and primary email are required.')
      return
    }
    setLoading(true)
    setError(null)

    const payload = {
      name:         form.name,
      domain:       form.domain,
      primaryEmail: form.primaryEmail,
      billingEmail: form.billingEmail,
      country:      form.country,
      currency:     form.currency,
      userRole:     form.userRole,
      userCount:    Number(form.userCount) || 8,
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      await fetch(apiUrl('/api/workspace/company'), {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
    } catch {
      // Non-blocking — backend may not be running yet during frontend dev
    }

    setCompanyData(payload)
    navigate('/onboarding/modules')
    setLoading(false)
  }

  function renderInput(row: FormRow) {
    switch (row.type) {
      case 'select-country':
        return (
          <Select value={form[row.id] as string} onValueChange={(v) => setField(row.id, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'select-role':
        return (
          <Select value={form[row.id] as string} onValueChange={(v) => setField(row.id, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'readonly':
        return (
          <Input
            value={form[row.id] as string}
            readOnly
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
        )
      default:
        return (
          <Input
            type={row.type}
            placeholder={row.placeholder}
            value={form[row.id] as string}
            onChange={(e) => setField(row.id, e.target.value)}
            disabled={loading}
            min={row.type === 'number' ? 1 : undefined}
          />
        )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Company Workspace</CardTitle>
          <p className="text-sm text-muted-foreground">Tell us about your organisation</p>
        </CardHeader>

        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {formRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[180px_1fr] items-center gap-4"
              >
                {/* Left: icon + label */}
                <Label
                  htmlFor={row.id}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <span className="text-foreground">{row.icon}</span>
                  {row.label}
                </Label>

                {/* Right: input */}
                <div id={row.id}>
                  {renderInput(row)}
                </div>
              </div>
            ))}

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Save & Continue →'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
