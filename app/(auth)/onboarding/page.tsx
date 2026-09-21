'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { MIN_AGE, MAX_AGE } from '@/lib/constants'

type Step = 'age' | 'basic' | 'preferences' | 'photos' | 'review' | 'complete'

interface FormData {
  ageConfirmed: boolean
  firstName: string
  lastName: string
  age: string
  gender: string
  city: string
  bio: string
  interests: string[]
  photos: string[]
  preferredGender: string
  minAge: number
  maxAge: number
  preferredCity: string
  relationshipIntention: string
  openToLongDistance: boolean
  smoking: string
  drinking: string
  childrenPreference: string
  languages: string[]
}

export default function OnboardingPage() {
  const t = useTranslations('onboarding')
  const tCommon = useTranslations('common')
  const tGender = useTranslations('gender')
  const tRelIntention = useTranslations('relationshipIntention')
  const tLifestyle = useTranslations('lifestyle')
  const tChildren = useTranslations('children')
  const tApp = useTranslations('app')
  
  const router = useRouter()
  const [step, setStep] = useState<Step>('age')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    ageConfirmed: false,
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    city: '',
    bio: '',
    interests: [],
    photos: [],
    preferredGender: '',
    minAge: MIN_AGE,
    maxAge: MAX_AGE,
    preferredCity: '',
    relationshipIntention: '',
    openToLongDistance: false,
    smoking: '',
    drinking: '',
    childrenPreference: '',
    languages: [],
  })

  const [interestInput, setInterestInput] = useState('')
  const [photoInput, setPhotoInput] = useState('')

  const stepNumber = {
    'age': 1,
    'basic': 2,
    'preferences': 3,
    'photos': 4,
    'review': 5,
    'complete': 5,
  }[step] || 1

  const handleNext = async () => {
    setError(null)
    
    if (step === 'age') {
      if (!formData.ageConfirmed) {
        setError(t('pleaseConfirmAge'))
        return
      }
      setStep('basic')
    } else if (step === 'basic') {
      if (!formData.firstName || !formData.lastName || !formData.age || !formData.gender || !formData.city) {
        setError(t('fillRequiredFields'))
        return
      }
      const age = parseInt(formData.age)
      if (age < MIN_AGE || age > MAX_AGE) {
        setError(t('ageMustBeBetween', { min: MIN_AGE, max: MAX_AGE }))
        return
      }
      setStep('preferences')
    } else if (step === 'preferences') {
      if (formData.minAge > formData.maxAge) {
        setError(t('minAgeGreaterThanMax'))
        return
      }
      setStep('photos')
    } else if (step === 'photos') {
      setStep('review')
    } else if (step === 'review') {
      await submitProfile()
    }
  }

  const handleBack = () => {
    setError(null)
    if (step === 'basic') setStep('age')
    else if (step === 'preferences') setStep('basic')
    else if (step === 'photos') setStep('preferences')
    else if (step === 'review') setStep('photos')
  }

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, interestInput.trim()] })
      setInterestInput('')
    }
  }

  const removeInterest = (interest: string) => {
    setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) })
  }

  const addPhoto = () => {
    if (photoInput.trim() && !formData.photos.includes(photoInput.trim())) {
      setFormData({ ...formData, photos: [...formData.photos, photoInput.trim()] })
      setPhotoInput('')
    }
  }

  const removePhoto = (index: number) => {
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) })
  }

  const submitProfile = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: parseInt(formData.age),
          gender: formData.gender,
          city: formData.city,
          bio: formData.bio || undefined,
          interests: formData.interests.length > 0 ? formData.interests : undefined,
          photos: formData.photos.length > 0 ? formData.photos.map((url, index) => ({ url, order: index, isPrimary: index === 0 })) : undefined,
          preferredGender: formData.preferredGender || undefined,
          minAge: formData.minAge,
          maxAge: formData.maxAge,
          preferredCity: formData.preferredCity || undefined,
          relationshipIntention: formData.relationshipIntention || undefined,
          openToLongDistance: formData.openToLongDistance,
          smoking: formData.smoking || undefined,
          drinking: formData.drinking || undefined,
          childrenPreference: formData.childrenPreference || undefined,
          languages: formData.languages.length > 0 ? formData.languages : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('failedToCreateProfile'))
      }

      setStep('complete')
      setTimeout(() => {
        router.push('/discover')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('anErrorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message={t('creatingProfile')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 p-4 safe-top safe-bottom">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Logo size="lg" />
        </div>

        {/* Progress Indicator */}
        {step !== 'complete' && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-body-sm text-ink-500 mb-2">
              <span>{t('stepOf')} {stepNumber} of 5</span>
              <span className="font-medium">{Math.round((stepNumber / 5) * 100)}%</span>
            </div>
            <div className="h-2 bg-cream-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${(stepNumber / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="shadow-premium-lg">
          <CardContent className="p-6">
            {step === 'age' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-display-sm text-ink-900 mb-2">{t('welcomeToApp', { appName: tApp('name') })}</h1>
                  <p className="text-body text-ink-700">{t('confirmAge')}</p>
                </div>
                
                <label className="flex items-start space-x-3 cursor-pointer p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors">
                  <Checkbox
                    checked={formData.ageConfirmed}
                    onChange={(e) => setFormData({ ...formData, ageConfirmed: e.target.checked })}
                  />
                  <span className="text-body text-ink-700">
                    {t('confirmAge18')}
                  </span>
                </label>

                {error && <p className="text-body-sm text-burgundy-600 bg-burgundy-50 p-3 rounded-xl">{error}</p>}

                <Button onClick={handleNext} className="w-full h-12 text-base" disabled={!formData.ageConfirmed}>
                  {tCommon('next')}
                </Button>
              </div>
            )}

            {step === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-display-sm text-ink-900 mb-2">{t('tellUsAboutYou')}</h1>
                  <p className="text-body text-ink-700">{t('basicInfo')}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('firstName')}</label>
                      <Input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder={t('firstName')}
                      />
                    </div>
                    <div>
                      <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('lastName')}</label>
                      <Input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder={t('lastName')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('yourAge')}</label>
                    <Input
                      type="number"
                      min={MIN_AGE}
                      max={MAX_AGE}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder={t('enterAge', { min: MIN_AGE, max: MAX_AGE })}
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('yourGender')}</label>
                    <Select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="">{t('selectGender')}</option>
                      <option value="MALE">{tGender('male')}</option>
                      <option value="FEMALE">{tGender('female')}</option>
                      <option value="OTHER">{tGender('other')}</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('yourCity')}</label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder={t('enterCity')}
                    />
                  </div>
                </div>

                {error && <p className="text-body-sm text-burgundy-600 bg-burgundy-50 p-3 rounded-xl">{error}</p>}

                <div className="flex space-x-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                    {tCommon('back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12 text-base">
                    {tCommon('next')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-display-sm text-ink-900 mb-2">{t('yourPreferences')}</h1>
                  <p className="text-body text-ink-700">{t('whoYouWantToMeet')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('preferredGender')}</label>
                    <Select
                      value={formData.preferredGender}
                      onChange={(e) => setFormData({ ...formData, preferredGender: e.target.value })}
                    >
                      <option value="">{t('noPreference')}</option>
                      <option value="MALE">{tGender('male')}</option>
                      <option value="FEMALE">{tGender('female')}</option>
                      <option value="OTHER">{tGender('other')}</option>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('minAge')}</label>
                      <Input
                        type="number"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={formData.minAge}
                        onChange={(e) => setFormData({ ...formData, minAge: parseInt(e.target.value) || MIN_AGE })}
                      />
                    </div>
                    <div>
                      <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('maxAge')}</label>
                      <Input
                        type="number"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={formData.maxAge}
                        onChange={(e) => setFormData({ ...formData, maxAge: parseInt(e.target.value) || MAX_AGE })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('preferredCityOptional')}</label>
                    <Input
                      type="text"
                      value={formData.preferredCity}
                      onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })}
                      placeholder={t('enterPreferredCity')}
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('lookingFor')}</label>
                    <Select
                      value={formData.relationshipIntention}
                      onChange={(e) => setFormData({ ...formData, relationshipIntention: e.target.value })}
                    >
                      <option value="">{t('selectOption')}</option>
                      <option value="SERIOUS_RELATIONSHIP">{t('seriousRelationship')}</option>
                      <option value="MARRIAGE">{t('marriage')}</option>
                      <option value="LONG_TERM">{t('longTermRelationship')}</option>
                      <option value="DATING">{t('dating')}</option>
                      <option value="CASUAL_DATING">{t('casualDating')}</option>
                      <option value="FRIENDSHIP_FIRST">{t('friendshipFirst')}</option>
                      <option value="NOT_SURE">{t('notSureYet')}</option>
                    </Select>
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors">
                    <Checkbox
                      checked={formData.openToLongDistance}
                      onChange={(e) => setFormData({ ...formData, openToLongDistance: e.target.checked })}
                    />
                    <span className="text-body text-ink-700">{t('openToLongDistance')}</span>
                  </label>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('smokingPreference')}</label>
                    <Select
                      value={formData.smoking}
                      onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                    >
                      <option value="">{t('noPreference')}</option>
                      <option value="NEVER">{t('nonSmoker')}</option>
                      <option value="OCCASIONALLY">{t('occasionally')}</option>
                      <option value="REGULARLY">{t('smoker')}</option>
                      <option value="DOESNT_MATTER">{t('doesntMatter')}</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('drinkingPreference')}</label>
                    <Select
                      value={formData.drinking}
                      onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                    >
                      <option value="">{t('noPreference')}</option>
                      <option value="NEVER">{t('doesntDrink')}</option>
                      <option value="OCCASIONALLY">{t('occasionally')}</option>
                      <option value="REGULARLY">{t('regularly')}</option>
                      <option value="DOESNT_MATTER">{t('doesntMatter')}</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('childrenPreference')}</label>
                    <Select
                      value={formData.childrenPreference}
                      onChange={(e) => setFormData({ ...formData, childrenPreference: e.target.value })}
                    >
                      <option value="">{t('noPreference')}</option>
                      <option value="HAS_CHILDREN">{t('hasChildren')}</option>
                      <option value="NO_CHILDREN">{t('noChildren')}</option>
                      <option value="WANTS_CHILDREN">{t('wantsChildren')}</option>
                      <option value="DOESNT_WANT_CHILDREN">{t('doesntWantChildren')}</option>
                      <option value="MAYBE_SOMEDAY">{t('maybeSomeday')}</option>
                      <option value="NOT_SURE">{t('notSure')}</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('languagesOptional')}</label>
                    <Input
                      type="text"
                      value={formData.languages.join(', ')}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value.split(',').map(l => l.trim()).filter(l => l) })}
                      placeholder={t('languagesPlaceholder')}
                    />
                  </div>
                </div>

                {error && <p className="text-body-sm text-burgundy-600 bg-burgundy-50 p-3 rounded-xl">{error}</p>}

                <div className="flex space-x-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                    {tCommon('back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12 text-base">
                    {tCommon('next')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'photos' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-display-sm text-ink-900 mb-2">{t('addPhotos')}</h1>
                  <p className="text-body text-ink-700">{t('addPhotoUrls')}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('bioOptional')}</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder={t('writeAboutYourself')}
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-caption text-ink-500 mt-1">{formData.bio.length}/500</p>
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">{t('interestsOptional')}</label>
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        placeholder={t('addInterest')}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      />
                      <Button onClick={addInterest} variant="outline" size="sm">
                        {tCommon('add')}
                      </Button>
                    </div>
                    {formData.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.interests.map((interest) => (
                          <span
                            key={interest}
                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-200"
                          >
                            {interest}
                            <button
                              onClick={() => removeInterest(interest)}
                              className="ml-2 text-emerald-500 hover:text-emerald-700 font-medium"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-ink-900 mb-2">Photo URLs (optional)</label>
                    <div className="flex space-x-2">
                      <Input
                        type="url"
                        value={photoInput}
                        onChange={(e) => setPhotoInput(e.target.value)}
                        placeholder="Enter photo URL"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                      />
                      <Button onClick={addPhoto} variant="outline" size="sm">
                        {tCommon('add')}
                      </Button>
                    </div>
                    {formData.photos.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {formData.photos.map((photo, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-cream-100 rounded-xl text-body-sm">
                            <span className="truncate text-ink-700">{photo}</span>
                            <button
                              onClick={() => removePhoto(index)}
                              className="text-burgundy-600 hover:text-burgundy-700 ml-2 font-medium"
                            >
                              {tCommon('remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-caption text-ink-500 bg-cream-50 p-3 rounded-xl">{t('devPhotoNote')}</p>

                {error && <p className="text-body-sm text-burgundy-600 bg-burgundy-50 p-3 rounded-xl">{error}</p>}

                <div className="flex space-x-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                    {tCommon('back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12 text-base">
                    {tCommon('next')}
                  </Button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-display-sm text-ink-900 mb-2">Review your profile</h1>
                  <p className="text-body text-ink-700">Check your information before submitting.</p>
                </div>

                <div className="space-y-3 bg-cream-50 p-5 rounded-2xl text-body-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-ink-900">Name</p>
                      <p className="text-ink-700">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">Age</p>
                      <p className="text-ink-700">{formData.age}</p>
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">Gender</p>
                      <p className="text-ink-700">{formData.gender}</p>
                    </div>
                    <div>
                      <p className="font-medium text-ink-900">City</p>
                      <p className="text-ink-700">{formData.city}</p>
                    </div>
                  </div>
                  {formData.bio && (
                    <div>
                      <p className="font-medium text-ink-900">Bio</p>
                      <p className="text-ink-700">{formData.bio}</p>
                    </div>
                  )}
                  {formData.interests.length > 0 && (
                    <div>
                      <p className="font-medium text-ink-900">Interests</p>
                      <p className="text-ink-700">{formData.interests.join(', ')}</p>
                    </div>
                  )}
                  {formData.photos.length > 0 && (
                    <div>
                      <p className="font-medium text-ink-900">Photos</p>
                      <p className="text-ink-700">{formData.photos.length} photo(s)</p>
                    </div>
                  )}
                  {formData.preferredGender && (
                    <div>
                      <p className="font-medium text-ink-900">Preferred gender</p>
                      <p className="text-ink-700">{formData.preferredGender}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-ink-900">Age range</p>
                    <p className="text-ink-700">{formData.minAge} - {formData.maxAge}</p>
                  </div>
                  {formData.preferredCity && (
                    <div>
                      <p className="font-medium text-ink-900">Preferred city</p>
                      <p className="text-ink-700">{formData.preferredCity}</p>
                    </div>
                  )}
                  {formData.relationshipIntention && (
                    <div>
                      <p className="font-medium text-ink-900">Looking for</p>
                      <p className="text-ink-700">{formData.relationshipIntention.replace(/_/g, ' ').toLowerCase()}</p>
                    </div>
                  )}
                  {formData.languages.length > 0 && (
                    <div>
                      <p className="font-medium text-ink-900">Languages</p>
                      <p className="text-ink-700">{formData.languages.join(', ')}</p>
                    </div>
                  )}
                </div>

                {error && <p className="text-body-sm text-burgundy-600 bg-burgundy-50 p-3 rounded-xl">{error}</p>}

                <div className="flex space-x-3">
                  <Button onClick={handleBack} variant="outline" className="flex-1 h-12 text-base">
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12 text-base" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Profile'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 text-white text-4xl font-bold">✓</div>
                <div>
                  <h1 className="text-display-sm text-ink-900 mb-2">Profile created!</h1>
                  <p className="text-body text-ink-700">You're all set to start finding matches.</p>
                </div>
                <LoadingState message="Redirecting..." />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
