'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [devAuthEnabled, setDevAuthEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isTelegramReady, setIsTelegramReady] = useState(false)

  useEffect(() => {
    checkDevAuthStatus()
    checkTelegramReady()
  }, [])

  const checkDevAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/dev-status')
      const data = await response.json()
      setDevAuthEnabled(data.enabled)
    } catch (error) {
      console.error('Failed to check dev auth status:', error)
    }
  }

  const checkTelegramReady = () => {
    // Check if running in Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setIsTelegramReady(true)
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }

  const handleTelegramLogin = async () => {
    if (!isTelegramReady) {
      alert('Please open this app through Telegram')
      return
    }

    try {
      setLoading(true)
      const initData = window.Telegram?.WebApp?.initData

      if (!initData) {
        throw new Error('Telegram initialization data not available')
      }

      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Telegram authentication failed')
      }

      const result = await response.json()

      if (result.isNewUser) {
        router.push('/onboarding')
      } else {
        router.push('/discover')
      }
    } catch (error) {
      console.error('Telegram login error:', error)
      alert(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Development login failed')
      }

      router.push('/discover')
    } catch (error) {
      console.error('Dev login error:', error)
      alert(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-emerald-500 mb-3">
            YeneMatch
          </h1>
          <p className="text-ink-700 text-xl">
            Find Your Yene
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-ink-900 text-center">
              Welcome
            </h2>
            <p className="text-ink-700 text-center">
              Sign in to start discovering amazing people
            </p>

            {/* Telegram Login */}
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              size="lg"
              onClick={handleTelegramLogin}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Continue with Telegram'}
            </Button>

            {!isTelegramReady && (
              <p className="text-xs text-ink-500 text-center">
                Open this app through Telegram for authentication
              </p>
            )}

            {/* Development Login */}
            {devAuthEnabled && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-cream-400" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-ink-500">
                      Development Mode
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleDevLogin}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Dev Login (Skip Auth)'}
                </Button>

                <p className="text-xs text-ink-500 text-center">
                  Development authentication is enabled. This is for local testing only.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-ink-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
