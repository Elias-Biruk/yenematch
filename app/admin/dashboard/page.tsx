'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, AlertTriangle, CheckCircle, MessageSquare, Activity } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DashboardStats {
  totalUsers: number
  seedUsers: number
  realUsers: number
  completedProfiles: number
  activeUsers: number
  suspendedUsers: number
  bannedUsers: number
  pendingReports: number
  reviewingReports: number
  reviewedReports: number
  activeMatches: number
  maleUsers: number
  femaleUsers: number
  newUsers: number
  newMatches: number
  onboardingCompleted: number
  onboardingIncomplete: number
  timeRange: string
}

export default function AdminDashboard() {
  const t = useTranslations('adminDashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all')

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/dashboard?timeRange=${timeRange}`)
        if (!response.ok) {
          throw new Error(t('errorLoadingStats'))
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'))
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeRange, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">{t('loadingDashboard')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{t('error')}: {error}</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: t('totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Real Users',
      value: stats.realUsers,
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      title: 'Seed Users',
      value: stats.seedUsers,
      icon: Users,
      color: 'bg-gray-500',
    },
    {
      title: `New Users (${stats.timeRange})`,
      value: stats.newUsers,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Male Users',
      value: stats.maleUsers,
      icon: Users,
      color: 'bg-blue-600',
    },
    {
      title: 'Female Users',
      value: stats.femaleUsers,
      icon: Users,
      color: 'bg-pink-500',
    },
    {
      title: t('completedProfiles'),
      value: stats.onboardingCompleted,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Incomplete Onboarding',
      value: stats.onboardingIncomplete,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      title: t('activeUsers'),
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-emerald-500',
    },
    {
      title: t('suspendedUsers'),
      value: stats.suspendedUsers,
      icon: Shield,
      color: 'bg-yellow-500',
    },
    {
      title: t('bannedUsers'),
      value: stats.bannedUsers,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: t('pendingReports'),
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      title: t('reviewingReports'),
      value: stats.reviewingReports,
      icon: Shield,
      color: 'bg-purple-500',
    },
    {
      title: t('reviewedReports'),
      value: stats.reviewedReports,
      icon: CheckCircle,
      color: 'bg-cyan-500',
    },
    {
      title: t('activeMatches'),
      value: stats.activeMatches,
      icon: MessageSquare,
      color: 'bg-pink-500',
    },
    {
      title: `New Matches (${stats.timeRange})`,
      value: stats.newMatches,
      icon: MessageSquare,
      color: 'bg-green-600',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboardOverview')}</h2>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>
      
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickActions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-900 font-medium">{t('manageUsers')}</span>
          </a>
          <a
            href="/admin/reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-900 font-medium">{t('reviewReports')}</span>
          </a>
          <a
            href="/admin/audit"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="w-5 h-5 text-gray-600 mr-3" />
            <span className="text-gray-900 font-medium">{t('viewAuditLog')}</span>
          </a>
        </div>
      </div>
    </div>
  )
}
