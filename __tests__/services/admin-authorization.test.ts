import { isAdmin, isSuperAdmin, requireAdminRole, requireSuperAdminRole, createAuditLog } from '@/lib/services/admin.service'
import { UserRole, ModerationAction } from '@prisma/client'
import { AuthorizationError, NotFoundError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

describe('Admin Authorization Tests', () => {
  const mockUserId = 'user1'
  const mockAdminId = 'admin1'
  const mockSuperAdminId = 'superadmin1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isAdmin', () => {
    it('should return true for ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
      })

      const result = await isAdmin(mockAdminId)
      expect(result).toBe(true)
    })

    it('should return true for SUPER_ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.SUPER_ADMIN,
      })

      const result = await isAdmin(mockSuperAdminId)
      expect(result).toBe(true)
    })

    it('should return false for USER role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
      })

      const result = await isAdmin(mockUserId)
      expect(result).toBe(false)
    })

    it('should return false for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await isAdmin('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('should return true for SUPER_ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.SUPER_ADMIN,
      })

      const result = await isSuperAdmin(mockSuperAdminId)
      expect(result).toBe(true)
    })

    it('should return false for ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
      })

      const result = await isSuperAdmin(mockAdminId)
      expect(result).toBe(false)
    })

    it('should return false for USER role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
      })

      const result = await isSuperAdmin(mockUserId)
      expect(result).toBe(false)
    })
  })

  describe('requireAdminRole', () => {
    it('should allow ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
      })

      await expect(requireAdminRole(mockAdminId)).resolves.not.toThrow()
    })

    it('should allow SUPER_ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.SUPER_ADMIN,
      })

      await expect(requireAdminRole(mockSuperAdminId)).resolves.not.toThrow()
    })

    it('should reject USER role with AuthorizationError', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
      })

      await expect(requireAdminRole(mockUserId)).rejects.toThrow(AuthorizationError)
      await expect(requireAdminRole(mockUserId)).rejects.toThrow('Admin access required')
    })

    it('should reject non-existent user with NotFoundError', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(requireAdminRole('nonexistent')).rejects.toThrow(NotFoundError)
      await expect(requireAdminRole('nonexistent')).rejects.toThrow('User')
    })
  })

  describe('requireSuperAdminRole', () => {
    it('should allow SUPER_ADMIN role', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.SUPER_ADMIN,
      })

      await expect(requireSuperAdminRole(mockSuperAdminId)).resolves.not.toThrow()
    })

    it('should reject ADMIN role with AuthorizationError', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.ADMIN,
      })

      await expect(requireSuperAdminRole(mockAdminId)).rejects.toThrow(AuthorizationError)
      await expect(requireSuperAdminRole(mockAdminId)).rejects.toThrow('Super admin access required')
    })

    it('should reject USER role with AuthorizationError', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: UserRole.USER,
      })

      await expect(requireSuperAdminRole(mockUserId)).rejects.toThrow(AuthorizationError)
      await expect(requireSuperAdminRole(mockUserId)).rejects.toThrow('Super admin access required')
    })

    it('should reject non-existent user with NotFoundError', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(requireSuperAdminRole('nonexistent')).rejects.toThrow(NotFoundError)
      await expect(requireSuperAdminRole('nonexistent')).rejects.toThrow('User')
    })
  })

  describe('createAuditLog', () => {
    it('should create audit log entry', async () => {
      const mockAuditLog = {
        id: 'audit1',
        adminId: mockAdminId,
        targetId: mockUserId,
        action: ModerationAction.USER_SUSPENDED,
        reason: 'Test reason',
        createdAt: new Date(),
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog)

      const result = await createAuditLog({
        adminId: mockAdminId,
        targetId: mockUserId,
        action: ModerationAction.USER_SUSPENDED,
        reason: 'Test reason',
      })

      expect(result).toEqual(mockAuditLog)
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAdminId,
          targetId: mockUserId,
          action: ModerationAction.USER_SUSPENDED,
          reason: 'Test reason',
        },
      })
    })

    it('should create audit log without target', async () => {
      const mockAuditLog = {
        id: 'audit1',
        adminId: mockAdminId,
        targetId: null,
        action: ModerationAction.USER_SUSPENDED,
        reason: 'Test reason',
        createdAt: new Date(),
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog)

      const result = await createAuditLog({
        adminId: mockAdminId,
        action: ModerationAction.USER_SUSPENDED,
        reason: 'Test reason',
      })

      expect(result.targetId).toBeNull()
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAdminId,
          action: ModerationAction.USER_SUSPENDED,
          reason: 'Test reason',
        },
      })
    })

    it('should create audit log with report ID', async () => {
      const mockAuditLog = {
        id: 'audit1',
        adminId: mockAdminId,
        targetId: mockUserId,
        action: ModerationAction.REPORT_REVIEWED,
        reason: 'Test reason',
        reportId: 'report1',
        createdAt: new Date(),
      }

      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue(mockAuditLog)

      const result = await createAuditLog({
        adminId: mockAdminId,
        targetId: mockUserId,
        action: ModerationAction.REPORT_REVIEWED,
        reason: 'Test reason',
        reportId: 'report1',
      })

      expect(result.reportId).toBe('report1')
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: mockAdminId,
          targetId: mockUserId,
          action: ModerationAction.REPORT_REVIEWED,
          reason: 'Test reason',
          reportId: 'report1',
        },
      })
    })
  })
})
