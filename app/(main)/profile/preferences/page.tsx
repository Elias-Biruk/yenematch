'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { ArrowLeft, Save } from 'lucide-react'
import { MIN_AGE, MAX_AGE } from '@/lib/constants'

interface Preferences {
  preferredGender: string | null
  minAge: number
  maxAge: number
  preferredCity: string | null
  relationshipIntention: string | null
  openToLongDistance: boolean
  smoking: string | null
  drinking: string | null
  childrenPreference: string | null
  languages: string[]
}

export default function EditPreferencesPage() {
  const router = useRouter()
  const t = useTranslations('preferences')
  const tCommon = useTranslations('common')
  const tValidation = useTranslations('validation')
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    preferredGender: '',
    minAge: '',
    maxAge: '',
    preferredCity: '',
    relationshipIntention: '',
    openToLongDistance: false,
    smoking: '',
    drinking: '',
    childrenPreference: '',
    languages: '',
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences')
      if (!response.ok) {
        throw new Error(tCommon('error'))
      }
      const data = await response.json()
      setPreferences(data)
      setFormData({
        preferredGender: data.preferredGender || '',
        minAge: data.minAge?.toString() || '',
        maxAge: data.maxAge?.toString() || '',
        preferredCity: data.preferredCity || '',
        relationshipIntention: data.relationshipIntention || '',
        openToLongDistance: data.openToLongDistance || false,
        smoking: data.smoking || '',
        drinking: data.drinking || '',
        childrenPreference: data.childrenPreference || '',
        languages: data.languages?.join(', ') || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const minAge = parseInt(formData.minAge) || MIN_AGE
      const maxAge = parseInt(formData.maxAge) || MAX_AGE

      if (minAge < MIN_AGE || maxAge > MAX_AGE) {
        throw new Error(tValidation('ageRange', { min: MIN_AGE, max: MAX_AGE }))
      }

      if (minAge > maxAge) {
        throw new Error(tValidation('minAgeLessThanMax'))
      }

      const response = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredGender: formData.preferredGender || undefined,
          minAge,
          maxAge,
          preferredCity: formData.preferredCity || undefined,
          relationshipIntention: formData.relationshipIntention || undefined,
          openToLongDistance: formData.openToLongDistance,
          smoking: formData.smoking || undefined,
          drinking: formData.drinking || undefined,
          childrenPreference: formData.childrenPreference || undefined,
          languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(l => l) : [],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || tCommon('error'))
      }

      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message={tCommon('loading')} />
      </div>
    )
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          message={error}
          onRetry={fetchPreferences}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 border-b border-cream-400 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-ink-900 ml-2">{t('editPreferences')}</h1>
        </div>

        {/* Form */}
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">{t('interestedIn')}</label>
                  <Select
                    value={formData.preferredGender}
                    onChange={(e) => setFormData({ ...formData, preferredGender: e.target.value })}
                  >
                    <option value="">{t('noPreference')}</option>
                    <option value="MALE">{t('men')}</option>
                    <option value="FEMALE">{t('women')}</option>
                    <option value="OTHER">{t('other')}</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-900 mb-2">{t('minAge')}</label>
                    <Input
                      type="number"
                      min={MIN_AGE}
                      max={MAX_AGE}
                      value={formData.minAge}
                      onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                      placeholder={MIN_AGE.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-900 mb-2">{t('maxAge')}</label>
                    <Input
                      type="number"
                      min={MIN_AGE}
                      max={MAX_AGE}
                      value={formData.maxAge}
                      onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                      placeholder={MAX_AGE.toString()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">{t('preferredCity')}</label>
                  <Input
                    type="text"
                    value={formData.preferredCity}
                    onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                    placeholder={t('enterPreferredCity')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">{t('relationshipIntention')}</label>
                  <Select
                    value={formData.relationshipIntention}
                    onChange={(e) => setFormData({ ...formData, relationshipIntention: e.target.value })}
                  >
                    <option value="">{t('noPreference')}</option>
                    <option value="SERIOUS_RELATIONSHIP">Serious Relationship</option>
                    <option value="MARRIAGE">Marriage</option>
                    <option value="LONG_TERM">Long Term</option>
                    <option value="DATING">Dating</option>
                    <option value="CASUAL_DATING">Casual Dating</option>
                    <option value="FRIENDSHIP_FIRST">Friendship First</option>
                    <option value="NOT_SURE">Not Sure</option>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="openToLongDistance"
                    checked={formData.openToLongDistance}
                    onChange={(e) => setFormData({ ...formData, openToLongDistance: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="openToLongDistance" className="text-sm text-ink-900">
                    {t('openToLongDistance')}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">{t('smoking')}</label>
                  <Select
                    value={formData.smoking}
                    onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                  >
                    <option value="">{t('noPreference')}</option>
                    <option value="NEVER">Never</option>
                    <option value="OCCASIONALLY">Occasionally</option>
                    <option value="REGULARLY">Regularly</option>
                    <option value="DOESNT_MATTER">Doesn&apos;t matter</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">{t('drinking')}</label>
                  <Select
                    value={formData.drinking}
                    onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                  >
                    <option value="">{t('noPreference')}</option>
                    <option value="NEVER">Never</option>
                    <option value="OCCASIONALLY">Occasionally</option>
                    <option value="REGULARLY">Regularly</option>
                    <option value="DOESNT_MATTER">Doesn&apos;t matter</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">{t('childrenPreference')}</label>
                  <Select
                    value={formData.childrenPreference}
                    onChange={(e) => setFormData({ ...formData, childrenPreference: e.target.value })}
                  >
                    <option value="">{t('noPreference')}</option>
                    <option value="HAS_CHILDREN">Has children</option>
                    <option value="NO_CHILDREN">No children</option>
                    <option value="WANTS_CHILDREN">Wants children</option>
                    <option value="DOESNT_WANT_CHILDREN">Does not want children</option>
                    <option value="MAYBE_SOMEDAY">Maybe someday</option>
                    <option value="NOT_SURE">Not sure</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Languages</label>
                  <Input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="Enter languages separated by commas"
                  />
                  <p className="text-sm text-ink-500 mt-1">Separate multiple languages with commas (e.g., English, Amharic, French)</p>
                </div>

                {error && <p className="text-sm text-burgundy-500">{error}</p>}

                <Button type="submit" className="w-full" disabled={saving}>
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
