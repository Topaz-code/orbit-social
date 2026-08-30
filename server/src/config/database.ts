import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    
    // Check if running on PostgreSQL or SQLite
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.startsWith('file:') || dbUrl.includes('.db')) {
      await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
      await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 5000;`);
      await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
      await prisma.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`);
      console.log('✅ SQLite database connected with WAL mode & foreign key protection');
    } else {
      await prisma.$queryRawUnsafe('SELECT 1;');
      console.log('✅ PostgreSQL database connected successfully');
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

