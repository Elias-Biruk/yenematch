'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tApp = useTranslations('app')
  const router = useRouter()
  const [devAuthEnabled, setDevAuthEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isTelegramReady, setIsTelegramReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOutsideTelegram, setIsOutsideTelegram] = useState(false)
  const [detectedTelegram, setDetectedTelegram] = useState(false)

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
    if (typeof window !== 'undefined') {
      let foundTelegram = false
      const checkInterval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          clearInterval(checkInterval)
          foundTelegram = true
          setDetectedTelegram(true)
          setIsTelegramReady(true)
          window.Telegram.WebApp.ready()
          window.Telegram.WebApp.expand()
          
          // Auto-attempt authentication when in Telegram
          attemptTelegramAuth()
        }
      }, 100)

      // After 5 seconds, if no Telegram found, show button
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!foundTelegram) {
          setIsOutsideTelegram(true)
        }
      }, 5000)
    }
  }

  const attemptTelegramAuth = async () => {
    if (!window.Telegram?.WebApp) {
      console.log('Telegram WebApp not available')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const initData = window.Telegram.WebApp.initData

      console.log('initData present:', !!initData)
      console.log('initData length:', initData?.length || 0)
      console.log('initData preview:', initData?.substring(0, 100) + '...')

      if (!initData) {
        throw new Error('Telegram initialization data not available')
      }

      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })

      console.log('Auth response status:', response.status)
      console.log('Auth response ok:', response.ok)

      if (!response.ok) {
        const data = await response.json()
        console.error('Auth error response:', data)
        throw new Error(data.error || t('loginFailed'))
      }

      const result = await response.json()
      console.log('Auth result:', { isNewUser: result.isNewUser, hasUser: !!result.user })

      if (result.isNewUser) {
        router.push('/onboarding')
      } else {
        router.push('/discover')
      }
    } catch (error) {
      console.error('Telegram authentication error:', error)
      const errorMessage = error instanceof Error ? error.message : t('loginFailed')
      setError(errorMessage)
      // Don't set isOutsideTelegram on error - we're still in Telegram
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramLogin = async () => {
    if (!isTelegramReady) {
      alert(t('openInTelegram'))
      return
    }

    await attemptTelegramAuth()
  }

  const handleDevLogin = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('loginFailed'))
      }

      router.push('/discover')
    } catch (error) {
      console.error('Dev login error:', error)
      alert(error instanceof Error ? error.message : t('auth.loginFailed'))
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
            {tApp('name')}
          </h1>
          <p className="text-ink-700 text-xl">
            {tApp('tagline')}
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-ink-900 text-center">
              {tCommon('welcome')}
            </h2>
            <p className="text-ink-700 text-center">
              {t('signInToStart')}
            </p>

            {/* Auto-authenticating in Telegram */}
            {loading && detectedTelegram && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="text-sm text-ink-600 mt-2">{t('authenticating')}</p>
              </div>
            )}

            {/* Manual Telegram Login (only shown when not in Telegram) */}
            {!loading && isOutsideTelegram && (
              <>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  size="lg"
                  onClick={handleTelegramLogin}
                  disabled={loading}
                >
                  {loading ? t('authenticatingWithTelegram') : t('continueWithTelegram')}
                </Button>

                <p className="text-xs text-ink-500 text-center">
                  {t('openInTelegram')}
                </p>
              </>
            )}

            {/* Retry button when in Telegram but auth failed */}
            {!loading && detectedTelegram && error && (
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
                onClick={handleTelegramLogin}
                disabled={loading}
              >
                {loading ? t('authenticatingWithTelegram') : t('retryAuth')}
              </Button>
            )}

            {/* Error display */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 text-center">{error}</p>
              </div>
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
                      {t('developmentMode')}
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
                  {loading ? t('loggingIn') : t('devLogin')}
                </Button>

                <p className="text-xs text-ink-500 text-center">
                  {t('devAuthDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-ink-500 mt-6">
          {t('termsAndPrivacy')}
        </p>
      </div>
    </div>
  )
}
