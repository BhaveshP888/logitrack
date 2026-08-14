import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { generateUniqueTrackingNumber } from '../utils/tracking.js';

const router = Router();

router.get('/warehouses', verifyToken, async (req, res) => {
  try {
    const data = await prisma.warehouse.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch warehouses" });
  }
});

router.get('/drivers', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.driver.findMany({
        skip,
        take: limit,
        include: { warehouse: true },
        orderBy: { name: 'asc' }
      }),
      prisma.driver.count()
    ]);

    // If client requested pagination headers/meta or raw array
    if (req.query.page) {
      res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

router.get('/shipments', verifyToken, async (req, res) => {
  try {
    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string) || 1) : undefined;
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50)) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const data = await prisma.shipment.findMany({
      skip,
      take: limit,
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

router.get('/metrics', verifyToken, async (req, res) => {
  try {
    const total = await prisma.shipment.count();
    const active = await prisma.shipment.count({ where: { status: { in: ['EN_ROUTE', 'DELAYED'] } } });
    const delivered = await prisma.shipment.count({ where: { status: 'DELIVERED' } });
    
    const totalDrivers = await prisma.driver.count();
    const activeDrivers = await prisma.driver.count({ where: { status: 'ON_DELIVERY' } });
    const utilizationRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;

    const delayed = await prisma.shipment.count({ where: { status: 'DELAYED' } });
    const onTimeRate = total > 0 ? ((total - delayed) / total) * 100 : 100;

    res.json({ activeCount: active, totalCount: total, deliveredCount: delivered, utilizationRate, onTimeRate });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Admin: Create a new pending shipment
router.post('/shipments', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { originId, destinationId, driverId, targetDispatchDate, checkpoints } = req.body;
  if (!originId || !destinationId || !targetDispatchDate || !driverId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const trk = await generateUniqueTrackingNumber();

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
  } catch (err) {
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// Admin: Assign driver to an existing shipment
router.post('/shipments/:id/assign', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body;
  
  if (!driverId) {
    return res.status(400).json({ error: "Missing driverId" });
  }

  try {
    const updated = await prisma.shipment.update({
      where: { id },
      data: { driverId },
      include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to assign driver" });
  }
});

// Driver: Dispatch shipment
router.post('/shipments/:id/dispatch', verifyToken, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userDriverId = req.user?.driverId;

  if (!userDriverId) {
    return res.status(403).json({ error: "User is not associated with an active driver profile" });
  }

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  
  if (!shipment || shipment.driverId !== userDriverId) {
    return res.status(403).json({ error: "Not authorized to dispatch this shipment" });
  }
  if (shipment.status !== 'PENDING' && shipment.status !== 'DELAYED') {
    return res.status(400).json({ error: "Shipment cannot be dispatched" });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.driver.update({
        where: { id: userDriverId },
        data: { status: "ON_DELIVERY" }
      });

      return tx.shipment.update({
        where: { id },
        data: { status: "EN_ROUTE", actualDispatchDate: new Date() },
        include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
      });
    });

    req.app.get('io').emit('SHIPMENT_DISPATCHED', { shipmentId: shipment.id, actualDispatchDate: updated.actualDispatchDate });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch shipment" });
  }
});

// Driver: Mark Checkpoint Reached
router.post('/shipments/:id/checkpoints/:checkpointId/reach', verifyToken, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { id, checkpointId } = req.params;
  const userDriverId = req.user?.driverId;

  if (!userDriverId) {
    return res.status(403).json({ error: "User is not associated with an active driver profile" });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { checkpoints: { orderBy: { orderIndex: 'asc' } } }
  });

  if (!shipment || shipment.driverId !== userDriverId) {
    return res.status(403).json({ error: "Not authorized to update this shipment" });
  }

  // Verify that the checkpoint belongs to the shipment
  const targetIndex = shipment.checkpoints.findIndex(cp => cp.id === checkpointId);
  if (targetIndex === -1) {
    return res.status(404).json({ error: "Checkpoint not found for this shipment" });
  }

  // Enforce sequential reaching: all checkpoints before targetIndex must be reached or absent
  const unreachedPreceding = shipment.checkpoints.slice(0, targetIndex).find(cp => !cp.reached && !cp.isAbsent);
  if (unreachedPreceding) {
    return res.status(400).json({
      error: `Cannot reach checkpoint out of sequence. Checkpoint "${unreachedPreceding.name}" (Stop #${unreachedPreceding.orderIndex}) must be reached or marked absent first.`
    });
  }

  try {
    const reachedAt = new Date();
    await prisma.shipmentCheckpoint.update({
      where: { id: checkpointId },
      data: { reached: true, reachedAt }
    });

    const finalShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
    });

    req.app.get('io').emit('CHECKPOINT_REACHED', { shipmentId: shipment.id, checkpointId, reachedAt: reachedAt.toISOString() });

    res.json(finalShipment);
  } catch (err) {
    res.status(500).json({ error: "Failed to update checkpoint" });
  }
});

// Driver: Mark Checkpoint Absent
router.post('/shipments/:id/checkpoints/:checkpointId/absent', verifyToken, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { id, checkpointId } = req.params;
  const userDriverId = req.user?.driverId;

  if (!userDriverId) {
    return res.status(403).json({ error: "User is not associated with an active driver profile" });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { checkpoints: { orderBy: { orderIndex: 'asc' } } }
  });

  if (!shipment || shipment.driverId !== userDriverId) {
    return res.status(403).json({ error: "Not authorized to update this shipment" });
  }

  const checkpoint = shipment.checkpoints.find(cp => cp.id === checkpointId);
  if (!checkpoint) return res.status(404).json({ error: "Checkpoint not found" });

  try {
    await prisma.shipmentCheckpoint.update({
      where: { id: checkpointId },
      data: { isAbsent: true }
    });

    const finalShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
    });

    req.app.get('io').emit('CHECKPOINT_ABSENT', { shipmentId: shipment.id, checkpointId });
    res.json(finalShipment);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark checkpoint absent" });
  }
});

// Driver: Confirm Destination Reached (Delivery)
router.post('/shipments/:id/deliver', verifyToken, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userDriverId = req.user?.driverId;

  if (!userDriverId) {
    return res.status(403).json({ error: "User is not associated with an active driver profile" });
  }

  const shipment = await prisma.shipment.findUnique({ where: { id }, include: { checkpoints: true } });

  if (!shipment || shipment.driverId !== userDriverId) {
    return res.status(403).json({ error: "Not authorized to update this shipment" });
  }

  // Ensure all checkpoints are either reached or absent
  const hasPending = shipment.checkpoints.some(cp => !cp.reached && !cp.isAbsent);
  if (hasPending) {
    return res.status(400).json({ error: "Cannot confirm delivery while checkpoints are pending. Mark them as reached or absent." });
  }

  try {
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

    const finalShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { originWarehouse: true, destinationWarehouse: true, driver: true, checkpoints: { orderBy: { orderIndex: 'asc' } } }
    });

    req.app.get('io').emit('SHIPMENT_DELIVERED', { shipmentId: shipment.id, driverId: shipment.driverId });
    res.json(finalShipment);
  } catch (err) {
    res.status(500).json({ error: "Failed to deliver shipment" });
  }
});

// Reset database simulation (Disabled in production)
router.post('/reset', verifyToken, requireRole('ADMIN'), async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: "Reset endpoint is disabled in production environments" });
  }

  try {
    await prisma.user.deleteMany();
    await prisma.shipmentCheckpoint.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.warehouse.deleteMany();

    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL || 'admin@logitrack.com';
    const adminPass = process.env.ADMIN_PASS || 'Adminlogin@1212';
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
  } catch (err) {
    res.status(500).json({ error: "Failed to reset database" });
  }
});

export default router;
