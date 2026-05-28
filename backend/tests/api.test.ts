import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../src/server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run seed logic
  await request(app).post('/api/reset');
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe('LogiTrack API Endpoints', () => {
  it('should retrieve list of warehouses', async () => {
    const res = await request(app).get('/api/warehouses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);
  });

  it('should retrieve list of drivers', async () => {
    const res = await request(app).get('/api/drivers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it('should retrieve initial dashboard metrics', async () => {
    const res = await request(app).get('/api/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activeCount');
    expect(res.body).toHaveProperty('utilizationRate');
  });

  it('should dispatch a new shipment successfully', async () => {
    const warehouses = await prisma.warehouse.findMany();
    const origin = warehouses[0].id;
    const dest = warehouses[1].id;

    const res = await request(app)
      .post('/api/shipments/dispatch')
      .send({ originId: origin, destinationId: dest });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trackingNumber');
    expect(res.body.status).toBe('EN_ROUTE');
    expect(res.body.driverId).not.toBeNull();
  });
});
