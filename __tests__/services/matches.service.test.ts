import { getMatches, getMatch, unmatch, markMessagesAsRead, blockMatch } from '@/lib/services/matches.service'
import { prisma } from '@/lib/db/prisma'
import { Gender, MatchStatus } from '@prisma/client'
import { ValidationError, NotFoundError } from '@/lib/utils/errors'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    match: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    message: {
      groupBy: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

describe('Matches Service', () => {
  const mockUserId = 'user1'
  const mockMatchId = 'match1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getMatches', () => {
    it('should return matches for authenticated user', async () => {
      const mockMatches = [
        {
          id: 'match1',
          user1Id: mockUserId,
          user2Id: 'user2',
          status: MatchStatus.ACTIVE,
          createdAt: new Date('2024-01-01'),
          user1: {
            id: mockUserId,
            firstName: 'John',
            profile: {
              age: 25,
              city: 'Addis Ababa',
              photos: [{ id: 'photo1', url: 'http://test.com/photo1.jpg', isPrimary: true }],
            },
          },
          user2: {
            id: 'user2',
            firstName: 'Jane',
            profile: {
              age: 24,
              city: 'Addis Ababa',
              photos: [{ id: 'photo2', url: 'http://test.com/photo2.jpg', isPrimary: true }],
            },
          },
          messages: [
            {
              id: 'msg1',
              content: 'Hello',
              createdAt: new Date('2024-01-02'),
              senderId: 'user2',
            },
          ],
        },
      ]

      ;(prisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches)
      ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([
        { matchId: 'match1', _count: { id: 1 } },
      ])

      const result = await getMatches(mockUserId)

      expect(result).toHaveLength(1)
      expect(result[0].otherUser.id).toBe('user2')
      expect(result[0].latestMessage).toBeTruthy()
      expect(result[0].unreadCount).toBe(1)
    })

    it('should return empty array when no matches', async () => {
      ;(prisma.match.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([])

      const result = await getMatches(mockUserId)

      expect(result).toHaveLength(0)
    })

    it('should handle matches without messages', async () => {
      const mockMatches = [
        {
          id: 'match1',
          user1Id: mockUserId,
          user2Id: 'user2',
          status: MatchStatus.ACTIVE,
          createdAt: new Date('2024-01-01'),
          user1: {
            id: mockUserId,
            firstName: 'John',
            profile: {
              age: 25,
              city: 'Addis Ababa',
              photos: [{ id: 'photo1', url: 'http://test.com/photo1.jpg', isPrimary: true }],
            },
          },
          user2: {
            id: 'user2',
            firstName: 'Jane',
            profile: {
              age: 24,
              city: 'Addis Ababa',
              photos: [{ id: 'photo2', url: 'http://test.com/photo2.jpg', isPrimary: true }],
            },
          },
          messages: [],
        },
      ]

      ;(prisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches)
      ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([])

      const result = await getMatches(mockUserId)

      expect(result[0].latestMessage).toBeNull()
      expect(result[0].unreadCount).toBe(0)
    })

    it('should sort matches by latest message activity', async () => {
      const mockMatches = [
        {
          id: 'match1',
          user1Id: mockUserId,
          user2Id: 'user2',
          status: MatchStatus.ACTIVE,
          createdAt: new Date('2024-01-01'),
          user1: {
            id: mockUserId,
            firstName: 'John',
            profile: {
              age: 25,
              city: 'Addis Ababa',
              photos: [{ id: 'photo1', url: 'http://test.com/photo1.jpg', isPrimary: true }],
            },
          },
          user2: {
            id: 'user2',
            firstName: 'Jane',
            profile: {
              age: 24,
              city: 'Addis Ababa',
              photos: [{ id: 'photo2', url: 'http://test.com/photo2.jpg', isPrimary: true }],
            },
          },
          messages: [
            {
              id: 'msg1',
              content: 'Hello',
              createdAt: new Date('2024-01-15'),
              senderId: 'user2',
            },
          ],
        },
        {
          id: 'match2',
          user1Id: mockUserId,
          user2Id: 'user3',
          status: MatchStatus.ACTIVE,
          createdAt: new Date('2024-01-10'),
          user1: {
            id: mockUserId,
            firstName: 'John',
            profile: {
              age: 25,
              city: 'Addis Ababa',
              photos: [{ id: 'photo1', url: 'http://test.com/photo1.jpg', isPrimary: true }],
            },
          },
          user2: {
            id: 'user3',
            firstName: 'Alice',
            profile: {
              age: 23,
              city: 'Addis Ababa',
              photos: [{ id: 'photo3', url: 'http://test.com/photo3.jpg', isPrimary: true }],
            },
          },
          messages: [],
        },
      ]

      ;(prisma.match.findMany as jest.Mock).mockResolvedValue(mockMatches)
      ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([])

      const result = await getMatches(mockUserId)

      // match1 should come first because it has recent message activity (2024-01-15)
      // match2 has no messages, so it uses createdAt (2024-01-10)
      expect(result[0].id).toBe('match1')
      expect(result[1].id).toBe('match2')
    })

    it('should exclude unmatched matches', async () => {
      // Return empty array since service filters by status in the query
      ;(prisma.match.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([])

      const result = await getMatches(mockUserId)

      expect(result).toHaveLength(0)
      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('should exclude blocked matches', async () => {
      // Return empty array since service filters by status in the query
      ;(prisma.match.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([])

      const result = await getMatches(mockUserId)

      expect(result).toHaveLength(0)
      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })
  })

  describe('getMatch', () => {
    it('should return match if user is part of it', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: 'user2',
        user1: {
          id: mockUserId,
          firstName: 'John',
          profile: {
            photos: [{ id: 'photo1', url: 'http://test.com/photo1.jpg' }],
          },
        },
        user2: {
          id: 'user2',
          firstName: 'Jane',
          profile: {
            photos: [{ id: 'photo2', url: 'http://test.com/photo2.jpg' }],
          },
        },
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)

      const result = await getMatch(mockMatchId, mockUserId)

      expect(result).toBeTruthy()
      expect(result.otherUser.id).toBe('user2')
    })

    it('should throw error if match not found', async () => {
      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(getMatch(mockMatchId, mockUserId)).rejects.toThrow(NotFoundError)
    })

    it('should throw error if user is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: 'user3',
        user2Id: 'user4',
        user1: { id: 'user3', firstName: 'Alice', profile: { photos: [] } },
        user2: { id: 'user4', firstName: 'Bob', profile: { photos: [] } },
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)

      await expect(getMatch(mockMatchId, mockUserId)).rejects.toThrow(ValidationError)
    })
  })

  describe('unmatch', () => {
    it('should set match status to UNMATCHED if user is part of it', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: 'user2',
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.match.update as jest.Mock).mockResolvedValue({
        ...mockMatch,
        status: 'UNMATCHED',
      })

      await unmatch(mockMatchId, mockUserId)

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        data: {
          status: MatchStatus.UNMATCHED,
        },
      })
    })

    it('should throw error if match not found', async () => {
      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(unmatch(mockMatchId, mockUserId)).rejects.toThrow(NotFoundError)
    })

    it('should throw error if user is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: 'user3',
        user2Id: 'user4',
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)

      await expect(unmatch(mockMatchId, mockUserId)).rejects.toThrow(ValidationError)
    })
  })

  describe('markMessagesAsRead', () => {
    it('should mark unread messages as read', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: 'user2',
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.message.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

      await markMessagesAsRead(mockMatchId, mockUserId)

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

    it('should throw error if match not found', async () => {
      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(markMessagesAsRead(mockMatchId, mockUserId)).rejects.toThrow(NotFoundError)
    })

    it('should throw error if user is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: 'user3',
        user2Id: 'user4',
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)

      await expect(markMessagesAsRead(mockMatchId, mockUserId)).rejects.toThrow(ValidationError)
    })
  })

  describe('blockMatch', () => {
    it('should set match status to BLOCKED if user is part of it', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: mockUserId,
        user2Id: 'user2',
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)
      ;(prisma.match.update as jest.Mock).mockResolvedValue({
        ...mockMatch,
        status: 'BLOCKED',
      })

      await blockMatch(mockMatchId, mockUserId)

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        data: {
          status: MatchStatus.BLOCKED,
        },
      })
    })

    it('should throw error if match not found', async () => {
      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(blockMatch(mockMatchId, mockUserId)).rejects.toThrow(NotFoundError)
    })

    it('should throw error if user is not part of match', async () => {
      const mockMatch = {
        id: mockMatchId,
        user1Id: 'user3',
        user2Id: 'user4',
        status: MatchStatus.ACTIVE,
      }

      ;(prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch)

      await expect(blockMatch(mockMatchId, mockUserId)).rejects.toThrow(ValidationError)
    })
  })
})
