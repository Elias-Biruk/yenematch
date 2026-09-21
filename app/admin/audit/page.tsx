'use client'

import { useEffect, useState } from 'react'
import { Shield, Ban, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  reason: string | null
  createdAt: string
  admin: {
    id: string
    firstName: string
  }
  target: {
    id: string
    firstName: string
  } | null
  reportId: string | null
}

interface AuditResponse {
  auditLogs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminAudit() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState('')
  const [targetId, setTargetId] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50',
        })
        
        if (action) params.append('action', action)
        if (targetId) params.append('targetId', targetId)

        const response = await fetch(`/api/admin/audit?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs')
        }
        const data: AuditResponse = await response.json()
        setAuditLogs(data.auditLogs)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [page, action, targetId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'USER_SUSPENDED':
        return 'User Suspended'
      case 'USER_UNSUSPENDED':
        return 'User Unsuspended'
      case 'USER_BANNED':
        return 'User Banned'
      case 'USER_UNBANNED':
        return 'User Unbanned'
      case 'REPORT_REVIEWING':
        return 'Report Reviewing'
      case 'REPORT_REVIEWED':
        return 'Report Reviewed'
      case 'REPORT_DISMISSED':
        return 'Report Dismissed'
      case 'REPORT_RESOLVED':
        return 'Report Resolved'
      case 'ADMIN_ROLE_GRANTED':
        return 'Admin Role Granted'
      case 'ADMIN_ROLE_REVOKED':
        return 'Admin Role Revoked'
      default:
        return action
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('BANNED')) return 'bg-red-100 text-red-800'
    if (action.includes('SUSPENDED')) return 'bg-yellow-100 text-yellow-800'
    if (action.includes('UNSUSPENDED') || action.includes('UNBANNED') || action.includes('RESOLVED')) return 'bg-green-100 text-green-800'
    if (action.includes('REVIEW')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DISMISSED')) return 'bg-gray-100 text-gray-800'
    if (action.includes('ADMIN')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('BANNED')) return Ban
    if (action.includes('SUSPENDED')) return Shield
    if (action.includes('UNSUSPENDED') || action.includes('UNBANNED') || action.includes('RESOLVED')) return CheckCircle
    return AlertTriangle
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading audit logs...</div>
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Moderation Audit Log</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Filter by action type..."
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Filter by target user ID..."
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log) => {
              const ActionIcon = getActionIcon(log.action)
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      <ActionIcon className="w-3 h-3 mr-1" />
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.admin.firstName}
                    </div>
                    <div className="text-xs text-gray-500">{log.admin.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.target ? (
                      <div>
                        <div className="text-sm text-gray-900">{log.target.firstName}</div>
                        <div className="text-xs text-gray-500">{log.target.id}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {log.reason || 'No reason provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.reportId ? (
                      <span className="text-sm text-gray-900">{log.reportId}</span>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {auditLogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No audit logs found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} audit logs
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Audit Logs</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All moderation actions are automatically logged</li>
              <li>Audit logs are append-only and cannot be modified</li>
              <li>Each log entry includes the admin, action, target, reason, and timestamp</li>
              <li>Use filters to search for specific actions or users</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
