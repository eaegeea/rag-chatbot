import { PrismaClient } from '@prisma/client';
import Debug from 'debug';

const debug = Debug('database');

// Create a new Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Test database connection
export async function testConnection() {
  try {
    await prisma.$connect();
    debug('Database connected successfully');
    return true;
  } catch (error) {
    debug('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnect() {
  await prisma.$disconnect();
  debug('Database disconnected');
}

// Helper function to get user by email
export async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      region: true,
      assigned_clients: {
        include: {
          client_notes: true
        }
      }
    }
  });
}

// Helper function to get all users (for demo purposes)
export async function getAllUsers() {
  return await prisma.user.findMany({
    include: {
      region: true
    }
  });
}

// Helper function to get client notes with embeddings
export async function getClientNotesWithBlocks() {
  return await prisma.clientNote.findMany({
    include: {
      client: {
        include: {
          assigned_user: true,
          region: true
        }
      }
    }
  });
}

// Raw query execution for complex queries (like vector similarity)
export async function executeRawQuery(query, params = []) {
  return await prisma.$queryRawUnsafe(query, ...params);
}

export default prisma; 