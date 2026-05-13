import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export interface CompanyData {
  name: string
  domain: string
  primaryEmail: string
  billingEmail: string
  country: string
  currency: string
  userRole: string
  userCount: number
}

export interface SelectedModule {
  moduleId: string
  slug: string
  name: string
  pricePerUser: number
}

export interface PricingData {
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
}

export interface PaymentData {
  orderId: string
  paymentId: string
  status: string
}

interface OnboardingContextValue {
  companyData: CompanyData | null
  setCompanyData: (data: CompanyData) => void
  selectedModules: SelectedModule[]
  setSelectedModules: (modules: SelectedModule[]) => void
  pricingData: PricingData | null
  setPricingData: (data: PricingData) => void
  paymentData: PaymentData | null
  setPaymentData: (data: PaymentData) => void
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [companyData, _setCompanyData]       = useState<CompanyData | null>(() => load('ob_company', null))
  const [selectedModules, _setSelectedModules] = useState<SelectedModule[]>(() => load('ob_modules', []))
  const [pricingData, _setPricingData]       = useState<PricingData | null>(() => load('ob_pricing', null))
  const [paymentData, _setPaymentData]       = useState<PaymentData | null>(() => load('ob_payment', null))

  function setCompanyData(data: CompanyData) {
    persist('ob_company', data)
    _setCompanyData(data)
  }
  function setSelectedModules(modules: SelectedModule[]) {
    persist('ob_modules', modules)
    _setSelectedModules(modules)
  }
  function setPricingData(data: PricingData) {
    persist('ob_pricing', data)
    _setPricingData(data)
  }
  function setPaymentData(data: PaymentData) {
    persist('ob_payment', data)
    _setPaymentData(data)
  }

  return (
    <OnboardingContext.Provider
      value={{
        companyData,
        setCompanyData,
        selectedModules,
        setSelectedModules,
        pricingData,
        setPricingData,
        paymentData,
        setPaymentData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
