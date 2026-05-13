import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OnboardingProvider } from '@/context/OnboardingContext'

import SignupPage from '@/pages/SignupPage'
import VerifyPage from '@/pages/VerifyPage'
import CompanySetupPage from '@/pages/CompanySetupPage'
import ModulesPage from '@/pages/ModulesPage'
import BillingPage from '@/pages/BillingPage'
import ReviewPage from '@/pages/ReviewPage'
import ActivatePage from '@/pages/ActivatePage'
import CheckoutPage from '@/pages/CheckoutPage'
import AddModulesPage from '@/pages/AddModulesPage'
import AddBillingPage from '@/pages/AddBillingPage'
import AddCheckoutPage from '@/pages/AddCheckoutPage'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'

export default function App() {
  return (
    <OnboardingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/onboarding/company" element={<CompanySetupPage />} />
          <Route path="/onboarding/modules" element={<ModulesPage />} />
          <Route path="/onboarding/billing" element={<BillingPage />} />
          <Route path="/onboarding/review" element={<ReviewPage />} />
          <Route path="/onboarding/activate" element={<ActivatePage />} />
          <Route path="/payment/checkout" element={<CheckoutPage />} />
          <Route path="/dashboard/add-modules" element={<AddModulesPage />} />
          <Route path="/dashboard/add-billing" element={<AddBillingPage />} />
          <Route path="/dashboard/add-checkout" element={<AddCheckoutPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<SignupPage />} />
        </Routes>
      </BrowserRouter>
    </OnboardingProvider>
  )
}
