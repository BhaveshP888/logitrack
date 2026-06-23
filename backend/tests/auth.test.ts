import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { prisma } from '../src/db.js';
import { resetAndSeedDatabase } from './helpers.js';

beforeAll(async () => {
  await resetAndSeedDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

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

describe('Auth HTTP Endpoints', () => {
  it('should login admin and return HTTP cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@logitrack.com', password: 'Adminlogin@1212' });
    
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'].length).toBeGreaterThanOrEqual(2); // token and refreshToken
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@logitrack.com', password: 'wrongpassword' });
    
    expect(res.status).toBe(401);
  });

  it('should register a new driver successfully and not log them in automatically', async () => {
    const email = `new_driver_${Date.now()}@logitrack.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Driver', email, password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeUndefined();

    // Verify driver is in the database
    const dbUser = await prisma.user.findUnique({ where: { email } });
    expect(dbUser).toBeDefined();
    
    const dbDriver = await prisma.driver.findUnique({
      where: { id: dbUser?.driverId as string }
    });
    expect(dbDriver).toBeDefined();
    expect(dbDriver?.name).toBe('Jane Driver');
    expect(dbDriver?.status).toBe('AVAILABLE');
  });
});
