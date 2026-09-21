'use client'

import { useEffect, useState } from 'react'
import { Search, Shield, Ban, CheckCircle, AlertTriangle, Eye } from 'lucide-react'

interface User {
  id: string
  telegramId: string
  firstName: string
  lastName: string | null
  username: string | null
  role: string
  createdAt: string
  updatedAt: string
  isSeed: boolean
  profile: {
    id: string
    age: number
    gender: string
    city: string
    moderationStatus: string
    completedOnboarding: boolean
    createdAt: string
  } | null
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [gender, setGender] = useState('ALL')
  const [userType, setUserType] = useState('ALL')
  const [role, setRole] = useState('ALL')
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
    async function fetchUsers() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        })
        
        if (search) params.append('search', search)
        if (status !== 'ALL') params.append('status', status)
        if (gender !== 'ALL') params.append('gender', gender)
        if (userType !== 'ALL') params.append('userType', userType)
        if (role !== 'ALL') params.append('role', role)
        if (sortBy !== 'createdAt') params.append('sortBy', sortBy)
        if (sortOrder !== 'desc') params.append('sortOrder', sortOrder)

        const response = await fetch(`/api/admin/users?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [page, search, status, gender, userType, role, sortBy, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('ALL')
    setGender('ALL')
    setUserType('ALL')
    setRole('ALL')
    setSortBy('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700'
      case 'SUSPENDED':
        return 'bg-gold-100 text-gold-700'
      case 'BANNED':
        return 'bg-burgundy-100 text-burgundy-700'
      default:
        return 'bg-cream-200 text-ink-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return CheckCircle
      case 'SUSPENDED':
        return Shield
      case 'BANNED':
        return Ban
      default:
        return AlertTriangle
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-ink-600 text-body">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-burgundy-600 text-body">Error: {error}</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-h2 text-ink-900 mb-6">User Management</h2>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-premium border border-cream-400 p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900"
                />
              </div>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="px-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900 bg-white"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="px-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900 bg-white"
            >
              <option value="ALL">All Users</option>
              <option value="REAL">Real Users</option>
              <option value="SEED">Seed Users</option>
            </select>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900 bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900 bg-white"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="firstName">Sort by Name</option>
              <option value="age">Sort by Age</option>
              <option value="city">Sort by City</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border-2 border-cream-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-ink-900 bg-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors h-10"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2 bg-cream-200 text-ink-700 rounded-xl hover:bg-cream-300 transition-colors h-10"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-premium border border-cream-400 overflow-hidden">
        <table className="min-w-full divide-y divide-cream-400">
          <thead className="bg-cream-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-600 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-600 uppercase tracking-wider">
                Profile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ink-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-ink-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-cream-400">
            {users.map((user) => {
              const StatusIcon = getStatusIcon(user.profile?.moderationStatus || 'ACTIVE')
              return (
                <tr key={user.id} className="hover:bg-cream-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-ink-900">
                      {user.firstName} {user.lastName || ''}
                    </div>
                    <div className="text-sm text-ink-600">
                      {user.username || 'No username'}
                    </div>
                    <div className="text-xs text-ink-500">
                      {user.telegramId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.profile ? (
                      <div className="text-sm text-ink-900">
                        {user.profile.age} yrs • {user.profile.gender} • {user.profile.city}
                      </div>
                    ) : (
                      <div className="text-sm text-ink-600">No profile</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isSeed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-200 text-ink-700">
                        Seed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Real
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.profile ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.profile.moderationStatus)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {user.profile.moderationStatus}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-600">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-ink-900">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a
                      href={`/admin/users/${user.id}`}
                      className="text-emerald-600 hover:text-emerald-700 inline-flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
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
    </div>
  )
}
