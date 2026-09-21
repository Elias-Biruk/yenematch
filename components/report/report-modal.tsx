'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReportReason } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportedUserId: string
  reportedUserName: string
  onSuccess?: () => void
}

export function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName, onSuccess }: ReportModalProps) {
  const t = useTranslations('reportModal')
  const tReportReasons = useTranslations('reportReasons')
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      setError(t('pleaseSelectReason'))
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId,
          reason,
          description: description.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('failedToSubmitReport'))
      }

      setSuccess(true)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('anErrorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async () => {
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: reportedUserId }),
      })

      if (response.ok) {
        onClose()
      }
    } catch (err) {
      // Block is optional, don't show error
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {!success ? (
            <>
              <h2 className="text-xl font-semibold text-ink-900 mb-4">
                {t('reportUser', { name: reportedUserName })}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">
                    {t('reasonForReporting')}
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="w-full px-4 py-2 border border-cream-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                    required
                  >
                    <option value="">{t('selectReason')}</option>
                    <option value={ReportReason.FAKE_PROFILE}>{tReportReasons('fakeProfile')}</option>
                    <option value={ReportReason.HARASSMENT}>{tReportReasons('harassment')}</option>
                    <option value={ReportReason.SPAM_SCAM}>{tReportReasons('spamScam')}</option>
                    <option value={ReportReason.SEXUAL_CONTENT}>{tReportReasons('sexualContent')}</option>
                    <option value={ReportReason.HATE_OR_DISCRIMINATION}>{tReportReasons('hateOrDiscrimination')}</option>
                    <option value={ReportReason.UNDERAGE_CONCERN}>{tReportReasons('underageConcern')}</option>
                    <option value={ReportReason.OTHER}>{tReportReasons('other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">
                    {t('descriptionOptional')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    className="w-full px-4 py-2 border border-cream-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-ink-500 mt-1">
                    {description.length}/500 {t('characters')}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !reason}
                    className="bg-burgundy-600 hover:bg-burgundy-700"
                  >
                    {loading ? t('submitting') : t('submitReport')}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-ink-900 mb-4">
                {t('reportSubmitted')}
              </h2>
              
              <div className="space-y-4">
                <p className="text-ink-700">
                  {t('thankYouForReport')}
                </p>
                
                <div className="bg-cream-300 p-4 rounded-lg">
                  <p className="text-sm text-ink-900 font-medium mb-2">
                    {t('blockUserQuestion', { name: reportedUserName })}
                  </p>
                  <p className="text-sm text-ink-700 mb-3">
                    {t('blockUserDescription')}
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="ghost"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      {t('noThanks')}
                    </Button>
                    <Button
                      onClick={handleBlock}
                      className="flex-1 bg-ink-900 hover:bg-ink-800"
                    >
                      {t('blockUser')}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full"
                >
                  {t('done')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
