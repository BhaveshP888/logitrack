import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/warehouses', async (req, res) => {
  const data = await prisma.warehouse.findMany();
  res.json(data);
});

router.get('/drivers', async (req, res) => {
  const data = await prisma.driver.findMany({ include: { warehouse: true } });
  res.json(data);
});

router.get('/shipments', async (req, res) => {
  const data = await prisma.shipment.findMany({
    include: { originWarehouse: true, destinationWarehouse: true, driver: true }
  });
  res.json(data);
});

router.get('/metrics', async (req, res) => {
  const total = await prisma.shipment.count();
  const active = await prisma.shipment.count({ where: { status: { in: ['EN_ROUTE', 'DELAYED'] } } });
  const delivered = await prisma.shipment.count({ where: { status: 'DELIVERED' } });
  
  const totalDrivers = await prisma.driver.count();
  const activeDrivers = await prisma.driver.count({ where: { status: 'ON_DELIVERY' } });
  const utilizationRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;

  const delayed = await prisma.shipment.count({ where: { status: 'DELAYED' } });
  const onTimeRate = total > 0 ? ((total - delayed) / total) * 100 : 100;

  res.json({ activeCount: active, totalCount: total, deliveredCount: delivered, utilizationRate, onTimeRate });
});

// Create & dispatch new shipment
router.post('/shipments/dispatch', async (req, res) => {
  const { originId, destinationId } = req.body;
  if (!originId || !destinationId) {
    return res.status(400).json({ error: "Missing originId or destinationId" });
  }

  const availableDriver = await prisma.driver.findFirst({ where: { status: "AVAILABLE" } });
  if (!availableDriver) {
    return res.status(400).json({ error: "No available drivers" });
  }

  const origin = await prisma.warehouse.findUnique({ where: { id: originId } });
  if (!origin) return res.status(404).json({ error: "Origin warehouse not found" });

  const trk = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

  const shipment = await prisma.$transaction(async (tx) => {
    // Set driver status
    await tx.driver.update({
      where: { id: availableDriver.id },
      data: { status: "ON_DELIVERY" }
    });

    return tx.shipment.create({
      data: {
        trackingNumber: trk,
        status: "EN_ROUTE",
        originWarehouseId: originId,
        destinationWarehouseId: destinationId,
        driverId: availableDriver.id,
        currentLatitude: origin.latitude,
        currentLongitude: origin.longitude,
        progress: 0.0
      },
      include: { originWarehouse: true, destinationWarehouse: true, driver: true }
    });
  });

  res.json(shipment);
});

// Simulate a delay on a shipment
router.post('/shipments/:id/delay', async (req, res) => {
  const { id } = req.params;
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment || shipment.status !== 'EN_ROUTE') {
    return res.status(400).json({ error: "Shipment not found or not active" });
  }
  const updated = await prisma.shipment.update({
    where: { id },
    data: { status: 'DELAYED' },
    include: { originWarehouse: true, destinationWarehouse: true, driver: true }
  });
  res.json(updated);
});

// Reset database simulation
router.post('/reset', async (req, res) => {
  await prisma.shipment.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.warehouse.deleteMany();

  const w1 = await prisma.warehouse.create({ data: { name: "Mumbai Hub (W1)", latitude: 19.0760, longitude: 72.8777 } });
  const w2 = await prisma.warehouse.create({ data: { name: "Pune Hub (W2)", latitude: 18.5204, longitude: 73.8567 } });
  const w3 = await prisma.warehouse.create({ data: { name: "Nagpur Hub (W3)", latitude: 21.1458, longitude: 79.0882 } });
  const w4 = await prisma.warehouse.create({ data: { name: "Nashik Hub (W4)", latitude: 19.9975, longitude: 73.7898 } });
  const w5 = await prisma.warehouse.create({ data: { name: "Aurangabad Hub (W5)", latitude: 19.8762, longitude: 75.3433 } });

  await prisma.driver.create({ data: { name: "John Doe", status: "AVAILABLE", latitude: w1.latitude, longitude: w1.longitude, warehouseId: w1.id } });
  await prisma.driver.create({ data: { name: "Alice Smith", status: "AVAILABLE", latitude: w2.latitude, longitude: w2.longitude, warehouseId: w2.id } });
  await prisma.driver.create({ data: { name: "Bob Johnson", status: "AVAILABLE", latitude: w3.latitude, longitude: w3.longitude, warehouseId: w3.id } });

  res.json({ message: "Reset complete" });
});

export default router;
