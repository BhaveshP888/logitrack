import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Schema & Users', () => {
  it('should seed admin and driver users successfully', async () => {
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThanOrEqual(2);
    
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    expect(admin).toBeDefined();
    expect(admin?.email).toBe('admin@logitrack.com');
    
    const driverUser = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
    expect(driverUser).toBeDefined();
    expect(driverUser?.driverId).not.toBeNull();
  });
});
