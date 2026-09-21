import { createLike, createPass } from '@/lib/services/matching.service'
import { prisma } from '@/lib/db/prisma'
import { Gender } from '@prisma/client'
import { ValidationError, NotFoundError } from '@/lib/utils/errors'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    pass: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
    match: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('Matching Service', () => {
  const mockUserId = 'user1'
  const mockTargetUserId = 'user2'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPass', () => {
    it('should create a pass successfully', async () => {
      ;(prisma.pass.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockTargetUserId })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      const mockPass = {
        id: 'pass1',
        passerId: mockUserId,
        passedId: mockTargetUserId,
        createdAt: new Date(),
      }

      ;(prisma.pass.create as jest.Mock).mockResolvedValue(mockPass)

      const result = await createPass(mockUserId, mockTargetUserId)

      expect(result).toEqual({ pass: mockPass })
      expect(prisma.pass.create).toHaveBeenCalledWith({
        data: {
          passerId: mockUserId,
          passedId: mockTargetUserId,
        },
      })
    })

    it('should reject self-pass', async () => {
      await expect(createPass(mockUserId, mockUserId)).rejects.toThrow(ValidationError)
      await expect(createPass(mockUserId, mockUserId)).rejects.toThrow('You cannot pass yourself')
    })

    it('should reject duplicate pass', async () => {
      ;(prisma.pass.findUnique as jest.Mock).mockResolvedValue({
        id: 'pass1',
        passerId: mockUserId,
        passedId: mockTargetUserId,
      })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createPass(mockUserId, mockTargetUserId)).rejects.toThrow(ValidationError)
      await expect(createPass(mockUserId, mockTargetUserId)).rejects.toThrow('You have already passed this user')
    })

    it('should reject pass for non-existent user', async () => {
      ;(prisma.pass.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createPass(mockUserId, mockTargetUserId)).rejects.toThrow(NotFoundError)
      await expect(createPass(mockUserId, mockTargetUserId)).rejects.toThrow('User')
    })
  })

  describe('createLike', () => {
    it('should create a like successfully without match', async () => {
      ;(prisma.like.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // No existing like
        .mockResolvedValueOnce(null) // No mutual like
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockTargetUserId })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      const mockLike = {
        id: 'like1',
        likerId: mockUserId,
        likedId: mockTargetUserId,
        createdAt: new Date(),
      }

      ;(prisma.like.create as jest.Mock).mockResolvedValue(mockLike)

      const result = await createLike(mockUserId, mockTargetUserId)

      expect(result).toEqual({ like: mockLike, isMatch: false })
      expect(prisma.like.create).toHaveBeenCalledWith({
        data: {
          likerId: mockUserId,
          likedId: mockTargetUserId,
        },
      })
    })

    it('should create a match when mutual like exists', async () => {
      ;(prisma.like.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // No existing like
        .mockResolvedValueOnce({ id: 'like2', likerId: mockTargetUserId, likedId: mockUserId }) // Mutual like exists
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockTargetUserId })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.match.findFirst as jest.Mock).mockResolvedValue(null) // No existing match

      const mockLike = {
        id: 'like1',
        likerId: mockUserId,
        likedId: mockTargetUserId,
        createdAt: new Date(),
      }

      const mockMatch = {
        id: 'match1',
        user1Id: mockUserId,
        user2Id: mockTargetUserId,
        createdAt: new Date(),
      }

      ;(prisma.like.create as jest.Mock).mockResolvedValue(mockLike)
      ;(prisma.match.create as jest.Mock).mockResolvedValue(mockMatch)

      const mockLikerProfile = {
        id: mockUserId,
        firstName: 'John',
        profile: {
          photos: [{ url: 'http://test.com/photo1.jpg', isPrimary: true }],
        },
      }

      const mockLikedProfile = {
        id: mockTargetUserId,
        firstName: 'Jane',
        profile: {
          photos: [{ url: 'http://test.com/photo2.jpg', isPrimary: true }],
        },
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: mockTargetUserId })
        .mockResolvedValueOnce(mockLikerProfile)
        .mockResolvedValueOnce(mockLikedProfile)

      const result = await createLike(mockUserId, mockTargetUserId)

      expect(result.isMatch).toBe(true)
      expect(result.match).toEqual(mockMatch)
      expect(result.users).toEqual({
        liker: mockLikerProfile,
        liked: mockLikedProfile,
      })
      expect(prisma.match.create).toHaveBeenCalledWith({
        data: {
          user1Id: mockUserId,
          user2Id: mockTargetUserId,
        },
      })
    })

    it('should not create duplicate match', async () => {
      ;(prisma.like.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // No existing like
        .mockResolvedValueOnce({ id: 'like2', likerId: mockTargetUserId, likedId: mockUserId }) // Mutual like exists
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockTargetUserId })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      const existingMatch = {
        id: 'match1',
        user1Id: mockUserId,
        user2Id: mockTargetUserId,
        createdAt: new Date(),
      }

      ;(prisma.match.findFirst as jest.Mock).mockResolvedValue(existingMatch)

      const mockLike = {
        id: 'like1',
        likerId: mockUserId,
        likedId: mockTargetUserId,
        createdAt: new Date(),
      }

      ;(prisma.like.create as jest.Mock).mockResolvedValue(mockLike)

      const mockLikerProfile = {
        id: mockUserId,
        firstName: 'John',
        profile: {
          photos: [{ url: 'http://test.com/photo1.jpg', isPrimary: true }],
        },
      }

      const mockLikedProfile = {
        id: mockTargetUserId,
        firstName: 'Jane',
        profile: {
          photos: [{ url: 'http://test.com/photo2.jpg', isPrimary: true }],
        },
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: mockTargetUserId })
        .mockResolvedValueOnce(mockLikerProfile)
        .mockResolvedValueOnce(mockLikedProfile)

      const result = await createLike(mockUserId, mockTargetUserId)

      expect(result.isMatch).toBe(true)
      expect(result.match).toEqual(existingMatch)
      expect(prisma.match.create).not.toHaveBeenCalled()
    })

    it('should reject self-like', async () => {
      await expect(createLike(mockUserId, mockUserId)).rejects.toThrow(ValidationError)
      await expect(createLike(mockUserId, mockUserId)).rejects.toThrow('You cannot like yourself')
    })

    it('should reject duplicate like', async () => {
      ;(prisma.like.findUnique as jest.Mock).mockResolvedValue({
        id: 'like1',
        likerId: mockUserId,
        likedId: mockTargetUserId,
      })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createLike(mockUserId, mockTargetUserId)).rejects.toThrow(ValidationError)
      await expect(createLike(mockUserId, mockTargetUserId)).rejects.toThrow('You have already liked this user')
    })

    it('should reject like for non-existent user', async () => {
      ;(prisma.like.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      await expect(createLike(mockUserId, mockTargetUserId)).rejects.toThrow(NotFoundError)
      await expect(createLike(mockUserId, mockTargetUserId)).rejects.toThrow('User')
    })

    it('should handle match creation with missing photos', async () => {
      ;(prisma.like.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // No existing like
        .mockResolvedValueOnce({ id: 'like2', likerId: mockTargetUserId, likedId: mockUserId }) // Mutual like exists
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockTargetUserId })
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })
      ;(prisma.match.findFirst as jest.Mock).mockResolvedValue(null) // No existing match

      const mockLike = {
        id: 'like1',
        likerId: mockUserId,
        likedId: mockTargetUserId,
        createdAt: new Date(),
      }

      const mockMatch = {
        id: 'match1',
        user1Id: mockUserId,
        user2Id: mockTargetUserId,
        createdAt: new Date(),
      }

      ;(prisma.like.create as jest.Mock).mockResolvedValue(mockLike)
      ;(prisma.match.create as jest.Mock).mockResolvedValue(mockMatch)

      const mockLikerProfile = {
        id: mockUserId,
        firstName: 'John',
        profile: {
          photos: [], // No photos
        },
      }

      const mockLikedProfile = {
        id: mockTargetUserId,
        firstName: 'Jane',
        profile: undefined, // No profile
      }

      ;(prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: mockTargetUserId })
        .mockResolvedValueOnce(mockLikerProfile)
        .mockResolvedValueOnce(mockLikedProfile)
      ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({ moderationStatus: 'ACTIVE' })

      const result = await createLike(mockUserId, mockTargetUserId)

      expect(result.isMatch).toBe(true)
      expect(result.match).toEqual(mockMatch)
      expect(result.users).toEqual({
        liker: mockLikerProfile,
        liked: mockLikedProfile,
      })
    })
  })
})
