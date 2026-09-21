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

export async function getDashboardStats() {
  const [
    totalUsers,
    completedProfiles,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    reviewingReports,
    reviewedReports,
    activeMatches,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count({ where: { completedOnboarding: true } }),
    prisma.profile.count({ where: { moderationStatus: ModerationStatus.ACTIVE } }),
    prisma.profile.count({ where: { moderationStatus: ModerationStatus.SUSPENDED } }),
    prisma.profile.count({ where: { moderationStatus: ModerationStatus.BANNED } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'REVIEWING' } }),
    prisma.report.count({ where: { status: 'REVIEWED' } }),
    prisma.match.count({ where: { status: 'ACTIVE' } }),
  ])

  return {
    totalUsers,
    completedProfiles,
    activeUsers,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    reviewingReports,
    reviewedReports,
    activeMatches,
  }
}
