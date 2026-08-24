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

  it('should retrieve list of commercial vehicles', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty('licensePlate');
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

  it('should create a new assigned shipment successfully', async () => {
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
        contentDescription: "Precision Euro-6 Engine Assemblies",
        checkpoints: [{ name: "Checkpoint A" }]
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trackingNumber');
    expect(res.body.status).toBe('ASSIGNED');
    expect(res.body.driverId).not.toBeNull();
    expect(res.body.checkpoints).toHaveLength(1);
  });

  it('should allow public tracking without authentication', async () => {
    const shipment = await prisma.shipment.findFirst();
    expect(shipment).toBeDefined();

    const res = await request(app)
      .get(`/api/shipments/public/${shipment?.trackingNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.trackingNumber).toBe(shipment?.trackingNumber);
    expect(res.body).toHaveProperty('originWarehouse');
    expect(res.body).toHaveProperty('destinationWarehouse');
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

  it('should enforce sequential checkpoint completion and POD delivery', async () => {
    // Login as driver1
    const driverLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver1@logitrack.com', password: 'Driver@123' });
    
    const driverCookie = driverLogin.headers['set-cookie'].map((c: string) => c.split(';')[0]).join('; ');

    // Create a shipment with 2 checkpoints
    const warehouses = await prisma.warehouse.findMany();
    const driver = await prisma.driver.findFirst({ where: { user: { email: 'driver1@logitrack.com' } } });

    const createRes = await request(app)
      .post('/api/shipments')
      .set('Cookie', adminCookie)
      .send({
        originId: warehouses[0].id,
        destinationId: warehouses[1].id,
        driverId: driver?.id,
        targetDispatchDate: new Date().toISOString(),
        checkpoints: [{ name: "Stop 1" }, { name: "Stop 2" }]
      });

    const shipmentId = createRes.body.id;
    const cp1 = createRes.body.checkpoints[0].id;
    const cp2 = createRes.body.checkpoints[1].id;

    // Dispatch
    const dispatchRes = await request(app)
      .post(`/api/shipments/${shipmentId}/dispatch`)
      .set('Cookie', driverCookie);
    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.status).toBe('EN_ROUTE');

    // Try reaching Stop 2 before Stop 1 -> 400 Bad Request
    const outOfOrderRes = await request(app)
      .post(`/api/shipments/${shipmentId}/checkpoints/${cp2}/reach`)
      .set('Cookie', driverCookie);
    expect(outOfOrderRes.status).toBe(400);

    // Reach Stop 1 in order -> 200 OK
    const reachCp1 = await request(app)
      .post(`/api/shipments/${shipmentId}/checkpoints/${cp1}/reach`)
      .set('Cookie', driverCookie);
    expect(reachCp1.status).toBe(200);
    expect(reachCp1.body.checkpoints[0].reached).toBe(true);

    // Reach Stop 2 in order -> 200 OK
    const reachCp2 = await request(app)
      .post(`/api/shipments/${shipmentId}/checkpoints/${cp2}/reach`)
      .set('Cookie', driverCookie);
    expect(reachCp2.status).toBe(200);
    expect(reachCp2.body.checkpoints[1].reached).toBe(true);

    // Deliver with Proof of Delivery
    const deliverRes = await request(app)
      .post(`/api/shipments/${shipmentId}/deliver`)
      .set('Cookie', driverCookie)
      .send({
        receivedBy: 'Vikram Mehta (Supervisor)',
        signatureData: 'SIG_VERIFIED',
        notes: 'Cargo inspected and verified in full'
      });

    expect(deliverRes.status).toBe(200);
    expect(deliverRes.body.status).toBe('DELIVERED');
    expect(deliverRes.body.proofOfDelivery).toBeDefined();
    expect(deliverRes.body.proofOfDelivery.receivedBy).toBe('Vikram Mehta (Supervisor)');
    expect(deliverRes.body.invoice).toBeDefined();
  });
});
