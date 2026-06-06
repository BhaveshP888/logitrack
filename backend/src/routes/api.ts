import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { prisma } from '../db.js';

const router = Router();

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
    include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
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

// Admin: Create a new pending shipment
router.post('/shipments', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { originId, destinationId, driverId, targetDispatchDate, checkpoints } = req.body;
  if (!originId || !destinationId || !targetDispatchDate || !driverId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const trk = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber: trk,
      status: "PENDING",
      originWarehouseId: originId,
      destinationWarehouseId: destinationId,
      driverId: driverId,
      targetDispatchDate: new Date(targetDispatchDate),
      checkpoints: {
        create: checkpoints?.map((cp: { name: string }, i: number) => ({
          name: cp.name,
          orderIndex: i + 1
        })) || []
      }
    },
    include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
  });

  res.json(shipment);
});

// Driver: Dispatch shipment
router.post('/shipments/:id/dispatch', verifyToken, requireRole('DRIVER'), async (req, res) => {
  const { id } = req.params;
  const shipment = await prisma.shipment.findUnique({ where: { id } });
  
  // @ts-ignore
  if (!shipment || shipment.driverId !== req.user?.driverId) {
    return res.status(403).json({ error: "Not authorized to dispatch this shipment" });
  }
  if (shipment.status !== 'PENDING' && shipment.status !== 'DELAYED') {
    return res.status(400).json({ error: "Shipment cannot be dispatched" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.driver.update({
      where: { id: shipment.driverId || undefined },
      data: { status: "ON_DELIVERY" }
    });

    return tx.shipment.update({
      where: { id },
      data: { status: "EN_ROUTE", actualDispatchDate: new Date() },
      include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
    });
  });

  req.app.get('io').emit('SHIPMENT_DISPATCHED', { id: shipment.id });

  res.json(updated);
});

// Driver: Mark Checkpoint Reached
router.post('/shipments/:id/checkpoints/:checkpointId/reach', verifyToken, requireRole('DRIVER'), async (req, res) => {
  const { id, checkpointId } = req.params;
  const shipment = await prisma.shipment.findUnique({ where: { id }, include: { checkpoints: true } });

  // @ts-ignore
  if (!shipment || shipment.driverId !== req.user?.driverId) {
    return res.status(403).json({ error: "Not authorized to update this shipment" });
  }

  await prisma.shipmentCheckpoint.update({
    where: { id: checkpointId },
    data: { reached: true, reachedAt: new Date() }
  });

  // Check if all checkpoints reached
  const updatedShipment = await prisma.shipment.findUnique({ where: { id }, include: { checkpoints: true } });
  const allReached = updatedShipment?.checkpoints.every(cp => cp.reached);

  if (allReached) {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id },
        data: { status: 'DELIVERED' }
      });
      if (shipment.driverId) {
        await tx.driver.update({
          where: { id: shipment.driverId },
          data: { status: 'AVAILABLE', warehouseId: shipment.destinationWarehouseId }
        });
      }
    });
  }

  const finalShipment = await prisma.shipment.findUnique({
    where: { id },
    include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
  });

  if (allReached) {
    req.app.get('io').emit('SHIPMENT_DELIVERED', { shipmentId: shipment.id, driverId: shipment.driverId });
  } else {
    req.app.get('io').emit('CHECKPOINT_REACHED', { shipmentId: shipment.id, checkpointId });
  }

  res.json(finalShipment);
});



// Reset database simulation
router.post('/reset', verifyToken, requireRole('ADMIN'), async (req, res) => {
  await prisma.user.deleteMany();
  await prisma.shipmentCheckpoint.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.warehouse.deleteMany();

  const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL || 'admin@email.com';
  const adminPass = process.env.ADMIN_PASS || 'adminlogin1212';
  const adminPasswordHash = await bcrypt.hash(adminPass, 10);

  const w1 = await prisma.warehouse.create({ data: { name: "Mumbai Hub (W1)" } });
  const w2 = await prisma.warehouse.create({ data: { name: "Pune Hub (W2)" } });
  const w3 = await prisma.warehouse.create({ data: { name: "Nagpur Hub (W3)" } });
  const w4 = await prisma.warehouse.create({ data: { name: "Nashik Hub (W4)" } });
  const w5 = await prisma.warehouse.create({ data: { name: "Aurangabad Hub (W5)" } });

  await prisma.user.create({
    data: { email: adminEmail, passwordHash: adminPasswordHash, role: 'ADMIN' }
  });

  const now = new Date();
  const futureDispatch = new Date(now.getTime() + 1000 * 60 * 60 * 2);

  await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-SEED-001',
      status: 'PENDING',
      originWarehouseId: w1.id,
      destinationWarehouseId: w3.id,
      driverId: null,
      targetDispatchDate: futureDispatch,
      checkpoints: {
        create: [
          { name: 'Thane Sorting Center', orderIndex: 1 },
          { name: 'Kalyan Toll Plaza', orderIndex: 2 },
          { name: 'Igatpuri Checkpost', orderIndex: 3 }
        ]
      }
    }
  });

  res.json({ message: "Reset complete" });
});

export default router;
