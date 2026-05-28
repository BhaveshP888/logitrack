import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export function startSimulation(io: Server) {
  setInterval(async () => {
    try {
      const activeShipments = await prisma.shipment.findMany({
        where: { status: { in: ['EN_ROUTE', 'DELAYED'] } },
        include: { originWarehouse: true, destinationWarehouse: true, driver: true }
      });

      for (const shipment of activeShipments) {
        const stepSize = shipment.status === 'DELAYED' ? 2.5 : 5.0; // Delays slow it down
        const newProgress = Math.min(shipment.progress + stepSize, 100);

        const origin = shipment.originWarehouse;
        const dest = shipment.destinationWarehouse;

        // Linear interpolation of coordinates
        const ratio = newProgress / 100;
        const newLat = origin.latitude + (dest.latitude - origin.latitude) * ratio;
        const newLng = origin.longitude + (dest.longitude - origin.longitude) * ratio;

        if (newProgress >= 100) {
          // Completed delivery
          await prisma.$transaction(async (tx) => {
            await tx.shipment.update({
              where: { id: shipment.id },
              data: {
                progress: 100,
                status: 'DELIVERED',
                currentLatitude: dest.latitude,
                currentLongitude: dest.longitude
              }
            });

            if (shipment.driverId) {
              await tx.driver.update({
                where: { id: shipment.driverId },
                data: {
                  status: 'AVAILABLE',
                  latitude: dest.latitude,
                  longitude: dest.longitude,
                  warehouseId: dest.id
                }
              });
            }
          });

          // Emit completion events
          io.emit('SHIPMENT_DELIVERED', { shipmentId: shipment.id, driverId: shipment.driverId });
        } else {
          // Update active coordinates
          await prisma.$transaction(async (tx) => {
            await tx.shipment.update({
              where: { id: shipment.id },
              data: {
                progress: newProgress,
                currentLatitude: newLat,
                currentLongitude: newLng
              }
            });

            if (shipment.driverId) {
              await tx.driver.update({
                where: { id: shipment.driverId },
                data: {
                  latitude: newLat,
                  longitude: newLng
                }
              });
            }
          });

          // Emit update events
          io.emit('SHIPMENT_UPDATE', {
            id: shipment.id,
            progress: newProgress,
            currentLatitude: newLat,
            currentLongitude: newLng
          });

          if (shipment.driverId) {
            io.emit('DRIVER_UPDATE', {
              id: shipment.driverId,
              latitude: newLat,
              longitude: newLng
            });
          }
        }
      }

      // Periodically broadcast updated metrics
      if (activeShipments.length > 0) {
        const total = await prisma.shipment.count();
        const active = await prisma.shipment.count({ where: { status: { in: ['EN_ROUTE', 'DELAYED'] } } });
        const delivered = await prisma.shipment.count({ where: { status: 'DELIVERED' } });
        const totalDrivers = await prisma.driver.count();
        const activeDrivers = await prisma.driver.count({ where: { status: 'ON_DELIVERY' } });
        const utilizationRate = totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0;
        const delayed = await prisma.shipment.count({ where: { status: 'DELAYED' } });
        const onTimeRate = total > 0 ? ((total - delayed) / total) * 100 : 100;

        io.emit('METRICS_UPDATE', { activeCount: active, totalCount: total, deliveredCount: delivered, utilizationRate, onTimeRate });
      }
    } catch (err) {
      console.error("Simulation run error:", err);
    }
  }, 2000);
}
