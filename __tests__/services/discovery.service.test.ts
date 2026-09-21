import { getDiscoveryProfiles, getNextDiscoveryProfile } from '@/lib/services/discovery.service'
import { prisma } from '@/lib/db/prisma'
import { Gender, ModerationStatus } from '@prisma/client'

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    like: {
      findMany: jest.fn(),
    },
    pass: {
      findMany: jest.fn(),
    },
    block: {
      findMany: jest.fn(),
    },
    profile: {
      findMany: jest.fn(),
    },
  },
}))

describe('Discovery Service', () => {
  const mockUserId = 'user1'
  const mockCurrentUser = {
    id: mockUserId,
    profile: {
      id: 'profile1',
      gender: Gender.MALE,
      age: 25,
      city: 'Addis Ababa',
      preferences: {
        preferredGender: Gender.FEMALE,
        minAge: 20,
        maxAge: 30,
        preferredCity: 'Addis Ababa',
        openToLongDistance: false,
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getDiscoveryProfiles', () => {
    it('should return eligible profiles for authenticated user', async () => {
      // Mock current user
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)

      // Mock no existing likes, passes, or blocks
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Mock eligible profiles
      const mockProfiles = [
        {
          id: 'profile2',
          userId: 'user2',
          age: 24,
          gender: Gender.FEMALE,
          city: 'Addis Ababa',
          bio: 'Test bio',
          moderationStatus: ModerationStatus.ACTIVE,
          completedOnboarding: true,
          photos: [{ id: 'photo1', url: 'http://test.com/photo1.jpg', order: 0, isPrimary: true }],
          interests: [{ id: 'interest1', name: 'Music' }],
          preferences: {
            preferredGender: Gender.MALE,
            minAge: 20,
            maxAge: 30,
            preferredCity: 'Addis Ababa',
            openToLongDistance: false,
          },
          user: {
            id: 'user2',
            firstName: 'Jane',
          },
        },
      ]

      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue(mockProfiles)

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user2')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: {
          profile: {
            include: {
              preferences: true,
            },
          },
        },
      })
    })

    it('should exclude current user from results', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since current user should be filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.objectContaining({
              not: mockUserId,
            }),
          }),
        })
      )
    })

    it('should exclude incomplete profiles', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since incomplete profiles are filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completedOnboarding: true,
          }),
        })
      )
    })

    it('should exclude suspended/banned profiles', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since suspended profiles are filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            moderationStatus: 'ACTIVE',
          }),
        })
      )
    })

    it('should exclude already liked profiles', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([{ likedId: 'user2' }])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since liked profiles are filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.objectContaining({
              notIn: expect.arrayContaining(['user2']),
            }),
          }),
        })
      )
    })

    it('should exclude already passed profiles', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([{ passedId: 'user2' }])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since passed profiles are filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.objectContaining({
              notIn: expect.arrayContaining(['user2']),
            }),
          }),
        })
      )
    })

    it('should exclude blocked users', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([
        { blockerId: mockUserId, blockedId: 'user2' },
      ])

      // Return empty array since blocked users are filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.objectContaining({
              notIn: expect.arrayContaining(['user2']),
            }),
          }),
        })
      )
    })

    it('should exclude users who blocked current user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([
        { blockerId: 'user2', blockedId: mockUserId },
      ])

      // Return empty array since users who blocked current user are filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.objectContaining({
              notIn: expect.arrayContaining(['user2']),
            }),
          }),
        })
      )
    })

    it('should respect age preferences', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since age is filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            age: expect.objectContaining({
              gte: 20,
              lte: 30,
            }),
          }),
        })
      )
    })

    it('should respect gender preferences', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since gender is filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gender: Gender.FEMALE,
          }),
        })
      )
    })

    it('should respect city preference when not open to long distance', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      // Return empty array since city is filtered by where clause
      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(0)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: 'Addis Ababa',
          }),
        })
      )
    })

    it('should show long-distance profiles when open to long distance', async () => {
      const userWithLongDistance = {
        ...mockCurrentUser,
        profile: {
          ...mockCurrentUser.profile,
          preferences: {
            ...mockCurrentUser.profile.preferences,
            openToLongDistance: true,
          },
        },
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithLongDistance)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      const mockProfiles = [
        {
          id: 'profile2',
          userId: 'user2',
          age: 24,
          gender: Gender.FEMALE,
          city: 'Bahirdar', // Different city but open to long distance
          moderationStatus: ModerationStatus.ACTIVE,
          completedOnboarding: true,
          photos: [],
          interests: [],
          preferences: null,
          user: { id: 'user2', firstName: 'Jane' },
        },
      ]

      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue(mockProfiles)

      const result = await getDiscoveryProfiles(mockUserId, 10)

      expect(result).toHaveLength(1)
    })

    it('should filter based on candidate preferences', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      const mockProfiles = [
        {
          id: 'profile2',
          userId: 'user2',
          age: 24,
          gender: Gender.FEMALE,
          city: 'Addis Ababa',
          moderationStatus: ModerationStatus.ACTIVE,
          completedOnboarding: true,
          photos: [],
          interests: [],
          preferences: {
            preferredGender: Gender.FEMALE, // Candidate wants FEMALE, but current user is MALE
            minAge: 20,
            maxAge: 30,
            preferredCity: 'Addis Ababa',
            openToLongDistance: false,
          },
          user: { id: 'user2', firstName: 'Jane' },
        },
      ]

      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue(mockProfiles)

      const result = await getDiscoveryProfiles(mockUserId, 10)

      // This should be filtered out by the post-query filtering based on candidate preferences
      expect(result).toHaveLength(0)
    })

    it('should limit results to specified number', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      const mockProfiles = Array.from({ length: 5 }, (_, i) => ({
        id: `profile${i + 2}`,
        userId: `user${i + 2}`,
        age: 20 + i,
        gender: Gender.FEMALE,
        city: 'Addis Ababa',
        moderationStatus: ModerationStatus.ACTIVE,
        completedOnboarding: true,
        photos: [],
        interests: [],
        preferences: null,
        user: { id: `user${i + 2}`, firstName: `User${i + 2}` },
      }))

      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue(mockProfiles)

      const result = await getDiscoveryProfiles(mockUserId, 5)

      expect(result.length).toBeLessThanOrEqual(5)
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      )
    })
  })

  describe('getNextDiscoveryProfile', () => {
    it('should return a single profile or null', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      const mockProfiles = [
        {
          id: 'profile2',
          userId: 'user2',
          age: 24,
          gender: Gender.FEMALE,
          city: 'Addis Ababa',
          moderationStatus: ModerationStatus.ACTIVE,
          completedOnboarding: true,
          photos: [],
          interests: [],
          preferences: null,
          user: { id: 'user2', firstName: 'Jane' },
        },
      ]

      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue(mockProfiles)

      const result = await getNextDiscoveryProfile(mockUserId)

      expect(result).not.toBeNull()
      expect(result?.userId).toBe('user2')
    })

    it('should return null when no profiles available', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser)
      ;(prisma.like.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.pass.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.block.findMany as jest.Mock).mockResolvedValue([])

      ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([])

      const result = await getNextDiscoveryProfile(mockUserId)

      expect(result).toBeNull()
    })
  })
})
