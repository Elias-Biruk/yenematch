import { PrismaClient, Gender, RelationshipIntention, LifestyleChoice, ChildrenPreference } from '@prisma/client'

const prisma = new PrismaClient()

// Ethiopian male names
const ethiopianMaleNames = [
  'Abebe', 'Abel', 'Abebech', 'Abebe Tekle', 'Abrham', 'Adane', 'Adanech', 'Adugna', 'Alemu', 'Alemu Mekonnen',
  'Amanuel', 'Amare', 'Amarech', 'Andualem', 'Asfaw', 'Assefa', 'Belete', 'Belete Mekonnen', 'Bereket', 'Bereket Tesfaye',
  'Biniyam', 'Biruk', 'Biruk Abate', 'Cherenet', 'Dawit', 'Dawit Abebe', 'Desalegn', 'Ephrem', 'Ephrem Tekle', 'Eyasu',
  'Fasil', 'Fikadu', 'Fikru', 'Fikru Alemu', 'Gashaw', 'Gebre', 'Gebre Mariam', 'Girma', 'Girma Abebe', 'Haile',
  'Haile Mariam', 'Hagos', 'Hailu', 'Hailu Abate', 'Henok', 'Kaleb', 'Kaleb Tesfaye', 'Kebede', 'Kifle', 'Kifle Belay',
  'Kirubel', 'Kiros', 'Mammo', 'Mammo Kifle', 'Matios', 'Mekonnen', 'Mekonnen Abebe', 'Michael', 'Mikias', 'Mikias Girma',
  'Mulugeta', 'Mulugeta Haile', 'Nahom', 'Nahom Tesfaye', 'Natnael', 'Nigusse', 'Nigusse Alemu', 'Osman', 'Rahel', 'Rahel Abebe',
  'Samuel', 'Samuel Girma', 'Selam', 'Selam Tesfaye', 'Sileshi', 'Sileshi Mekonnen', 'Solomon', 'Solomon Abebe', 'Tadesse', 'Tadesse Belete',
  'Tamirat', 'Tamirat Alemu', 'Tewodros', 'Tewodros Girma', 'Tilahun', 'Tilahun Kifle', 'Tsige', 'Wondimu', 'Wondimu Haile', 'Yared',
  'Yonas', 'Yonas Abebe', 'Yosef', 'Yosef Mekonnen', 'Zelalem', 'Zelalem Tesfaye', 'Zerihun', 'Zerihun Girma', 'Zewdu', 'Zewdu Belete'
]

// Ethiopian female names
const ethiopianFemaleNames = [
  'Abebech', 'Adanech', 'Almaz', 'Almaz Girma', 'Alem', 'Alem Abebe', 'Alemu', 'Alemu Tesfaye', 'Alganesh', 'Alganesh Belete',
  'Amarech', 'Ambaw', 'Ambaw Alemu', 'Amsale', 'Amsale Mekonnen', 'Ansha', 'Ansha Girma', 'Askale', 'Askale Abebe', 'Atsede',
  'Birtukan', 'Birtukan Tesfaye', 'Blen', 'Blen Belete', 'Bruk', 'Bruk Alemu', 'Dinknesh', 'Dinknesh Girma', 'Eleni', 'Eleni Mekonnen',
  'Elfenesh', 'Elfenesh Abebe', 'Emebet', 'Emebet Tesfaye', 'Emu', 'Emu Belete', 'Erette', 'Erette Alemu', 'Etalem', 'Etalem Girma',
  'Etenesh', 'Etenesh Mekonnen', 'Fikirte', 'Fikirte Abebe', 'Fredda', 'Fredda Tesfaye', 'Genet', 'Genet Belete', 'Girmawit', 'Girmawit Alemu',
  'Hanna', 'Hanna Girma', 'Haregewoin', 'Haregewoin Mekonnen', 'Hiwot', 'Hiwot Abebe', 'Hosanna', 'Hosanna Tesfaye', 'Kidan', 'Kidan Belete',
  'Kidanesh', 'Kidanesh Alemu', 'Kokeb', 'Kokeb Girma', 'Kumneger', 'Kumneger Mekonnen', 'Mahlet', 'Mahlet Abebe', 'Marta', 'Marta Tesfaye',
  'Mekdes', 'Mekdes Belete', 'Meseret', 'Meseret Alemu', 'Mihret', 'Mihret Girma', 'Milkias', 'Milkias Mekonnen', 'Miriam', 'Miriam Abebe',
  'Mulu', 'Mulu Tesfaye', 'Nahom', 'Nahom Belete', 'Nigist', 'Nigist Alemu', 'Rahel', 'Rahel Girma', 'Ruth', 'Ruth Mekonnen',
  'Saba', 'Saba Abebe', 'Sahle', 'Sahle Tesfaye', 'Salem', 'Salem Belete', 'Samrawit', 'Samrawit Alemu', 'Sara', 'Sara Girma',
  'Selam', 'Selam Mekonnen', 'Selamawit', 'Selamawit Abebe', 'Senait', 'Senait Tesfaye', 'Serkaddis', 'Serkaddis Belete', 'Sewit', 'Sewit Alemu',
  'Sosina', 'Sosina Girma', 'Tadesse', 'Tadesse Mekonnen', 'Tafesse', 'Tafesse Abebe', 'Tegist', 'Tegist Tesfaye', 'Tsehay', 'Tsehay Belete',
  'Tsion', 'Tsion Alemu', 'Woinshet', 'Woinshet Girma', 'Wubit', 'Wubit Mekonnen', 'Yemiserach', 'Yemiserach Abebe', 'Yordanos', 'Yordanos Tesfaye',
  'Zebiba', 'Zebiba Belete', 'Zerfe', 'Zerfe Alemu', 'Zewditu', 'Zewditu Girma', 'Zinash', 'Zinash Mekonnen', 'Zinet', 'Zinet Abebe'
]

// Ethiopian cities
const cities = ['Addis Ababa', 'Hawassa', 'Adama', 'Mekele', 'Bahir Dar']

// Relationship intentions from Prisma schema
const relationshipIntentions: RelationshipIntention[] = [
  'SERIOUS_RELATIONSHIP',
  'MARRIAGE',
  'LONG_TERM',
  'DATING',
  'CASUAL_DATING',
  'FRIENDSHIP_FIRST',
  'NOT_SURE'
]

// Lifestyle choices from Prisma schema
const lifestyleChoices: LifestyleChoice[] = [
  'NEVER',
  'OCCASIONALLY',
  'REGULARLY',
  'DOESNT_MATTER'
]

// Children preferences from Prisma schema
const childrenPreferences: ChildrenPreference[] = [
  'HAS_CHILDREN',
  'NO_CHILDREN',
  'WANTS_CHILDREN',
  'DOESNT_WANT_CHILDREN',
  'MAYBE_SOMEDAY',
  'NOT_SURE'
]

// Languages
const languages = ['Amharic', 'Afaan Oromoo', 'Tigrinya', 'English']

// Seeded Telegram IDs (to avoid conflicts with real users)
const TELEGRAM_ID_OFFSET = 900000000

// Convert to string for Prisma
const TELEGRAM_ID_OFFSET_STR = String(TELEGRAM_ID_OFFSET)

// Seed marker to identify seed users
const SEED_USERNAME_PREFIX = 'seed_user_'

// Deterministic random number generator
function seededRandom(seed: number) {
  let value = seed
  return function() {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

// Generate deterministic data for a user
function generateUserData(index: number, gender: Gender) {
  const random = seededRandom(index + TELEGRAM_ID_OFFSET)
  
  const isMale = gender === 'MALE'
  const names = isMale ? ethiopianMaleNames : ethiopianFemaleNames
  const nameIndex = Math.floor(random() * names.length)
  const firstName = names[nameIndex]
  const lastName = names[(nameIndex + Math.floor(random() * names.length)) % names.length]
  
  const age = 18 + Math.floor(random() * 23) // 18-40
  const city = cities[Math.floor(random() * cities.length)]
  
  // Generate preferences
  const preferredGender = random() > 0.1 ? (isMale ? 'FEMALE' : 'MALE') : 'OTHER'
  const minAge = 18 + Math.floor(random() * 10)
  const maxAge = minAge + 5 + Math.floor(random() * 15)
  const preferredCity = random() > 0.3 ? cities[Math.floor(random() * cities.length)] : null
  const relationshipIntention = relationshipIntentions[Math.floor(random() * relationshipIntentions.length)]
  const openToLongDistance = random() > 0.6
  const smoking = lifestyleChoices[Math.floor(random() * lifestyleChoices.length)]
  const drinking = lifestyleChoices[Math.floor(random() * lifestyleChoices.length)]
  const childrenPreference = childrenPreferences[Math.floor(random() * childrenPreferences.length)]
  
  // Generate 1-3 languages
  const numLanguages = 1 + Math.floor(random() * 3)
  const userLanguages: string[] = []
  for (let i = 0; i < numLanguages; i++) {
    const lang = languages[Math.floor(random() * languages.length)]
    if (!userLanguages.includes(lang)) {
      userLanguages.push(lang)
    }
  }
  
  // Generate bio
  const bios = [
    `I'm ${firstName}, a ${age}-year-old from ${city}. Looking for meaningful connections.`,
    `Hello! I'm ${firstName} from ${city}. I enjoy ${userLanguages.join(' and ')} culture and meeting new people.`,
    `${firstName} here! ${age} years old, living in ${city}. Ready to find my match.`,
    `Hi, I'm ${firstName}. ${age} years old from ${city}. Looking for someone special.`,
    `I'm ${firstName}, ${age}, from ${city}. Let's see where this journey takes us.`
  ]
  const bio = bios[Math.floor(random() * bios.length)]
  
  // Generate interests
  const allInterests = ['Music', 'Movies', 'Reading', 'Travel', 'Cooking', 'Sports', 'Art', 'Photography', 'Hiking', 'Dancing', 'Coffee', 'Technology', 'Fitness', 'Fashion', 'Volunteering']
  const numInterests = 2 + Math.floor(random() * 4)
  const interests: string[] = []
  for (let i = 0; i < numInterests; i++) {
    const interest = allInterests[Math.floor(random() * allInterests.length)]
    if (!interests.includes(interest)) {
      interests.push(interest)
    }
  }
  
  // Generate placeholder photo URL
  const photoUrl = `https://i.pravatar.cc/400?img=${(index % 70) + 1}`
  
  return {
    telegramId: String(TELEGRAM_ID_OFFSET + index),
    firstName,
    lastName,
    age,
    gender,
    city,
    bio,
    interests,
    photoUrl,
    preferredGender: preferredGender as Gender,
    minAge,
    maxAge,
    preferredCity,
    relationshipIntention,
    openToLongDistance,
    smoking,
    drinking,
    childrenPreference,
    languages: userLanguages,
  }
}

// Retry helper for transient Neon errors
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      const isTransientError = 
        error.code === 'P1001' || // Can't reach database
        error.code === 'P1017' || // Server closed connection
        error.code === 'P2028'    // Transaction not found
      
      if (!isTransientError || attempt === maxRetries - 1) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`  Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

async function main() {
  console.log('Starting seed...')
  
  // Delete only seed users (identified by username prefix OR telegramId range)
  console.log('Cleaning existing seed users...')
  const deleteResult = await prisma.user.deleteMany({
    where: {
      OR: [
        {
          username: {
            startsWith: SEED_USERNAME_PREFIX
          }
        },
        {
          telegramId: {
            gte: TELEGRAM_ID_OFFSET_STR
          }
        }
      ]
    }
  })
  console.log(`Deleted ${deleteResult.count} existing seed users`)
  
  console.log('Creating 1,000 test users...')
  
  const users = []
  
  // Create 500 male users
  for (let i = 0; i < 500; i++) {
    const userData = generateUserData(i, 'MALE')
    users.push(userData)
  }
  
  // Create 500 female users
  for (let i = 0; i < 500; i++) {
    const userData = generateUserData(500 + i, 'FEMALE')
    users.push(userData)
  }
  
  console.log('Inserting users into database...')
  
  const BATCH_SIZE = 25  // Reduced from 50 to reduce load on Neon
  const totalSeedUsers = users.length
  let successCount = 0
  
  for (let batchStart = 0; batchStart < totalSeedUsers; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalSeedUsers)
    const batch = users.slice(batchStart, batchEnd)
    
    console.log(`Inserting users: ${batchStart + 1}-${batchEnd}/${totalSeedUsers}`)
    
    try {
      // Process batch with retry logic - use bulk operations where possible
      await retryWithBackoff(async () => {
        // First, create all users in batch
        const usersData = batch.map(userData => ({
          telegramId: userData.telegramId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: `${SEED_USERNAME_PREFIX}${userData.telegramId}`,
        }))
        
        await prisma.user.createMany({
          data: usersData,
          skipDuplicates: true
        })
        
        // Fetch created users to get their IDs
        const createdUsers = await prisma.user.findMany({
          where: {
            telegramId: {
              in: batch.map(u => u.telegramId)
            }
          }
        })
        
        // Create profiles and related data for each user
        for (const user of createdUsers) {
          const userData = batch.find(u => u.telegramId === user.telegramId)
          if (!userData) continue
          
          const cloudinaryId = `seed_${userData.telegramId}`
          
          // Create profile with photo and completed onboarding
          const profile = await prisma.profile.create({
            data: {
              userId: user.id,
              age: userData.age,
              gender: userData.gender,
              city: userData.city,
              bio: userData.bio,
              moderationStatus: 'ACTIVE',
              completedOnboarding: true,
              photos: {
                create: {
                  url: userData.photoUrl,
                  order: 0,
                  isPrimary: true,
                  cloudinaryPublicId: cloudinaryId
                }
              }
            }
          })
          
          // Create interests in bulk
          const interestData = userData.interests.map(interest => ({
            profileId: profile.id,
            name: interest
          }))
          await prisma.interest.createMany({
            data: interestData,
            skipDuplicates: true
          })
          
          // Create preferences
          await prisma.preference.create({
            data: {
              profileId: profile.id,
              preferredGender: userData.preferredGender as Gender,
              minAge: userData.minAge,
              maxAge: userData.maxAge,
              preferredCity: userData.preferredCity,
              relationshipIntention: userData.relationshipIntention,
              openToLongDistance: userData.openToLongDistance,
              smoking: userData.smoking,
              drinking: userData.drinking,
              childrenPreference: userData.childrenPreference,
              languages: userData.languages,
            }
          })
        }
      })
      
      successCount += batch.length
      console.log(`✓ Completed batch ${batchStart + 1}-${batchEnd} (${successCount}/${totalSeedUsers})`)
      
      // Delay between batches to avoid Neon rate limiting
      if (batchEnd < totalSeedUsers) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
    } catch (error) {
      console.error(`Error in batch ${batchStart + 1}-${batchEnd}:`, error)
      // Don't throw error - continue with next batch for resumability
      console.log(`Continuing with next batch...`)
    }
  }
  
  console.log('Seed completed successfully!')
  
  // Verify counts - only count seed users
  const totalSeedUsersDb = await prisma.user.count({
    where: {
      OR: [
        {
          username: {
            startsWith: SEED_USERNAME_PREFIX
          }
        },
        {
          telegramId: {
            gte: TELEGRAM_ID_OFFSET_STR
          }
        }
      ]
    }
  })
  
  const maleUsers = await prisma.profile.count({
    where: {
      gender: 'MALE' as Gender,
      user: {
        OR: [
          {
            username: {
              startsWith: SEED_USERNAME_PREFIX
            }
          },
          {
            telegramId: {
              gte: TELEGRAM_ID_OFFSET_STR
            }
          }
        ]
      }
    }
  })
  
  const femaleUsers = await prisma.profile.count({
    where: {
      gender: 'FEMALE' as Gender,
      user: {
        OR: [
          {
            username: {
              startsWith: SEED_USERNAME_PREFIX
            }
          },
          {
            telegramId: {
              gte: TELEGRAM_ID_OFFSET_STR
            }
          }
        ]
      }
    }
  })
  
  console.log(`Total seed users: ${totalSeedUsersDb}`)
  console.log(`Male seed users: ${maleUsers}`)
  console.log(`Female seed users: ${femaleUsers}`)
  
  // Verify age distribution
  const profiles = await prisma.profile.findMany({
    where: {
      user: {
        OR: [
          {
            username: {
              startsWith: SEED_USERNAME_PREFIX
            }
          },
          {
            telegramId: {
              gte: TELEGRAM_ID_OFFSET_STR
            }
          }
        ]
      }
    },
    select: {
      age: true,
      city: true,
      gender: true
    }
  })
  
  const ages = profiles.map(p => p.age)
  const minAge = Math.min(...ages)
  const maxAge = Math.max(...ages)
  const cityCounts = profiles.reduce((acc, p) => {
    acc[p.city] = (acc[p.city] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log(`Age range: ${minAge}-${maxAge}`)
  console.log('City distribution:', cityCounts)
  
  // Final validation
  if (totalSeedUsersDb !== 1000) {
    throw new Error(`Expected 1000 seed users, got ${totalSeedUsersDb}`)
  }
  if (maleUsers !== 500) {
    throw new Error(`Expected 500 male users, got ${maleUsers}`)
  }
  if (femaleUsers !== 500) {
    throw new Error(`Expected 500 female users, got ${femaleUsers}`)
  }
  
  console.log('✓ All validations passed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })