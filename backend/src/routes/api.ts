import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { generateUniqueTrackingNumber } from '../utils/tracking.js';
import { logShipmentEvent, broadcastMetrics } from '../simulation.js';

const router = Router();

// Public: Track shipment by tracking number (No auth required)
router.get('/shipments/public/:trackingNumber', async (req, res) => {
  const { trackingNumber } = req.params;
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: trackingNumber.trim().toUpperCase() },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: { select: { name: true, phone: true } },
        vehicle: { select: { licensePlate: true, modelName: true, vehicleType: true } },
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } },
        proofOfDelivery: true,
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public tracking info" });
  }
});

// Admin/Staff: Get Warehouses
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

// Admin/Staff: Get Vehicles (Fleet)
router.get('/vehicles', verifyToken, async (req, res) => {
  try {
    const data = await prisma.vehicle.findMany({
      include: { currentWarehouse: true },
      orderBy: { licensePlate: 'asc' }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// Admin/Staff: Get Drivers
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

    if (req.query.page) {
      res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

// Admin/Staff: Get Shipments with full relations
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
        vehicle: true,
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } },
        proofOfDelivery: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch shipments" });
  }
});

// Operations Metrics
router.get('/metrics', verifyToken, async (req, res) => {
  try {
    const total = await prisma.shipment.count();
    const active = await prisma.shipment.count({ where: { status: { in: ['EN_ROUTE', 'IN_TRANSIT', 'DELAYED'] } } });
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
  const {
    originId,
    destinationId,
    driverId,
    vehicleId,
    targetDispatchDate,
    contentDescription,
    price,
    items,
    checkpoints
  } = req.body;

  if (!originId || !destinationId || !targetDispatchDate) {
    return res.status(400).json({ error: "Missing required fields (originId, destinationId, targetDispatchDate)" });
  }

  try {
    const trk = await generateUniqueTrackingNumber();
    const origin = await prisma.warehouse.findUnique({ where: { id: originId } });
    const dest = await prisma.warehouse.findUnique({ where: { id: destinationId } });

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: trk,
        status: driverId ? "ASSIGNED" : "PENDING",
        originWarehouseId: originId,
        destinationWarehouseId: destinationId,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        price: price ? parseFloat(price) : 15000.0,
        rateAmount: price ? parseFloat(price) : 15000.0,
        contentDescription: contentDescription || "General Palletized Freight",
        targetDispatchDate: new Date(targetDispatchDate),
        items: {
          create: items?.map((item: any) => ({
            description: item.description || 'General Freight',
            quantity: item.quantity ? parseInt(item.quantity) : 1,
            weightKg: item.weightKg ? parseFloat(item.weightKg) : 500.0,
            volumeCbm: item.volumeCbm ? parseFloat(item.volumeCbm) : 2.0,
            isHazmat: !!item.isHazmat,
          })) || [
            { description: contentDescription || 'General Cargo', quantity: 1, weightKg: 1000.0, volumeCbm: 4.0 }
          ]
        },
        checkpoints: {
          create: checkpoints?.map((cp: { name: string; latitude?: number; longitude?: number }, i: number) => ({
            name: cp.name,
            orderIndex: i + 1,
            latitude: cp.latitude || null,
            longitude: cp.longitude || null,
          })) || []
        },
        events: {
          create: [
            {
              status: driverId ? 'ASSIGNED' : 'BOOKED',
              description: `Shipment created from ${origin?.name || 'Origin'} to ${dest?.name || 'Destination'}`,
              location: origin?.city || 'Origin Hub'
            }
          ]
        }
      },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: true,
        vehicle: true,
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('SHIPMENT_CREATED', shipment);
      await broadcastMetrics(io);
    }

    res.json(shipment);
  } catch (err) {
    console.error("Create shipment error:", err);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// Admin: Assign Driver & Vehicle
router.post('/shipments/:id/assign', verifyToken, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { driverId, vehicleId } = req.body;
  
  if (!driverId && !vehicleId) {
    return res.status(400).json({ error: "Provide driverId or vehicleId to assign" });
  }

  try {
    const updateData: any = { status: "ASSIGNED" };
    if (driverId) updateData.driverId = driverId;
    if (vehicleId) updateData.vehicleId = vehicleId;

    const updated = await prisma.shipment.update({
      where: { id },
      data: updateData,
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: true,
        vehicle: true,
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });

    const io = req.app.get('io');
    await logShipmentEvent(
      io,
      id,
      'ASSIGNED',
      `Allocated to Driver: ${updated.driver?.name || 'N/A'}${updated.vehicle ? `, Vehicle: ${updated.vehicle.licensePlate}` : ''}`
    );

    if (io) {
      io.emit('SHIPMENT_UPDATED', updated);
      await broadcastMetrics(io);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to assign driver/vehicle" });
  }
});

// Driver: Dispatch shipment
router.post('/shipments/:id/dispatch', verifyToken, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userDriverId = req.user?.driverId;

  if (!userDriverId) {
    return res.status(403).json({ error: "User is not associated with an active driver profile" });
  }

  const shipment = await prisma.shipment.findUnique({ where: { id }, include: { originWarehouse: true } });
  
  if (!shipment || shipment.driverId !== userDriverId) {
    return res.status(403).json({ error: "Not authorized to dispatch this shipment" });
  }
  if (shipment.status !== 'PENDING' && shipment.status !== 'ASSIGNED' && shipment.status !== 'DELAYED') {
    return res.status(400).json({ error: "Shipment cannot be dispatched from current status" });
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
        include: {
          originWarehouse: true,
          destinationWarehouse: true,
          driver: true,
          vehicle: true,
          items: true,
          checkpoints: { orderBy: { orderIndex: 'asc' } }
        }
      });
    });

    const io = req.app.get('io');
    await logShipmentEvent(
      io,
      id,
      'DISPATCHED',
      `Departed ${shipment.originWarehouse.name}. In transit.`,
      shipment.originWarehouse.city
    );

    if (io) {
      io.emit('SHIPMENT_DISPATCHED', { shipmentId: shipment.id, actualDispatchDate: updated.actualDispatchDate });
      io.emit('SHIPMENT_UPDATED', updated);
      await broadcastMetrics(io);
    }

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

  const targetIndex = shipment.checkpoints.findIndex(cp => cp.id === checkpointId);
  if (targetIndex === -1) {
    return res.status(404).json({ error: "Checkpoint not found for this shipment" });
  }

  const unreachedPreceding = shipment.checkpoints.slice(0, targetIndex).find(cp => !cp.reached && !cp.isAbsent);
  if (unreachedPreceding) {
    return res.status(400).json({
      error: `Cannot reach checkpoint out of sequence. Checkpoint "${unreachedPreceding.name}" must be verified first.`
    });
  }

  try {
    const reachedAt = new Date();
    const updatedCp = await prisma.shipmentCheckpoint.update({
      where: { id: checkpointId },
      data: { reached: true, reachedAt }
    });

    const io = req.app.get('io');
    await logShipmentEvent(
      io,
      id,
      'IN_TRANSIT',
      `Milestone reached: ${updatedCp.name} (Stop #${updatedCp.orderIndex})`,
      updatedCp.name
    );

    const finalShipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: true,
        vehicle: true,
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (io) {
      io.emit('CHECKPOINT_REACHED', { shipmentId: shipment.id, checkpointId, reachedAt: reachedAt.toISOString() });
      io.emit('SHIPMENT_UPDATED', finalShipment);
    }

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

    const io = req.app.get('io');
    await logShipmentEvent(
      io,
      id,
      'IN_TRANSIT',
      `Milestone bypassed/skipped: ${checkpoint.name}`,
      checkpoint.name
    );

    const finalShipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: true,
        vehicle: true,
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (io) {
      io.emit('CHECKPOINT_ABSENT', { shipmentId: shipment.id, checkpointId });
      io.emit('SHIPMENT_UPDATED', finalShipment);
    }

    res.json(finalShipment);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark checkpoint absent" });
  }
});

// Driver: Confirm Destination Reached with Proof of Delivery (POD)
router.post('/shipments/:id/deliver', verifyToken, requireRole('DRIVER'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { receivedBy, signatureData, photoUrl, notes, deliveryLat, deliveryLng } = req.body;
  const userDriverId = req.user?.driverId;

  if (!userDriverId) {
    return res.status(403).json({ error: "User is not associated with an active driver profile" });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { checkpoints: true, destinationWarehouse: true }
  });

  if (!shipment || shipment.driverId !== userDriverId) {
    return res.status(403).json({ error: "Not authorized to update this shipment" });
  }

  const hasPending = shipment.checkpoints.some(cp => !cp.reached && !cp.isAbsent);
  if (hasPending) {
    return res.status(400).json({ error: "Cannot complete delivery while route checkpoints are pending." });
  }

  try {
    const deliveryDate = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Update Shipment status
      await tx.shipment.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          actualDeliveryDate: deliveryDate
        }
      });

      // 2. Free up driver
      if (shipment.driverId) {
        await tx.driver.update({
          where: { id: shipment.driverId },
          data: { status: 'AVAILABLE', warehouseId: shipment.destinationWarehouseId }
        });
      }

      // 3. Create Proof of Delivery
      await tx.proofOfDelivery.create({
        data: {
          shipmentId: id,
          receivedBy: receivedBy || 'Authorized Receiver',
          signatureData: signatureData || 'DIGITAL_SIGNATURE_VERIFIED',
          photoUrl: photoUrl || null,
          notes: notes || 'Cargo delivered and verified in full',
          deliveryLat: deliveryLat || shipment.destinationWarehouse.latitude,
          deliveryLng: deliveryLng || shipment.destinationWarehouse.longitude,
          signedAt: deliveryDate,
        }
      });

      // 4. Generate Invoice
      const invNum = `INV-${Date.now().toString().slice(-6)}`;
      const amount = shipment.price || shipment.rateAmount || 15000.0;
      await tx.invoice.create({
        data: {
          invoiceNumber: invNum,
          shipmentId: id,
          amount,
          taxAmount: amount * 0.18,
          currency: shipment.currency || 'INR',
          status: 'UNPAID',
          issuedAt: deliveryDate
        }
      });
    });

    const io = req.app.get('io');
    await logShipmentEvent(
      io,
      id,
      'DELIVERED',
      `Cargo delivered to ${shipment.destinationWarehouse.name}. Proof of Delivery signed by ${receivedBy || 'Receiver'}.`,
      shipment.destinationWarehouse.city
    );

    const finalShipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: true,
        vehicle: true,
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } },
        proofOfDelivery: true,
        invoice: true,
      }
    });

    if (io) {
      io.emit('SHIPMENT_DELIVERED', { shipmentId: shipment.id, driverId: shipment.driverId });
      io.emit('SHIPMENT_UPDATED', finalShipment);
      await broadcastMetrics(io);
    }

    res.json(finalShipment);
  } catch (err) {
    console.error("Delivery error:", err);
    res.status(500).json({ error: "Failed to complete delivery" });
  }
});

// Admin: Reset database (disabled in production)
router.post('/reset', verifyToken, requireRole('ADMIN'), async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: "Reset endpoint is disabled in production environments" });
  }

  try {
    // Re-run seed
    const { exec } = await import('child_process');
    exec('npx tsx prisma/seed.ts', (error) => {
      if (error) {
        return res.status(500).json({ error: "Reset seed failed" });
      }
      res.json({ message: "Database reset to enterprise seed successfully" });
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset database" });
  }
});

export default router;
