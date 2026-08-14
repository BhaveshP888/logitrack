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
    .send({ email: 'admin@logitrack.com', password: 'Adminlogin@1212' });
  const cookies = loginRes.headers['set-cookie'];
  if (Array.isArray(cookies)) {
    adminCookie = cookies.map(c => c.split(';')[0]).join('; ');
  } else {
    adminCookie = cookies || '';
  }
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

  it('should enforce sequential checkpoint completion for drivers', async () => {
    // Login as driver1
    const driverLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver1@logitrack.com', password: 'Driver@123' });
    const driverCookies = driverLogin.headers['set-cookie'];
    const driverCookie = Array.isArray(driverCookies) ? driverCookies.map(c => c.split(';')[0]).join('; ') : driverCookies || '';

    const driverUser = await prisma.user.findUnique({ where: { email: 'driver1@logitrack.com' } });
    const warehouses = await prisma.warehouse.findMany();

    // Create a shipment assigned to driver1 with 3 checkpoints
    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: `TRK-TEST-SEQ-${Date.now()}`,
        status: 'EN_ROUTE',
        originWarehouseId: warehouses[0].id,
        destinationWarehouseId: warehouses[1].id,
        driverId: driverUser?.driverId,
        targetDispatchDate: new Date(),
        checkpoints: {
          create: [
            { name: 'Stop 1', orderIndex: 1 },
            { name: 'Stop 2', orderIndex: 2 },
            { name: 'Stop 3', orderIndex: 3 }
          ]
        }
      },
      include: { checkpoints: { orderBy: { orderIndex: 'asc' } } }
    });

    const stop1 = shipment.checkpoints[0];
    const stop2 = shipment.checkpoints[1];

    // Attempt to reach Stop 2 before Stop 1
    const invalidReach = await request(app)
      .post(`/api/shipments/${shipment.id}/checkpoints/${stop2.id}/reach`)
      .set('Cookie', driverCookie);

    expect(invalidReach.status).toBe(400);
    expect(invalidReach.body.error).toContain('Cannot reach checkpoint out of sequence');

    // Reach Stop 1 first
    const reach1 = await request(app)
      .post(`/api/shipments/${shipment.id}/checkpoints/${stop1.id}/reach`)
      .set('Cookie', driverCookie);
    expect(reach1.status).toBe(200);

    // Now reach Stop 2
    const reach2 = await request(app)
      .post(`/api/shipments/${shipment.id}/checkpoints/${stop2.id}/reach`)
      .set('Cookie', driverCookie);
    expect(reach2.status).toBe(200);
  });
});

