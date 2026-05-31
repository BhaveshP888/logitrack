import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '../src/server.js';

const prisma = new PrismaClient();

beforeAll(async () => {
  await request(app).post('/api/reset');
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
      .send({ email: 'admin@logitrack.com', password: 'admin123' });
    
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@logitrack.com', password: 'wrongpassword' });
    
    expect(res.status).toBe(401);
  });
});
