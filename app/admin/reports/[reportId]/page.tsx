'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle, User, Eye } from 'lucide-react'

interface ReportDetail {
  id: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reporter: {
    id: string
    firstName: string
  }
  reported: {
    id: string
    firstName: string
    profile: {
      id: string
      moderationStatus: string
    } | null
  }
}

export default function ReportDetail({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter()
  const [reportId, setReportId] = useState<string>('')
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    params.then(p => setReportId(p.reportId))
  }, [params])

  useEffect(() => {
    if (!reportId) return

    async function fetchReport() {
      try {
        const response = await fetch(`/api/admin/reports/${reportId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch report')
        }
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [reportId])

  const handleStatusChange = async (newStatus: string) => {
    if (!reportId) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: newStatus.toLowerCase(),
          reason: reason || `Status changed to ${newStatus}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update report status')
      }

      // Refresh report data
      const reportResponse = await fetch(`/api/admin/reports/${reportId}`)
      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setReport(reportData)
      }

      setReason('')
      alert('Report status updated successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800'
      case 'REVIEWING':
        return 'bg-blue-100 text-blue-800'
      case 'REVIEWED':
        return 'bg-purple-100 text-purple-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'DISMISSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'FAKE_PROFILE':
        return 'Fake Profile'
      case 'HARASSMENT':
        return 'Harassment'
      case 'SPAM_SCAM':
        return 'Spam/Scam'
      case 'SEXUAL_CONTENT':
        return 'Sexual Content'
      case 'HATE_OR_DISCRIMINATION':
        return 'Hate/Discrimination'
      case 'UNDERAGE_CONCERN':
        return 'Underage Concern'
      case 'OTHER':
        return 'Other'
      default:
        return reason
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading report...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Report not found</div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Reports
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                <p className="text-gray-600">Report ID: {report.id}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-gray-500">Reported On</p>
                <p className="font-medium text-gray-900">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Reason</p>
                <p className="font-medium text-gray-900">{getReasonLabel(report.reason)}</p>
              </div>
            </div>

            {report.description && (
              <div>
                <p className="text-gray-500 text-sm mb-1">Description</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{report.description}</p>
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Reporter
              </h3>
              <div className="text-sm">
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{report.reporter.firstName}</p>
                <p className="text-gray-500 mt-2">User ID</p>
                <p className="font-medium text-gray-900">{report.reporter.id}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Reported User
              </h3>
              <div className="text-sm">
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{report.reported.firstName}</p>
                <p className="text-gray-500 mt-2">User ID</p>
                <p className="font-medium text-gray-900">{report.reported.id}</p>
                {report.reported.profile && (
                  <>
                    <p className="text-gray-500 mt-2">Current Status</p>
                    <p className="font-medium text-gray-900">{report.reported.profile.moderationStatus}</p>
                  </>
                )}
              </div>
              <a
                href={`/admin/users/${report.reported.id}`}
                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-900 text-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Profile
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Actions</h3>
            
            <div className="space-y-4">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add notes or reason for status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />

              <div className="space-y-2">
                {report.status === 'PENDING' && (
                  <button
                    onClick={() => handleStatusChange('REVIEWING')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Mark as Reviewing
                  </button>
                )}

                {(report.status === 'PENDING' || report.status === 'REVIEWING') && (
                  <>
                    <button
                      onClick={() => handleStatusChange('REVIEWED')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => handleStatusChange('RESOLVED')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange('DISMISSED')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Dismiss Report
                    </button>
                  </>
                )}

                {report.status === 'REVIEWED' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('RESOLVED')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => handleStatusChange('DISMISSED')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Dismiss Report
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Review Guidelines</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Review the reported user's profile before taking action</li>
                  <li>Consider the severity of the reported issue</li>
                  <li>Use suspend for minor violations that need review</li>
                  <li>Use ban for severe or repeated violations</li>
                  <li>All actions are logged in the audit trail</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
