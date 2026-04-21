import { PrismaClient } from '@prisma/client'
import type { PrismaPg as PrismaPgType } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// require() em vez de import — @prisma/adapter-pg tem exportações CJS/ESM mistas.
// Turbopack resolve o caminho ESM com hash que o Node não consegue usar.
const { PrismaPg } = require('@prisma/adapter-pg') as { PrismaPg: typeof PrismaPgType }

// DIRECT_URL usa o pooler Supabase em modo session (porta 5432).
// Transaction mode (porta 6543) fecha conexões entre transações e causa
// "Connection terminated unexpectedly" com pg.Pool.
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
  keepAlive: true,
  ssl: { rejectUnauthorized: false },
})

// Silencia erros de conexão em background para evitar crash do processo
pool.on('error', (err) => {
  console.error('[pg pool] erro em conexão ociosa:', err.message)
})

const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
