import {
  suspendUser,
  unsuspendUser,
  banUser,
  unbanUser,
  grantAdminRole,
  revokeAdminRole,
} from '@/lib/services/moderation.service'
import { UserRole, ModerationAction, ModerationStatus } from '@prisma/client'
import { AuthorizationError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock admin service
jest.mock('@/lib/services/admin.service', () => ({
  requireAdminRole: jest.fn(),
  requireSuperAdminRole: jest.fn(),
  createAuditLog: jest.fn(),
}))

import { requireAdminRole, requireSuperAdminRole, createAuditLog } from '@/lib/services/admin.service'

describe('Moderation Service Tests', () => {
  const mockAdminId = 'admin1'
  const mockSuperAdminId = 'superadmin1'
  const mockTargetUserId = 'user1'
  const mockProfileId = 'profile1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('suspendUser', () => {
    it('should suspend a user successfully', async () => {
      ;(requireAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
        profile: { id: mockProfileId },
      })
      ;(prisma.profile.update as jest.Mock).mockResolvedValue({
        moderationStatus: ModerationStatus.SUSPENDED,
      })
      ;(createAuditLog as jest.Mock).mockResolvedValue({})

      const result = await suspendUser(mockAdminId, mockTargetUserId, 'Test suspension')

      expect(result).toEqual({ success: true })
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: mockTargetUserId },
        data: { moderationStatus: ModerationStatus.SUSPENDED },
      })
      expect(createAuditLog).toHaveBeenCalledWith({
        adminId: mockAdminId,
        targetId: mockTargetUserId,
        action: ModerationAction.USER_SUSPENDED,
        reason: 'Test suspension',
      })
    })

    it('should reject non-admin users', async () => {
      ;(requireAdminRole as jest.Mock).mockRejectedValue(
        new AuthorizationError('Admin access required')
      )

      await expect(
        suspendUser(mockTargetUserId, mockTargetUserId, 'Test')
      ).rejects.toThrow(AuthorizationError)
    })

    it('should reject when user has no profile', async () => {
      ;(requireAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
        profile: null,
      })

      await expect(
        suspendUser(mockAdminId, mockTargetUserId, 'Test')
      ).rejects.toThrow('User has no profile')
    })

    it('should reject non-existent user', async () => {
      ;(requireAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        suspendUser(mockAdminId, mockTargetUserId, 'Test')
      ).rejects.toThrow('User')
    })
  })

  describe('unsuspendUser', () => {
    it('should unsuspend a user successfully', async () => {
      ;(requireAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
        profile: { id: mockProfileId },
      })
      ;(prisma.profile.update as jest.Mock).mockResolvedValue({
        moderationStatus: ModerationStatus.ACTIVE,
      })
      ;(createAuditLog as jest.Mock).mockResolvedValue({})

      const result = await unsuspendUser(mockAdminId, mockTargetUserId, 'Test unsuspension')

      expect(result).toEqual({ success: true })
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: mockTargetUserId },
        data: { moderationStatus: ModerationStatus.ACTIVE },
      })
      expect(createAuditLog).toHaveBeenCalledWith({
        adminId: mockAdminId,
        targetId: mockTargetUserId,
        action: ModerationAction.USER_UNSUSPENDED,
        reason: 'Test unsuspension',
      })
    })
  })

  describe('banUser', () => {
    it('should ban a user successfully', async () => {
      ;(requireAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
        profile: { id: mockProfileId },
      })
      ;(prisma.profile.update as jest.Mock).mockResolvedValue({
        moderationStatus: ModerationStatus.BANNED,
      })
      ;(createAuditLog as jest.Mock).mockResolvedValue({})

      const result = await banUser(mockAdminId, mockTargetUserId, 'Test ban')

      expect(result).toEqual({ success: true })
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: mockTargetUserId },
        data: { moderationStatus: ModerationStatus.BANNED },
      })
      expect(createAuditLog).toHaveBeenCalledWith({
        adminId: mockAdminId,
        targetId: mockTargetUserId,
        action: ModerationAction.USER_BANNED,
        reason: 'Test ban',
      })
    })
  })

  describe('unbanUser', () => {
    it('should unban a user successfully', async () => {
      ;(requireAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
        profile: { id: mockProfileId },
      })
      ;(prisma.profile.update as jest.Mock).mockResolvedValue({
        moderationStatus: ModerationStatus.ACTIVE,
      })
      ;(createAuditLog as jest.Mock).mockResolvedValue({})

      const result = await unbanUser(mockAdminId, mockTargetUserId, 'Test unban')

      expect(result).toEqual({ success: true })
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId: mockTargetUserId },
        data: { moderationStatus: ModerationStatus.ACTIVE },
      })
      expect(createAuditLog).toHaveBeenCalledWith({
        adminId: mockAdminId,
        targetId: mockTargetUserId,
        action: ModerationAction.USER_UNBANNED,
        reason: 'Test unban',
      })
    })
  })

  describe('grantAdminRole', () => {
    it('should grant admin role with SUPER_ADMIN authorization', async () => {
      ;(requireSuperAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
      })
      ;(createAuditLog as jest.Mock).mockResolvedValue({})

      const result = await grantAdminRole(mockSuperAdminId, mockTargetUserId, 'Test promotion')

      expect(result).toEqual({ success: true })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockTargetUserId },
        data: { role: UserRole.ADMIN },
      })
      expect(createAuditLog).toHaveBeenCalledWith({
        adminId: mockSuperAdminId,
        targetId: mockTargetUserId,
        action: ModerationAction.ADMIN_ROLE_GRANTED,
        reason: 'Test promotion',
      })
    })

    it('should reject ADMIN role trying to grant admin', async () => {
      ;(requireSuperAdminRole as jest.Mock).mockRejectedValue(
        new AuthorizationError('Super admin access required')
      )

      await expect(
        grantAdminRole(mockAdminId, mockTargetUserId, 'Test')
      ).rejects.toThrow(AuthorizationError)
    })
  })

  describe('revokeAdminRole', () => {
    it('should revoke admin role with SUPER_ADMIN authorization', async () => {
      ;(requireSuperAdminRole as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockTargetUserId,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
      })
      ;(createAuditLog as jest.Mock).mockResolvedValue({})

      const result = await revokeAdminRole(mockSuperAdminId, mockTargetUserId, 'Test revocation')

      expect(result).toEqual({ success: true })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockTargetUserId },
        data: { role: UserRole.USER },
      })
      expect(createAuditLog).toHaveBeenCalledWith({
        adminId: mockSuperAdminId,
        targetId: mockTargetUserId,
        action: ModerationAction.ADMIN_ROLE_REVOKED,
        reason: 'Test revocation',
      })
    })

    it('should reject ADMIN role trying to revoke admin', async () => {
      ;(requireSuperAdminRole as jest.Mock).mockRejectedValue(
        new AuthorizationError('Super admin access required')
      )

      await expect(
        revokeAdminRole(mockAdminId, mockTargetUserId, 'Test')
      ).rejects.toThrow(AuthorizationError)
    })
  })
})
