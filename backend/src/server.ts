import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { authRouter } from './routes/auth.js';
import { startSimulation } from './simulation.js';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('DRIVER_TELEMETRY', async (data: { driverId: string; latitude: number; longitude: number; shipmentId?: string; progress?: number }) => {
    // Broadcast driver update to all clients
    io.emit('DRIVER_UPDATE', { id: data.driverId, latitude: data.latitude, longitude: data.longitude });

    if (data.shipmentId) {
      const shipment = await prisma.shipment.findUnique({
        where: { id: data.shipmentId },
        include: { originWarehouse: true, destinationWarehouse: true }
      });

      if (shipment) {
        const reached = (data.progress !== undefined && data.progress >= 100) ||
          (Math.abs(data.latitude - shipment.destinationWarehouse.latitude) < 0.0001 &&
           Math.abs(data.longitude - shipment.destinationWarehouse.longitude) < 0.0001);

        if (reached) {
          await prisma.$transaction(async (tx) => {
            await tx.shipment.update({
              where: { id: data.shipmentId },
              data: {
                progress: 100,
                status: 'DELIVERED',
                currentLatitude: data.latitude,
                currentLongitude: data.longitude
              }
            });
            if (data.driverId) {
              await tx.driver.update({
                where: { id: data.driverId },
                data: {
                  status: 'AVAILABLE',
                  latitude: data.latitude,
                  longitude: data.longitude,
                  warehouseId: shipment.destinationWarehouseId
                }
              });
            }
          });
          io.emit('SHIPMENT_DELIVERED', { shipmentId: data.shipmentId, driverId: data.driverId });
        } else {
          const progress = data.progress !== undefined ? data.progress : shipment.progress;
          await prisma.$transaction(async (tx) => {
            await tx.shipment.update({
              where: { id: data.shipmentId },
              data: {
                currentLatitude: data.latitude,
                currentLongitude: data.longitude,
                progress
              }
            });
            if (data.driverId) {
              await tx.driver.update({
                where: { id: data.driverId },
                data: {
                  latitude: data.latitude,
                  longitude: data.longitude
                }
              });
            }
          });
          io.emit('SHIPMENT_UPDATE', {
            id: data.shipmentId,
            progress,
            currentLatitude: data.latitude,
            currentLongitude: data.longitude
          });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

startSimulation(io);

const PORT = process.env.VITEST ? 3002 : (process.env.PORT || 3001);
// TODO(security): Listen on localhost only for safety during dev/test
if (!process.env.VITEST) {
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export { app, server };
