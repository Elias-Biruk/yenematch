import { createReport } from '@/lib/services/report.service'
import { prisma } from '@/lib/db/prisma'
import { ValidationError, NotFoundError } from '@/lib/utils/errors'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    report: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock rate limiter
jest.mock('@/lib/utils/rate-limiter', () => ({
  rateLimit: jest.fn(),
}))

describe('Report Service', () => {
  const mockReporterId = 'reporter-id'
  const mockReportedId = 'reported-id'
  const mockReport = {
    id: 'report-123',
    reporterId: mockReporterId,
    reportedId: mockReportedId,
    reason: 'FAKE_PROFILE',
    description: 'Test description',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const createMockReport = (overrides: any = {}) => ({
    ...mockReport,
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createReport', () => {
    it('should create a report successfully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockReportedId })
      ;(prisma.report.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.report.create as jest.Mock).mockResolvedValue(createMockReport({
        description: 'This profile looks fake',
      }))

      const report = await createReport(
        mockReporterId,
        mockReportedId,
        'FAKE_PROFILE',
        'This profile looks fake'
      )

      expect(report).toBeDefined()
      expect(report.reporterId).toBe(mockReporterId)
      expect(report.reportedId).toBe(mockReportedId)
      expect(report.reason).toBe('FAKE_PROFILE')
      expect(report.description).toBe('This profile looks fake')
      expect(report.status).toBe('PENDING')
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId: mockReporterId,
          reportedId: mockReportedId,
          reason: 'FAKE_PROFILE',
          description: 'This profile looks fake',
        },
      })
    })

    it('should create a report without description', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockReportedId })
      ;(prisma.report.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.report.create as jest.Mock).mockResolvedValue(createMockReport({
        description: null,
      }))

      const report = await createReport(
        mockReporterId,
        mockReportedId,
        'HARASSMENT',
        undefined
      )

      expect(report).toBeDefined()
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId: mockReporterId,
          reportedId: mockReportedId,
          reason: 'HARASSMENT',
          description: null,
        },
      })
    })

    it('should trim description', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockReportedId })
      ;(prisma.report.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.report.create as jest.Mock).mockResolvedValue(createMockReport({
        description: 'Test description',
      }))

      const report = await createReport(
        mockReporterId,
        mockReportedId,
        'SPAM_SCAM',
        '  Test description  '
      )

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId: mockReporterId,
          reportedId: mockReportedId,
          reason: 'SPAM_SCAM',
          description: 'Test description',
        },
      })
    })

    it('should throw error when reporter and reported user are the same', async () => {
      await expect(
        createReport(mockReporterId, mockReporterId, 'FAKE_PROFILE', 'Self report')
      ).rejects.toThrow('cannot report yourself')
    })

    it('should throw error when reported user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        createReport(mockReporterId, 'nonexistent-id', 'FAKE_PROFILE', 'Test')
      ).rejects.toThrow('User not found')
    })

    it('should prevent rapid duplicate reports', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockReportedId })
      ;(prisma.report.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-report',
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      })

      await expect(
        createReport(mockReporterId, mockReportedId, 'HARASSMENT', 'Second')
      ).rejects.toThrow('already reported this user')
    })

    it('should allow reports for different reporter-reported pairs', async () => {
      const anotherReporterId = 'another-reporter-id'
      const anotherReportedId = 'another-reported-id'
      
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: anotherReportedId })
      ;(prisma.report.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.report.create as jest.Mock).mockResolvedValue(createMockReport({
        reporterId: anotherReporterId,
        reportedId: anotherReportedId,
        description: 'Different reporter',
      }))

      const report = await createReport(
        anotherReporterId,
        anotherReportedId,
        'SPAM_SCAM',
        'Different reporter'
      )

      expect(report).toBeDefined()
      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reporterId: anotherReporterId,
          reportedId: anotherReportedId,
          reason: 'SPAM_SCAM',
          description: 'Different reporter',
        },
      })
    })
  })
})
