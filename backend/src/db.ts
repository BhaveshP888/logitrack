import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

// Lazy singleton — defers connection until first database call.
// This prevents "DATABASE_URL missing" errors during module loading
// in test environments where env vars are set per-step, not per-import.
let _instance: PrismaClient | undefined;

function getInstance(): PrismaClient {
  if (!_instance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is missing");
    }
    const adapter = new PrismaPg({ connectionString });
    _instance = new PrismaClient({ adapter });
  }
  return _instance;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getInstance() as any)[prop];
  }
});
