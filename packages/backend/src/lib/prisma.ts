import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
process.on('beforeExit', () => {
  console.info('⏳ Disconnecting Prisma client...')
  prisma.$disconnect().then(() => {
    console.info('✅ Prisma client disconnected')
  }).catch((error: unknown) => {
    console.error('Error disconnecting Prisma client:', error)
  })
})