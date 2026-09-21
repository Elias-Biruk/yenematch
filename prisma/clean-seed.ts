import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TELEGRAM_ID_OFFSET = 900000000
const TELEGRAM_ID_OFFSET_STR = String(TELEGRAM_ID_OFFSET)

async function main() {
  console.log('Deleting existing seed users...')
  
  // Count existing seed users
  const existingSeedUsers = await prisma.user.count({
    where: {
      telegramId: {
        gte: TELEGRAM_ID_OFFSET_STR
      }
    }
  })
  
  console.log(`Found ${existingSeedUsers} existing seed users`)
  
  if (existingSeedUsers > 0) {
    // Delete seed users (cascade will handle related records)
    const result = await prisma.user.deleteMany({
      where: {
        telegramId: {
          gte: TELEGRAM_ID_OFFSET_STR
        }
      }
    })
    
    console.log(`Deleted ${result.count} seed users`)
  }
  
  console.log('Clean seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
