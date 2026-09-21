import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create a test user with completed onboarding
  const completedUser = await prisma.user.upsert({
    where: { telegramId: '123456789' },
    update: {},
    create: {
      telegramId: '123456789',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
    },
  })

  const completedProfile = await prisma.profile.upsert({
    where: { userId: completedUser.id },
    update: {},
    create: {
      userId: completedUser.id,
      age: 25,
      gender: 'MALE',
      city: 'Addis Ababa',
      bio: 'Test user with completed onboarding',
      completedOnboarding: true,
      preferences: {
        create: {
          preferredGender: 'FEMALE',
          minAge: 20,
          maxAge: 30,
          preferredCity: 'Addis Ababa',
          relationshipIntention: 'SERIOUS_RELATIONSHIP',
          openToLongDistance: true,
          smoking: 'NEVER',
          drinking: 'OCCASIONALLY',
          childrenPreference: 'WANTS_CHILDREN',
          languages: ['Amharic', 'English'],
        },
      },
    },
  })

  // Add some interests to the completed profile
  await prisma.interest.createMany({
    data: [
      { profileId: completedProfile.id, name: 'Music' },
      { profileId: completedProfile.id, name: 'Travel' },
      { profileId: completedProfile.id, name: 'Reading' },
    ],
    skipDuplicates: true,
  })

  // Add some photos to the completed profile
  await prisma.photo.createMany({
    data: [
      {
        profileId: completedProfile.id,
        url: 'https://example.com/photo1.jpg',
        order: 0,
        isPrimary: true,
      },
      {
        profileId: completedProfile.id,
        url: 'https://example.com/photo2.jpg',
        order: 1,
        isPrimary: false,
      },
    ],
    skipDuplicates: true,
  })

  // Create a test user without completed onboarding
  const incompleteUser = await prisma.user.upsert({
    where: { telegramId: '987654321' },
    update: {},
    create: {
      telegramId: '987654321',
      firstName: 'Incomplete',
      lastName: 'User',
      username: 'incompleteuser',
    },
  })

  console.log('Database seed completed successfully!')
  console.log('Created users:')
  console.log(`  - Completed user (telegramId: ${completedUser.telegramId})`)
  console.log(`  - Incomplete user (telegramId: ${incompleteUser.telegramId})`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
