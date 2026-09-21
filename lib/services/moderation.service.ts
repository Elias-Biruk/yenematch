import { prisma } from '@/lib/db/prisma'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import { ModerationAction, ModerationStatus, UserRole } from '@prisma/client'
import { createAuditLog, requireAdminRole, requireSuperAdminRole } from './admin.service'

export async function suspendUser(adminId: string, targetUserId: string, reason: string) {
  await requireAdminRole(adminId)
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  if (!user.profile) {
    throw new ValidationError('User has no profile')
  }
  
  // Update moderation status
  await prisma.profile.update({
    where: { userId: targetUserId },
    data: { moderationStatus: ModerationStatus.SUSPENDED },
  })
  
  // Create audit log
  await createAuditLog({
    adminId,
    targetId: targetUserId,
    action: ModerationAction.USER_SUSPENDED,
    reason,
  })
  
  return { success: true }
}

export async function unsuspendUser(adminId: string, targetUserId: string, reason: string) {
  await requireAdminRole(adminId)
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  if (!user.profile) {
    throw new ValidationError('User has no profile')
  }
  
  // Update moderation status
  await prisma.profile.update({
    where: { userId: targetUserId },
    data: { moderationStatus: ModerationStatus.ACTIVE },
  })
  
  // Create audit log
  await createAuditLog({
    adminId,
    targetId: targetUserId,
    action: ModerationAction.USER_UNSUSPENDED,
    reason,
  })
  
  return { success: true }
}

export async function banUser(adminId: string, targetUserId: string, reason: string) {
  await requireAdminRole(adminId)
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  if (!user.profile) {
    throw new ValidationError('User has no profile')
  }
  
  // Update moderation status
  await prisma.profile.update({
    where: { userId: targetUserId },
    data: { moderationStatus: ModerationStatus.BANNED },
  })
  
  // Create audit log
  await createAuditLog({
    adminId,
    targetId: targetUserId,
    action: ModerationAction.USER_BANNED,
    reason,
  })
  
  return { success: true }
}

export async function unbanUser(adminId: string, targetUserId: string, reason: string) {
  await requireAdminRole(adminId)
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  if (!user.profile) {
    throw new ValidationError('User has no profile')
  }
  
  // Update moderation status
  await prisma.profile.update({
    where: { userId: targetUserId },
    data: { moderationStatus: ModerationStatus.ACTIVE },
  })
  
  // Create audit log
  await createAuditLog({
    adminId,
    targetId: targetUserId,
    action: ModerationAction.USER_UNBANNED,
    reason,
  })
  
  return { success: true }
}

export async function grantAdminRole(adminId: string, targetUserId: string, reason: string) {
  await requireSuperAdminRole(adminId)
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  // Update user role
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: UserRole.ADMIN },
  })
  
  // Create audit log
  await createAuditLog({
    adminId,
    targetId: targetUserId,
    action: ModerationAction.ADMIN_ROLE_GRANTED,
    reason,
  })
  
  return { success: true }
}

export async function revokeAdminRole(adminId: string, targetUserId: string, reason: string) {
  await requireSuperAdminRole(adminId)
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  })
  
  if (!user) {
    throw new NotFoundError('User')
  }
  
  // Update user role
  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: UserRole.USER },
  })
  
  // Create audit log
  await createAuditLog({
    adminId,
    targetId: targetUserId,
    action: ModerationAction.ADMIN_ROLE_REVOKED,
    reason,
  })
  
  return { success: true }
}
