import { createMessage, getMatchMessages } from '@/lib/services/messaging.service'
import { prisma } from '@/lib/db/prisma'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/utils/errors'
import { MatchStatus } from '@prisma/client'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    match: {
      findUnique: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
    block: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

describe('Messaging Service', () => {
  const mockUserId = 'user1'
  const mockOtherUserId = 'user2'
  const mockMatchId = 'match1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.ACTIVE,
      }

      const mockMessage = {
        id: 'msg1',
        matchId: mockMatchId,
        senderId: mockUserId,
        receiverId: mockOtherUserId,
        content: 'Hello',
        createdAt: new Date(),
        sender: {
          id: mockUserId,
          firstName: 'John',
        },
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.block.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.message.create as jest.Mock).mockResolvedValue(mockMessage)

      const result = await createMessage(mockMatchId, mockUserId, mockOtherUserId, 'Hello')

      expect(result).toEqual(mockMessage)
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          matchId: mockMatchId,
          senderId: mockUserId,
          receiverId: mockOtherUserId,
          content: 'Hello',
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
            },
          },
        },
      })
    })

    it('should reject empty messages', async () => {
      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, '   ')).rejects.toThrow(ValidationError)
      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, '')).rejects.toThrow(ValidationError)
    })

    it('should reject oversized messages', async () => {
      const longMessage = 'a'.repeat(1001)
      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, longMessage)).rejects.toThrow(ValidationError)
    })

    it('should reject if match not found', async () => {
      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, 'Hello')).rejects.toThrow(NotFoundError)
    })

    it('should reject if match is not active', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.UNMATCHED,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, 'Hello')).rejects.toThrow(AuthorizationError)
    })

    it('should reject if sender is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: 'user3',
        user2Id: 'user4',
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, 'Hello')).rejects.toThrow(AuthorizationError)
    })

    it('should reject if receiver is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createMessage(mockMatchId, mockUserId, 'user3', 'Hello')).rejects.toThrow(AuthorizationError)
    })

    it('should reject if sender is blocked by receiver', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.block.findUnique as jest.Mock).mockResolvedValue({
        blockerId: mockOtherUserId,
        blockedId: mockUserId,
      })

      await expect(createMessage(mockMatchId, mockUserId, mockOtherUserId, 'Hello')).rejects.toThrow(AuthorizationError)
    })

    it('should trim message content', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.ACTIVE,
      }

      const mockMessage = {
        id: 'msg1',
        matchId: mockMatchId,
        senderId: mockUserId,
        receiverId: mockOtherUserId,
        content: 'Hello',
        createdAt: new Date(),
        sender: {
          id: mockUserId,
          firstName: 'John',
        },
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.block.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.message.create as jest.Mock).mockResolvedValue(mockMessage)

      await createMessage(mockMatchId, mockUserId, mockOtherUserId, '  Hello  ')

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Hello',
          }),
        })
      )
    })
  })

  describe('getMatchMessages', () => {
    it('should return messages for match participant', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.ACTIVE,
      }

      const mockMessages = [
        {
          id: 'msg1',
          matchId: mockMatchId,
          senderId: mockOtherUserId,
          receiverId: mockUserId,
          content: 'Hello',
          createdAt: new Date('2024-01-01'),
          readAt: null,
          sender: {
            id: mockOtherUserId,
            firstName: 'Jane',
          },
        },
      ]

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.block.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.message.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages)

      const result = await getMatchMessages(mockMatchId, mockUserId)

      expect(result).toEqual(mockMessages)
      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          matchId: mockMatchId,
          receiverId: mockUserId,
          readAt: null,
        },
        data: {
          readAt: expect.any(Date),
        },
      })
    })

    it('should reject if match not found', async () => {
      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(getMatchMessages(mockMatchId, mockUserId)).rejects.toThrow(NotFoundError)
    })

    it('should reject if match is not active', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.UNMATCHED,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(getMatchMessages(mockMatchId, mockUserId)).rejects.toThrow(AuthorizationError)
    })

    it('should reject if user is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: 'user3',
        user2Id: 'user4',
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(getMatchMessages(mockMatchId, mockUserId)).rejects.toThrow(AuthorizationError)
    })

    it('should return messages in chronological order', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.ACTIVE,
      }

      const mockMessages = [
        {
          id: 'msg1',
          matchId: mockMatchId,
          senderId: mockUserId,
          receiverId: mockOtherUserId,
          content: 'First',
          createdAt: new Date('2024-01-01'),
          readAt: null,
          sender: { id: mockUserId, firstName: 'John' },
        },
        {
          id: 'msg2',
          matchId: mockMatchId,
          senderId: mockOtherUserId,
          receiverId: mockUserId,
          content: 'Second',
          createdAt: new Date('2024-01-02'),
          readAt: null,
          sender: { id: mockOtherUserId, firstName: 'Jane' },
        },
      ]

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.block.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.message.updateMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages)

      const result = await getMatchMessages(mockMatchId, mockUserId)

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'asc',
          },
        })
      )
    })

    it('should reject if conversation is blocked', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: mockOtherUserId,
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.block.findFirst as jest.Mock).mockResolvedValue({
        blockerId: mockOtherUserId,
        blockedId: mockUserId,
      })

      await expect(getMatchMessages(mockMatchId, mockUserId)).rejects.toThrow(AuthorizationError)
    })
  })
})
