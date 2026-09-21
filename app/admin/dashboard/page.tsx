'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Heart, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalMatches: number
  pendingReports: number
  newUsersToday: number
  newMatchesToday: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const timeRangeParam = timeRange === '24h' ? 'today' : timeRange === '7d' ? 'week' : timeRange === '30d' ? 'month' : 'all'
      const response = await fetch(`/api/admin/dashboard?timeRange=${timeRangeParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats({
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        totalMatches: data.activeMatches || 0,
        pendingReports: data.pendingReports || 0,
        newUsersToday: data.newUsers || 0,
        newMatchesToday: data.newMatches || 0,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-display-sm text-ink-900">Dashboard Overview</h2>
        <p className="text-body text-ink-600">Monitor your platform's performance</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex space-x-2">
        {(['24h', '7d', '30d'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card className="shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-600">Total Users</CardTitle>
            <Users className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-display text-emerald-600 font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-600">Active Users</CardTitle>
            <Activity className="h-5 w-5 text-gold-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-display text-gold-600 font-bold">{stats?.activeUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-600">Total Matches</CardTitle>
            <Heart className="h-5 w-5 text-burgundy-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-display text-burgundy-600 font-bold">{stats?.totalMatches || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-600">Pending Reports</CardTitle>
            <AlertTriangle className="h-5 w-5 text-burgundy-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-display text-burgundy-600 font-bold">{stats?.pendingReports || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-600">New Users Today</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-display text-emerald-600 font-bold">{stats?.newUsersToday || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-body-sm font-medium text-ink-600">New Matches Today</CardTitle>
            <Heart className="h-5 w-5 text-burgundy-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-display text-burgundy-600 font-bold">{stats?.newMatchesToday || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-premium">
        <CardHeader>
          <CardTitle className="text-h2">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-12 text-base"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Manage Users</span>
              <span className="sm:hidden">Users</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-12 text-base"
              onClick={() => router.push('/admin/reports')}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Review Reports</span>
              <span className="sm:hidden">Reports</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-12 text-base"
              onClick={() => router.push('/admin/matches')}
            >
              <Heart className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">View Matches</span>
              <span className="sm:hidden">Matches</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-12 text-base"
              onClick={() => router.push('/admin/audit')}
            >
              <Activity className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">View Activity</span>
              <span className="sm:hidden">Activity</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
