import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../src/server.js';
import { prisma } from '../src/db.js';

import { resetAndSeedDatabase } from './helpers.js';

let adminCookie: string;

beforeAll(async () => {
  await resetAndSeedDatabase();

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@logitrack.com', password: 'admin123' });
  const cookies = loginRes.headers['set-cookie'];
  adminCookie = Array.isArray(cookies) ? cookies[0] : cookies || '';
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe('LogiTrack API Endpoints', () => {
  it('should retrieve list of warehouses', async () => {
    const res = await request(app)
      .get('/api/warehouses')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
  });

  it('should retrieve list of drivers', async () => {
    const res = await request(app)
      .get('/api/drivers')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it('should retrieve initial dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/metrics')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeCount');
    expect(res.body).toHaveProperty('utilizationRate');
  });

  it('should create a new pending shipment successfully', async () => {
    const warehouses = await prisma.warehouse.findMany();
    const origin = warehouses[0].id;
    const dest = warehouses[1].id;
    const driver = await prisma.driver.findFirst();

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 2);

    const res = await request(app)
      .post('/api/shipments')
      .set('Cookie', adminCookie)
      .send({
        originId: origin,
        destinationId: dest,
        driverId: driver?.id,
        targetDispatchDate: futureDate.toISOString(),
        checkpoints: [{ name: "Checkpoint A" }]
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trackingNumber');
    expect(res.body.status).toBe('PENDING');
    expect(res.body.driverId).not.toBeNull();
    expect(res.body.checkpoints).toHaveLength(1);
  });

  it('should block unauthenticated shipment creation', async () => {
    const warehouses = await prisma.warehouse.findMany();
    const origin = warehouses[0].id;
    const dest = warehouses[1].id;

    const res = await request(app)
      .post('/api/shipments')
      .send({ originId: origin, destinationId: dest });

    expect(res.status).toBe(401);
  });
});
