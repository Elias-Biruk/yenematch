'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReportReason } from '@prisma/client'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportedUserId: string
  reportedUserName: string
  onSuccess?: () => void
}

export function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName, onSuccess }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      setError('Please select a reason')
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
        throw new Error(data.error || 'Failed to submit report')
      }

      setSuccess(true)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
                Report {reportedUserName}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">
                    Reason for reporting
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="w-full px-4 py-2 border border-cream-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value={ReportReason.FAKE_PROFILE}>Fake Profile</option>
                    <option value={ReportReason.HARASSMENT}>Harassment</option>
                    <option value={ReportReason.SPAM_SCAM}>Spam/Scam</option>
                    <option value={ReportReason.SEXUAL_CONTENT}>Sexual Content</option>
                    <option value={ReportReason.HATE_OR_DISCRIMINATION}>Hate/Discrimination</option>
                    <option value={ReportReason.UNDERAGE_CONCERN}>Underage Concern</option>
                    <option value={ReportReason.OTHER}>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide any additional details..."
                    className="w-full px-4 py-2 border border-cream-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-ink-500 mt-1">
                    {description.length}/500 characters
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !reason}
                    className="bg-burgundy-600 hover:bg-burgundy-700"
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-ink-900 mb-4">
                Report Submitted
              </h2>
              
              <div className="space-y-4">
                <p className="text-ink-700">
                  Thank you for your report. Our team will review it and take appropriate action.
                </p>
                
                <div className="bg-cream-300 p-4 rounded-lg">
                  <p className="text-sm text-ink-900 font-medium mb-2">
                    Would you like to block {reportedUserName}?
                  </p>
                  <p className="text-sm text-ink-700 mb-3">
                    Blocking will prevent them from appearing in your discovery and messaging.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="ghost"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      No Thanks
                    </Button>
                    <Button
                      onClick={handleBlock}
                      className="flex-1 bg-ink-900 hover:bg-ink-800"
                    >
                      Block User
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
