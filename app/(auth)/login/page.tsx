'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Sparkles } from 'lucide-react'

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
          
          attemptTelegramAuth()
        }
      }, 100)

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
        throw new Error(data.error || t('loginFailed'))
      }

      const result = await response.json()

      if (result.isNewUser) {
        router.push('/onboarding')
      } else {
        router.push('/discover')
      }
    } catch (error) {
      console.error('Telegram authentication error:', error)
      const errorMessage = error instanceof Error ? error.message : t('loginFailed')
      setError(errorMessage)
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
    <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 shadow-premium-lg mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-display text-emerald-500">
            {tApp('name')}
          </h1>
          <p className="text-body text-ink-700 max-w-xs mx-auto">
            {tApp('tagline')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-premium-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-h2 text-ink-900">
                {tCommon('welcome')}
              </h2>
              <p className="text-body-sm text-ink-600">
                {t('signInToStart')}
              </p>
            </div>

            {/* Auto-authenticating in Telegram */}
            {loading && detectedTelegram && (
              <div className="text-center py-8 space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                  <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-body-sm text-ink-600">{t('authenticating')}</p>
              </div>
            )}

            {/* Manual Telegram Login */}
            {!loading && isOutsideTelegram && (
              <div className="space-y-4">
                <Button
                  className="w-full h-14 text-base bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl shadow-sm"
                  size="lg"
                  onClick={handleTelegramLogin}
                  disabled={loading}
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  {loading ? t('authenticatingWithTelegram') : t('continueWithTelegram')}
                </Button>

                <div className="flex items-center justify-center space-x-2 text-caption text-ink-500">
                  <Lock className="w-3 h-3" />
                  <p>{t('openInTelegram')}</p>
                </div>
              </div>
            )}

            {/* Retry button */}
            {!loading && detectedTelegram && error && (
              <Button
                className="w-full h-14 text-base bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl shadow-sm"
                size="lg"
                onClick={handleTelegramLogin}
                disabled={loading}
              >
                {loading ? t('authenticatingWithTelegram') : t('retryAuth')}
              </Button>
            )}

            {/* Error display */}
            {error && !loading && (
              <div className="bg-burgundy-50 border-2 border-burgundy-200 rounded-xl p-4 animate-slide-down">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-burgundy-600 mt-0.5 flex-shrink-0" />
                  <p className="text-body-sm text-burgundy-700">{error}</p>
                </div>
              </div>
            )}

            {/* Development Login */}
            {devAuthEnabled && (
              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-cream-400" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-caption text-ink-500 font-medium">
                      {t('developmentMode')}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  size="lg"
                  onClick={handleDevLogin}
                  disabled={loading}
                >
                  {loading ? t('loggingIn') : t('devLogin')}
                </Button>

                <p className="text-caption text-ink-500 text-center">
                  {t('devAuthDescription')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-caption text-ink-500">
          {t('termsAndPrivacy')}
        </p>
      </div>
    </div>
  )
}
