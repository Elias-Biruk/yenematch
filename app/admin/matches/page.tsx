'use client'

import { useEffect, useState } from 'react'
import { Heart, MessageSquare, AlertTriangle, Search, Filter } from 'lucide-react'

interface Match {
  id: string
  status: string
  createdAt: string
  user1: {
    id: string
    firstName: string
    lastName: string | null
    username: string | null
    role: string
    profile: {
      id: string
      age: number
      gender: string
      city: string
      moderationStatus: string
    } | null
  }
  user2: {
    id: string
    firstName: string
    lastName: string | null
    username: string | null
    role: string
    profile: {
      id: string
      age: number
      gender: string
      city: string
      moderationStatus: string
    } | null
  }
  _count: {
    messages: number
  }
}

interface MatchesResponse {
  matches: Match[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    async function fetchMatches() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        })
        
        if (status !== 'ALL') params.append('status', status)
        if (sortBy !== 'createdAt') params.append('sortBy', sortBy)
        if (sortOrder !== 'desc') params.append('sortOrder', sortOrder)

        const response = await fetch(`/api/admin/matches?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch matches')
        }
        const data: MatchesResponse = await response.json()
        setMatches(data.matches)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [page, status, sortBy, sortOrder])

  const resetFilters = () => {
    setStatus('ALL')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'UNMATCHED':
        return 'bg-gray-100 text-gray-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading matches...</div>
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Match Administration</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="UNMATCHED">Unmatched</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Date</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User 1
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User 2
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {match.user1.firstName} {match.user1.lastName || ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.user1.username || 'No username'}
                  </div>
                  {match.user1.profile && (
                    <div className="text-xs text-gray-400">
                      {match.user1.profile.age} yrs • {match.user1.profile.gender} • {match.user1.profile.city}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {match.user1.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {match.user2.firstName} {match.user2.lastName || ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.user2.username || 'No username'}
                  </div>
                  {match.user2.profile && (
                    <div className="text-xs text-gray-400">
                      {match.user2.profile.age} yrs • {match.user2.profile.gender} • {match.user2.profile.city}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {match.user2.role}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                    {match.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {match._count.messages}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(match.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No matches found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} matches
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
            <p className="font-medium mb-1">About Match Administration</p>
            <ul className="list-disc list-inside space-y-1">
              <li>View all matches between users in the system</li>
              <li>Filter by match status (active, unmatched, blocked)</li>
              <li>See message counts for each match</li>
              <li>Monitor user connection patterns and activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
