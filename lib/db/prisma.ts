import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient | undefined

function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return prismaInstance
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Handle special cases
    if (prop === 'then' || prop === 'toJSON') {
      return undefined
    }
    // Lazy initialization - only create client when actually used
    const client = getPrismaClient()
    return client[prop as keyof PrismaClient]
  },
})
