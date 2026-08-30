import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    
    // Execute SQLite Performance & Concurrency Hardening Pragmas (WAL mode)
    await prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    
    console.log('✅ SQLite database connected with WAL mode & foreign key protection');
  } catch (error) {
    console.error('❌ Failed to connect to SQLite database:', error);
    process.exit(1);
  }
}
