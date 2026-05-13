import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, MessageCircle, Phone, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type OTPMethod = 'email' | 'whatsapp' | 'phone'

interface OTPOption {
  id: OTPMethod
  label: string
  icon: React.ReactNode
  description: string
  disabled: boolean
}

const otpOptions: OTPOption[] = [
  {
    id: 'email',
    label: 'Email OTP',
    icon: <Mail className="h-5 w-5" />,
    description: 'Sent to your email',
    disabled: false,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp OTP',
    icon: <MessageCircle className="h-5 w-5 text-green-600" />,
    description: 'Coming soon',
    disabled: true,
  },
  {
    id: 'phone',
    label: 'Phone Call OTP',
    icon: <Phone className="h-5 w-5 text-blue-600" />,
    description: 'Coming soon',
    disabled: true,
  },
]

export default function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email ?? ''

  const [selectedMethod, setSelectedMethod] = useState<OTPMethod>('email')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResendOTP() {
    if (!email) return
    setResending(true)
    setResent(false)
    setError(null)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setError(error.message)
    } else {
      setResent(true)
    }
    setResending(false)
  }

  async function handleVerify() {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (error) {
      setError(error.message)
    } else {
      navigate('/onboarding/company')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
          <CardDescription>Select how you want to receive your OTP</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          {/* OTP method selector */}
          <div className="grid grid-cols-3 gap-2">
            {otpOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => !option.disabled && setSelectedMethod(option.id)}
                disabled={option.disabled}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all',
                  option.disabled
                    ? 'border-input bg-muted/50 cursor-not-allowed opacity-60'
                    : 'hover:bg-accent',
                  !option.disabled && selectedMethod === option.id
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                    : 'border-input bg-background'
                )}
              >
                {option.disabled && (
                  <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                )}
                {option.icon}
                <span className="text-xs font-medium leading-tight">{option.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{option.description}</span>
              </button>
            ))}
          </div>

          {/* OTP input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Enter OTP</label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              className="text-center text-lg tracking-[0.5em] font-mono"
            />
            {email && (
              <p className="text-xs text-muted-foreground text-center">
                OTP sent to <span className="font-medium">{email}</span>
              </p>
            )}
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
          >
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            {resent ? (
              <p className="text-sm text-green-600 font-medium">OTP resent to {email}</p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={resending}
                className="text-blue-600"
              >
                {resending ? 'Resending…' : 'Resend OTP'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
