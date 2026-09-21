'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, AlertTriangle, CheckCircle, MessageSquare, Activity } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  completedProfiles: number
  activeUsers: number
  suspendedUsers: number
  bannedUsers: number
  pendingReports: number
  reviewingReports: number
  reviewedReports: number
  activeMatches: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/dashboard')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading dashboard...</div>
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

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Completed Profiles',
      value: stats.completedProfiles,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-emerald-500',
    },
    {
      title: 'Suspended Users',
      value: stats.suspendedUsers,
      icon: Shield,
      color: 'bg-yellow-500',
    },
    {
      title: 'Banned Users',
      value: stats.bannedUsers,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      title: 'Reviewing Reports',
      value: stats.reviewingReports,
      icon: Shield,
      color: 'bg-purple-500',
    },
    {
      title: 'Reviewed Reports',
      value: stats.reviewedReports,
      icon: CheckCircle,
      color: 'bg-cyan-500',
    },
    {
      title: 'Active Matches',
      value: stats.activeMatches,
      icon: MessageSquare,
      color: 'bg-pink-500',
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-900 font-medium">Manage Users</span>
          </a>
          <a
            href="/admin/reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-900 font-medium">Review Reports</span>
          </a>
          <a
            href="/admin/audit"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-900 font-medium">View Audit Log</span>
          </a>
        </div>
      </div>
    </div>
  )
}
