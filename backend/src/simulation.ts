import { Server } from 'socket.io';
import { prisma } from './db.js';

export function startSimulation(io: Server) {
  let isRunning = false;

  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      // 1. Check for PENDING shipments that missed their targetDispatchDate
      const now = new Date();
      const missedShipments = await prisma.shipment.findMany({
        where: {
          status: 'PENDING',
          targetDispatchDate: { lt: now }
        }
      });

      for (const shipment of missedShipments) {
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: { status: 'DELAYED' }
        });
        
        io.emit('SHIPMENT_DELAYED', { shipmentId: shipment.id, id: shipment.id });
      }

      // 2. Automate fake drivers (drivers with no linked User account)
      const activeBotShipments = await prisma.shipment.findMany({
        where: {
          status: { in: ['EN_ROUTE', 'DELAYED'] },
          driver: { user: null }
        },
        include: { checkpoints: { orderBy: { orderIndex: 'asc' } } }
      });

      for (const shipment of activeBotShipments) {
        // Find first checkpoint that has not been reached and not marked absent
        const nextCp = shipment.checkpoints.find(cp => !cp.reached && !cp.isAbsent);
        if (nextCp) {
          // 10% chance to reach next checkpoint every interval
          if (Math.random() < 0.1) {
            await prisma.shipmentCheckpoint.update({
              where: { id: nextCp.id },
              data: { reached: true, reachedAt: new Date() }
            });
            
            // Check if all checkpoints are now completed (reached or absent)
            const remainingPending = shipment.checkpoints.filter(
              cp => cp.id !== nextCp.id && !cp.reached && !cp.isAbsent
            );

            if (remainingPending.length === 0) {
              await prisma.$transaction(async (tx) => {
                await tx.shipment.update({ where: { id: shipment.id }, data: { status: 'DELIVERED' } });
                if (shipment.driverId) {
                  await tx.driver.update({ where: { id: shipment.driverId }, data: { status: 'AVAILABLE', warehouseId: shipment.destinationWarehouseId } });
                }
              });
              io.emit('SHIPMENT_DELIVERED', { shipmentId: shipment.id, driverId: shipment.driverId });
            } else {
              io.emit('CHECKPOINT_REACHED', { shipmentId: shipment.id, checkpointId: nextCp.id });
            }
          }
        } else if (shipment.checkpoints.length === 0) {
          // Edge case: no checkpoints, just deliver it randomly
          if (Math.random() < 0.05) {
            await prisma.$transaction(async (tx) => {
              await tx.shipment.update({ where: { id: shipment.id }, data: { status: 'DELIVERED' } });
              if (shipment.driverId) {
                await tx.driver.update({ where: { id: shipment.driverId }, data: { status: 'AVAILABLE', warehouseId: shipment.destinationWarehouseId } });
              }
            });
            io.emit('SHIPMENT_DELIVERED', { shipmentId: shipment.id, driverId: shipment.driverId });
          }
        }
      }

      // 3. Broadcast Metrics
      const total = await prisma.shipment.count();
      const active = await prisma.shipment.count({ where: { status: { in: ['EN_ROUTE', 'DELAYED'] } } });
      const delivered = await prisma.shipment.count({ where: { status: 'DELIVERED' } });
      const totalDrivers = await prisma.driver.count();
      const activeDrivers = await prisma.driver.count({ where: { status: 'ON_DELIVERY' } });
      const utilizationRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;
      const delayed = await prisma.shipment.count({ where: { status: 'DELAYED' } });
      const onTimeRate = total > 0 ? ((total - delayed) / total) * 100 : 100;

      io.emit('METRICS_UPDATE', { activeCount: active, totalCount: total, deliveredCount: delivered, utilizationRate, onTimeRate });

    } catch (err) {
      console.error("Simulation run error:", err);
    } finally {
      isRunning = false;
    }
  }, 5000);
}
