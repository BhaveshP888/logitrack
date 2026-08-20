import { Server } from 'socket.io';
import { prisma } from './db.js';

/**
 * Audit-log an operational shipment event and notify real-time listeners.
 */
export async function logShipmentEvent(
  io: Server | null,
  shipmentId: string,
  status: string,
  description: string,
  location?: string
) {
  try {
    const event = await prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status,
        description,
        location
      }
    });

    if (io) {
      io.emit('SHIPMENT_EVENT_LOGGED', {
        shipmentId,
        event
      });
    }
    return event;
  } catch (err) {
    console.error("Failed to log shipment event:", err);
    return null;
  }
}

/**
 * Broadcasts system-wide live fleet metrics to all connected dispatch monitors.
 */
export async function broadcastMetrics(io: Server) {
  try {
    const total = await prisma.shipment.count();
    const active = await prisma.shipment.count({ where: { status: { in: ['EN_ROUTE', 'IN_TRANSIT', 'DELAYED'] } } });
    const delivered = await prisma.shipment.count({ where: { status: 'DELIVERED' } });
    const totalDrivers = await prisma.driver.count();
    const activeDrivers = await prisma.driver.count({ where: { status: 'ON_DELIVERY' } });
    const utilizationRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;
    const delayed = await prisma.shipment.count({ where: { status: 'DELAYED' } });
    const onTimeRate = total > 0 ? ((total - delayed) / total) * 100 : 100;

    io.emit('METRICS_UPDATE', {
      activeCount: active,
      totalCount: total,
      deliveredCount: delivered,
      utilizationRate,
      onTimeRate
    });
  } catch (err) {
    console.error("Metrics broadcast error:", err);
  }
}

/**
 * Starts deterministic SLA monitor (checks genuine target dispatch deadlines every 30 seconds).
 */
export function startSimulation(io: Server) {
  let isChecking = false;

  // Run every 30s to check for genuine SLA dispatch deadlines
  setInterval(async () => {
    if (isChecking) return;
    isChecking = true;

    try {
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

        await logShipmentEvent(
          io,
          shipment.id,
          'DELAYED',
          `Departure target missed (${shipment.targetDispatchDate.toISOString()}). Status flagged as DELAYED.`
        );

        io.emit('SHIPMENT_DELAYED', { shipmentId: shipment.id, id: shipment.id });
      }

      await broadcastMetrics(io);
    } catch (err) {
      console.error("SLA monitor error:", err);
    } finally {
      isChecking = false;
    }
  }, 30000);
}
