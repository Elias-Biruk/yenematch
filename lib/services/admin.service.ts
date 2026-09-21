import { prisma } from '@/lib/db/prisma'
import { AuthorizationError, NotFoundError } from '@/lib/utils/errors'
import { UserRole, ModerationAction, ModerationStatus } from '@prisma/client'

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  
  return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  
  return user?.role === UserRole.SUPER_ADMIN
}

export async function requireSuperAdminRole(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AuthorizationError('Super admin access required')
  }
}

export async function requireAdminRole(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AuthorizationError('Admin access required')
  }
}

export async function createAuditLog(params: {
  adminId: string
  targetId?: string
  action: ModerationAction
  reason?: string
  reportId?: string
  metadata?: string
}) {
  return await prisma.auditLog.create({
    data: params,
  })
}

export async function getDashboardStats(timeRange: 'today' | 'week' | 'month' | 'all' = 'all') {
  const SEED_USERNAME_PREFIX = 'seed_user_'
  const TELEGRAM_ID_OFFSET = 900000000
  const TELEGRAM_ID_OFFSET_STR = String(TELEGRAM_ID_OFFSET)
  
  // Calculate date range
  const now = new Date()
  let startDate: Date | undefined
  
  if (timeRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (timeRange === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (timeRange === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  
  const dateFilter = startDate ? { gte: startDate } : undefined
  
  const [
    totalUsers,
    seedUsers,
    realUsers,
    completedProfiles,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    reviewingReports,
    reviewedReports,
    activeMatches,
    maleUsers,
    femaleUsers,
    newUsers,
    newMatches,
    onboardingCompleted,
    onboardingIncomplete,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        OR: [
          { username: { startsWith: SEED_USERNAME_PREFIX } },
          { telegramId: { gte: TELEGRAM_ID_OFFSET_STR } },
        ],
      },
    }),
    prisma.user.count({
      where: {
        AND: [
          { username: { not: { startsWith: SEED_USERNAME_PREFIX } } },
          { telegramId: { lt: TELEGRAM_ID_OFFSET_STR } },
        ],
      },
    }),
    prisma.profile.count({ where: { completedOnboarding: true } }),
    prisma.profile.count({ where: { moderationStatus: ModerationStatus.ACTIVE } }),
    prisma.profile.count({ where: { moderationStatus: ModerationStatus.SUSPENDED } }),
    prisma.profile.count({ where: { moderationStatus: ModerationStatus.BANNED } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'REVIEWING' } }),
    prisma.report.count({ where: { status: 'REVIEWED' } }),
    prisma.match.count({ where: { status: 'ACTIVE' } }),
    prisma.profile.count({ where: { gender: 'MALE' } }),
    prisma.profile.count({ where: { gender: 'FEMALE' } }),
    prisma.user.count({
      where: {
        createdAt: dateFilter,
      },
    }),
    prisma.match.count({
      where: {
        createdAt: dateFilter,
      },
    }),
    prisma.profile.count({ where: { completedOnboarding: true } }),
    prisma.profile.count({ where: { completedOnboarding: false } }),
  ])

  return {
    totalUsers,
    seedUsers,
    realUsers,
    completedProfiles,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    reviewingReports,
    reviewedReports,
    activeMatches,
    maleUsers,
    femaleUsers,
    newUsers,
    newMatches,
    onboardingCompleted,
    onboardingIncomplete,
    timeRange,
  }
}
