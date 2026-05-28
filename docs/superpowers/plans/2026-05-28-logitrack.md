# LogiTrack Real-Time Logistics & Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time logistics analytics dashboard featuring PostgreSQL database tracking warehouses/drivers/shipments, an Express backend that simulates delivery vehicle movements, Socket.io streaming updates, and a React 19 Redux Toolkit frontend with a responsive, glassmorphism-themed interactive simulated map.

**Architecture:** A fullstack monorepo consisting of a Node.js/Express backend running a recurring linear interpolation simulation of shipments along path networks, persisting status updates to a PostgreSQL database via Prisma ORM, and broadcasting events via Socket.io. The React 19 frontend connects to the socket stream, dispatches events to a Redux store, and renders a dashboard utilizing an interactive custom SVG map and Bento Grid metric cards.

**Tech Stack:** React 19, Redux Toolkit, Socket.io, Node.js (Express), Prisma ORM (PostgreSQL), TypeScript, Vitest / Supertest, Vanilla CSS.

---

## User Review Required

> [!IMPORTANT]
> The database connection requires a working PostgreSQL instance. We will configure a default local database connection string `postgresql://postgres:postgres@localhost:5432/logitrack?schema=public` in `backend/.env`. You will need to ensure PostgreSQL is running or supply a custom connection URL in `.env`.
> We will use custom interactive SVG rendering to visualize the map, avoiding external map API key requirements (like Google Maps/Mapbox) while keeping design premium and self-contained.

## Open Questions

> [!NOTE]
> None currently. The design maps directly to requirements.

---

## Proposed Changes

```
logitrack/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── server.ts
│   │   ├── simulation.ts
│   │   └── routes/
│   │       └── api.ts
│   ├── tests/
│   │   └── api.test.ts
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── store/
    │   │   ├── index.ts
    │   │   ├── shipmentsSlice.ts
    │   │   ├── driversSlice.ts
    │   │   ├── warehousesSlice.ts
    │   │   └── socketMiddleware.ts
    │   └── components/
    │       ├── Sidebar.tsx
    │       ├── MetricsGrid.tsx
    │       ├── LiveMap.tsx
    │       ├── ShipmentsList.tsx
    │       └── ControlCenter.tsx
    ├── tsconfig.json
    └── package.json
```

---

### Task 1: Backend Workspace Setup & Prisma Schema

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/.env`
- Test: Run Prisma validation command

- [ ] **Step 1: Create `backend/package.json`**
  Write package configuration with script commands, typescript and prisma dependencies.
  ```json
  {
    "name": "logitrack-backend",
    "version": "1.0.0",
    "main": "dist/server.js",
    "scripts": {
      "dev": "tsx watch src/server.ts",
      "build": "tsc",
      "start": "node dist/server.js",
      "prisma:generate": "prisma generate",
      "prisma:migrate": "prisma migrate dev",
      "prisma:seed": "prisma db seed",
      "test": "vitest run"
    },
    "prisma": {
      "seed": "tsx prisma/seed.ts"
    },
    "dependencies": {
      "@prisma/client": "^5.14.0",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.19.2",
      "socket.io": "^4.7.5"
    },
    "devDependencies": {
      "@types/cors": "^2.8.17",
      "@types/express": "^4.17.21",
      "@types/node": "^20.12.12",
      "prisma": "^5.14.0",
      "supertest": "^7.0.0",
      "tsx": "^4.10.5",
      "typescript": "^5.4.5",
      "vitest": "^1.6.0"
    }
  }
  ```

- [ ] **Step 2: Create `backend/tsconfig.json`**
  Configure TypeScript.
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "esModuleInterop": true,
      "strict": true,
      "skipLibCheck": true,
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*"]
  }
  ```

- [ ] **Step 3: Create `backend/prisma/schema.prisma`**
  Define strict relational schema mapping Warehouses -> Drivers -> Shipments.
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }

  model Warehouse {
    id        String   @id @default(uuid())
    name      String
    latitude  Float
    longitude Float
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    drivers            Driver[]
    originShipments      Shipment[] @relation("OriginWarehouse")
    destinationShipments Shipment[] @relation("DestinationWarehouse")
  }

  model Driver {
    id          String   @id @default(uuid())
    name        String
    status      String   // AVAILABLE, ON_DELIVERY, OFFLINE
    latitude    Float
    longitude   Float
    warehouseId String
    warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
    shipments   Shipment[]
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@index([status])
  }

  model Shipment {
    id                     String   @id @default(uuid())
    trackingNumber         String   @unique
    status                 String   // PENDING, EN_ROUTE, DELIVERED, DELAYED
    originWarehouseId      String
    originWarehouse        Warehouse @relation("OriginWarehouse", fields: [originWarehouseId], references: [id])
    destinationWarehouseId String
    destinationWarehouse   Warehouse @relation("DestinationWarehouse", fields: [destinationWarehouseId], references: [id])
    driverId               String?
    driver                 Driver?   @relation(fields: [driverId], references: [id])
    currentLatitude        Float
    currentLongitude       Float
    progress               Float     @default(0.0) // 0.0 to 100.0
    createdAt              DateTime @default(now())
    updatedAt              DateTime @updatedAt

    @@index([status])
    @@index([trackingNumber])
  }
  ```

- [ ] **Step 4: Create `backend/.env`**
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/logitrack?schema=public"
  PORT=3001
  ```

- [ ] **Step 5: Install & Verify Prisma**
  Run: `npm install` inside `backend` and generate prisma client.
  Command: `cd backend && npm install && npx prisma validate`
  Expected: Schema is valid.

---

### Task 2: Seed Script & Database Migration

**Files:**
- Create: `backend/prisma/seed.ts`

- [ ] **Step 1: Create `backend/prisma/seed.ts`**
  Write seed script to populate sample Warehouses, Drivers, and initial Shipments.
  ```typescript
  import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function main() {
    // Clean data
    await prisma.shipment.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.warehouse.deleteMany();

    // Create 4 Warehouses at custom coordinates
    const w1 = await prisma.warehouse.create({
      data: { name: "Seattle Hub (W1)", latitude: 47.6062, longitude: -122.3321 }
    });
    const w2 = await prisma.warehouse.create({
      data: { name: "Los Angeles Hub (W2)", latitude: 34.0522, longitude: -118.2437 }
    });
    const w3 = await prisma.warehouse.create({
      data: { name: "Chicago Hub (W3)", latitude: 41.8781, longitude: -87.6298 }
    });
    const w4 = await prisma.warehouse.create({
      data: { name: "New York Hub (W4)", latitude: 40.7128, longitude: -74.0060 }
    });

    console.log("Warehouses seeded");

    // Create Drivers
    const d1 = await prisma.driver.create({
      data: { name: "John Doe", status: "AVAILABLE", latitude: w1.latitude, longitude: w1.longitude, warehouseId: w1.id }
    });
    const d2 = await prisma.driver.create({
      data: { name: "Alice Smith", status: "AVAILABLE", latitude: w2.latitude, longitude: w2.longitude, warehouseId: w2.id }
    });
    const d3 = await prisma.driver.create({
      data: { name: "Bob Johnson", status: "AVAILABLE", latitude: w3.latitude, longitude: w3.longitude, warehouseId: w3.id }
    });

    console.log("Drivers seeded");

    // Create a default Shipment
    await prisma.shipment.create({
      data: {
        trackingNumber: "TRK-1001",
        status: "PENDING",
        originWarehouseId: w1.id,
        destinationWarehouseId: w3.id,
        currentLatitude: w1.latitude,
        currentLongitude: w1.longitude,
        progress: 0.0
      }
    });

    console.log("Shipments seeded");
  }

  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
  ```

- [ ] **Step 2: Run Migrations and Seed**
  Command: `cd backend && npx prisma migrate dev --name init && npx prisma db seed`
  Expected: Migration succeeds and logs "Shipments seeded".

---

### Task 3: Backend API, Socket Server, and Simulation Engine

**Files:**
- Create: `backend/src/routes/api.ts`
- Create: `backend/src/simulation.ts`
- Create: `backend/src/server.ts`

- [ ] **Step 1: Create `backend/src/routes/api.ts`**
  Build API router to retrieve data and trigger actions.
  ```typescript
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

    const w1 = await prisma.warehouse.create({ data: { name: "Seattle Hub (W1)", latitude: 47.6062, longitude: -122.3321 } });
    const w2 = await prisma.warehouse.create({ data: { name: "Los Angeles Hub (W2)", latitude: 34.0522, longitude: -118.2437 } });
    const w3 = await prisma.warehouse.create({ data: { name: "Chicago Hub (W3)", latitude: 41.8781, longitude: -87.6298 } });
    const w4 = await prisma.warehouse.create({ data: { name: "New York Hub (W4)", latitude: 40.7128, longitude: -74.0060 } });

    await prisma.driver.create({ data: { name: "John Doe", status: "AVAILABLE", latitude: w1.latitude, longitude: w1.longitude, warehouseId: w1.id } });
    await prisma.driver.create({ data: { name: "Alice Smith", status: "AVAILABLE", latitude: w2.latitude, longitude: w2.longitude, warehouseId: w2.id } });
    await prisma.driver.create({ data: { name: "Bob Johnson", status: "AVAILABLE", latitude: w3.latitude, longitude: w3.longitude, warehouseId: w3.id } });

    res.json({ message: "Reset complete" });
  });

  export default router;
  ```

- [ ] **Step 2: Create `backend/src/simulation.ts`**
  Build simulation engine which interpolates vehicle coordinate positions and pushes WebSocket notifications to clients.
  ```typescript
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
  ```

- [ ] **Step 3: Create `backend/src/server.ts`**
  Build main express server & listen on localhost.
  ```typescript
  import express from 'express';
  import http from 'http';
  import { Server } from 'socket.io';
  import cors from 'cors';
  import dotenv from 'dotenv';
  import apiRouter from './routes/api.js';
  import { startSimulation } from './simulation.js';

  dotenv.config();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Vite default port
      methods: ["GET", "POST"]
    }
  });

  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  app.use('/api', apiRouter);

  // Healthcheck
  app.get('/health', (req, res) => {
    res.json({ status: "OK" });
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  startSimulation(io);

  const PORT = process.env.PORT || 3001;
  // TODO(security): Listen on localhost only for safety during dev/test
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  export { app, server };
  ```

---

### Task 4: Backend API Tests

**Files:**
- Create: `backend/tests/api.test.ts`

- [ ] **Step 1: Create `backend/tests/api.test.ts`**
  Write integration tests for API endpoints using Supertest.
  ```typescript
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
  ```

- [ ] **Step 2: Run Tests**
  Command: `cd backend && npm run test`
  Expected: All tests pass.

---

### Task 5: Frontend Workspace Setup & Redux Toolkit State Engine

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/store/shipmentsSlice.ts`
- Create: `frontend/src/store/driversSlice.ts`
- Create: `frontend/src/store/warehousesSlice.ts`
- Create: `frontend/src/store/socketMiddleware.ts`
- Create: `frontend/src/store/index.ts`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Create `frontend/package.json`**
  ```json
  {
    "name": "logitrack-frontend",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "typescript && vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "@reduxjs/toolkit": "^2.2.5",
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "react-redux": "^9.1.2",
      "socket.io-client": "^4.7.5"
    },
    "devDependencies": {
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@vitejs/plugin-react": "^4.3.0",
      "typescript": "^5.4.5",
      "vite": "^5.2.11"
    }
  }
  ```

- [ ] **Step 2: Create `frontend/vite.config.ts`**
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      host: 'localhost'
    }
  });
  ```

- [ ] **Step 3: Create `frontend/src/store/shipmentsSlice.ts`**
  Manage shipment data fetched via REST API and updated dynamically via Sockets.
  ```typescript
  import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

  export interface Warehouse {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }

  export interface Driver {
    id: string;
    name: string;
    status: string;
    latitude: number;
    longitude: number;
  }

  export interface Shipment {
    id: string;
    trackingNumber: string;
    status: string;
    originWarehouseId: string;
    originWarehouse: Warehouse;
    destinationWarehouseId: string;
    destinationWarehouse: Warehouse;
    driverId: string | null;
    driver: Driver | null;
    currentLatitude: number;
    currentLongitude: number;
    progress: number;
    updatedAt: string;
  }

  interface ShipmentsState {
    items: Shipment[];
    loading: boolean;
    error: string | null;
    selectedId: string | null;
  }

  const initialState: ShipmentsState = {
    items: [],
    loading: false,
    error: null,
    selectedId: null
  };

  export const fetchShipments = createAsyncThunk('shipments/fetchShipments', async () => {
    const res = await fetch('http://localhost:3001/api/shipments');
    if (!res.ok) throw new Error("Failed to fetch shipments");
    return (await res.json()) as Shipment[];
  });

  const shipmentsSlice = createSlice({
    name: 'shipments',
    initialState,
    reducers: {
      updateShipmentCoords: (state, action: PayloadAction<{ id: string; progress: number; currentLatitude: number; currentLongitude: number }>) => {
        const shipment = state.items.find(item => item.id === action.payload.id);
        if (shipment) {
          shipment.progress = action.payload.progress;
          shipment.currentLatitude = action.payload.currentLatitude;
          shipment.currentLongitude = action.payload.currentLongitude;
        }
      },
      shipmentDelivered: (state, action: PayloadAction<{ shipmentId: string }>) => {
        const shipment = state.items.find(item => item.id === action.payload.shipmentId);
        if (shipment) {
          shipment.progress = 100;
          shipment.status = 'DELIVERED';
        }
      },
      addShipment: (state, action: PayloadAction<Shipment>) => {
        state.items.push(action.payload);
      },
      selectShipment: (state, action: PayloadAction<string | null>) => {
        state.selectedId = action.payload;
      }
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchShipments.pending, (state) => { state.loading = true; })
        .addCase(fetchShipments.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload;
        })
        .addCase(fetchShipments.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to load shipments";
        });
    }
  });

  export const { updateShipmentCoords, shipmentDelivered, addShipment, selectShipment } = shipmentsSlice.actions;
  export default shipmentsSlice.reducer;
  ```

- [ ] **Step 4: Create `frontend/src/store/driversSlice.ts`**
  Manage driver statuses and locations.
  ```typescript
  import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
  import { Driver } from './shipmentsSlice.js';

  interface DriversState {
    items: Driver[];
    loading: boolean;
    error: string | null;
  }

  const initialState: DriversState = {
    items: [],
    loading: false,
    error: null
  };

  export const fetchDrivers = createAsyncThunk('drivers/fetchDrivers', async () => {
    const res = await fetch('http://localhost:3001/api/drivers');
    if (!res.ok) throw new Error("Failed to fetch drivers");
    return (await res.json()) as Driver[];
  });

  const driversSlice = createSlice({
    name: 'drivers',
    initialState,
    reducers: {
      updateDriverCoords: (state, action: PayloadAction<{ id: string; latitude: number; longitude: number }>) => {
        const driver = state.items.find(d => d.id === action.payload.id);
        if (driver) {
          driver.latitude = action.payload.latitude;
          driver.longitude = action.payload.longitude;
        }
      },
      driverStatusChange: (state, action: PayloadAction<{ id: string; status: string; latitude?: number; longitude?: number }>) => {
        const driver = state.items.find(d => d.id === action.payload.id);
        if (driver) {
          driver.status = action.payload.status;
          if (action.payload.latitude !== undefined) driver.latitude = action.payload.latitude;
          if (action.payload.longitude !== undefined) driver.longitude = action.payload.longitude;
        }
      }
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchDrivers.pending, (state) => { state.loading = true; })
        .addCase(fetchDrivers.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload;
        })
        .addCase(fetchDrivers.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to load drivers";
        });
    }
  });

  export const { updateDriverCoords, driverStatusChange } = driversSlice.actions;
  export default driversSlice.reducer;
  ```

- [ ] **Step 5: Create `frontend/src/store/warehousesSlice.ts`**
  ```typescript
  import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
  import { Warehouse } from './shipmentsSlice.js';

  interface WarehousesState {
    items: Warehouse[];
    loading: boolean;
    error: string | null;
  }

  const initialState: WarehousesState = {
    items: [],
    loading: false,
    error: null
  };

  export const fetchWarehouses = createAsyncThunk('warehouses/fetchWarehouses', async () => {
    const res = await fetch('http://localhost:3001/api/warehouses');
    if (!res.ok) throw new Error("Failed to fetch warehouses");
    return (await res.json()) as Warehouse[];
  });

  const warehousesSlice = createSlice({
    name: 'warehouses',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchWarehouses.pending, (state) => { state.loading = true; })
        .addCase(fetchWarehouses.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload;
        })
        .addCase(fetchWarehouses.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to load warehouses";
        });
    }
  });

  export default warehousesSlice.reducer;
  ```

- [ ] **Step 6: Create `frontend/src/store/socketMiddleware.ts`**
  Manage Socket.io streams to live update the Redux state.
  ```typescript
  import { Middleware } from '@reduxjs/toolkit';
  import { io, Socket } from 'socket.io-client';
  import { updateShipmentCoords, shipmentDelivered } from './shipmentsSlice.js';
  import { updateDriverCoords, driverStatusChange } from './driversSlice.js';

  let socket: Socket;

  export const socketMiddleware: Middleware = store => next => action => {
    // Initialize connection on app boot or custom action
    if (action.type === 'socket/connect') {
      if (!socket) {
        socket = io('http://localhost:3001');

        socket.on('connect', () => {
          console.log("Connected to WebSocket backend server");
        });

        socket.on('SHIPMENT_UPDATE', (data: { id: string; progress: number; currentLatitude: number; currentLongitude: number }) => {
          store.dispatch(updateShipmentCoords(data));
        });

        socket.on('DRIVER_UPDATE', (data: { id: string; latitude: number; longitude: number }) => {
          store.dispatch(updateDriverCoords(data));
        });

        socket.on('SHIPMENT_DELIVERED', (data: { shipmentId: string; driverId: string | null }) => {
          store.dispatch(shipmentDelivered({ shipmentId: data.shipmentId }));
          if (data.driverId) {
            store.dispatch(driverStatusChange({ id: data.driverId, status: 'AVAILABLE' }));
          }
        });

        socket.on('DRIVER_STATUS_CHANGE', (data: { id: string; status: string }) => {
          store.dispatch(driverStatusChange(data));
        });
      }
    }

    return next(action);
  };
  ```

- [ ] **Step 7: Create `frontend/src/store/index.ts`**
  Set up Redux RTK store.
  ```typescript
  import { configureStore } from '@reduxjs/toolkit';
  import shipmentsReducer from './shipmentsSlice.js';
  import driversReducer from './driversSlice.js';
  import warehousesReducer from './warehousesSlice.js';
  import { socketMiddleware } from './socketMiddleware.js';

  export const store = configureStore({
    reducer: {
      shipments: shipmentsReducer,
      drivers: driversReducer,
      warehouses: warehousesReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(socketMiddleware)
  });

  export type RootState = ReturnType<typeof store.getState>;
  export type AppDispatch = typeof store.dispatch;
  ```

- [ ] **Step 8: Create `frontend/src/main.tsx`**
  Bootstraps React 19 app wrapped with Redux Provider.
  ```tsx
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import { Provider } from 'react-redux';
  import { store } from './store/index.js';
  import App from './App.js';
  import './index.css';

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
  ```

---

### Task 6: Premium UI styling and layout foundation

**Files:**
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create `frontend/src/index.css`**
  Implement high-contrast dark theme style system with layout, glassmorphism panel styles, and micro-animations.
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-dark: #0b0d10;
    --bg-panel: rgba(20, 24, 33, 0.7);
    --border-color: rgba(255, 255, 255, 0.06);
    --border-highlight: rgba(255, 255, 255, 0.12);
    
    --primary: #3b82f6;      /* Blue glow */
    --accent: #8b5cf6;       /* Violet glow */
    --success: #10b981;      /* Emerald */
    --warning: #f59e0b;      /* Amber */
    --danger: #ef4444;       /* Crimson */
    
    --text-primary: #f3f4f6;
    --text-secondary: #9ca3af;
    --font-family: 'Inter', system-ui, sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--bg-dark);
    color: var(--text-primary);
    font-family: var(--font-family);
    overflow: hidden;
    height: 100vh;
    width: 100vw;
  }

  /* Layout Structure */
  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* Sidebar styling */
  .sidebar {
    width: 260px;
    background: rgba(13, 16, 22, 0.95);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    padding: 24px;
    z-index: 10;
  }

  .logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .logo-icon {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-radius: 6px;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }

  /* Main Dashboard Panel */
  .dashboard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 20px;
    overflow-y: auto;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dashboard-header h1 {
    font-size: 1.75rem;
    font-weight: 600;
  }

  /* Glassmorphism Cards */
  .glass-card {
    background: var(--bg-panel);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .glass-card:hover {
    border-color: var(--border-highlight);
  }

  /* Bento Grid */
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(4, 1-indexed); /* custom layout via grid template */
    grid-gap: 20px;
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Layout grids */
  .layout-grid {
    display: grid;
    grid-template-columns: 3fr 2fr;
    grid-gap: 20px;
    flex: 1;
    min-height: 0;
  }

  .left-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
  }

  /* Interactive Elements */
  .btn {
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  /* Status Badges */
  .badge {
    padding: 4px 8px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge-pending { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
  .badge-enroute { background: rgba(59, 130, 246, 0.15); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.3); }
  .badge-delivered { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
  .badge-delayed { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
  ```

---

### Task 7: Layout Components (Sidebar, Metrics)

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/MetricsGrid.tsx`

- [ ] **Step 1: Create `frontend/src/components/Sidebar.tsx`**
  ```tsx
  import React from 'react';

  export default function Sidebar() {
    return (
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon" />
          <span>LogiTrack</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Dashboard
          </div>
          <div style={{ padding: '8px 12px', color: '#9ca3af', cursor: 'not-allowed' }}>
            Analytics
          </div>
          <div style={{ padding: '8px 12px', color: '#9ca3af', cursor: 'not-allowed' }}>
            Fleet Management
          </div>
        </nav>
      </aside>
    );
  }
  ```

- [ ] **Step 2: Create `frontend/src/components/MetricsGrid.tsx`**
  Renders Redux data or live metric states.
  ```tsx
  import React, { useEffect, useState } from 'react';
  import { useSelector } from 'react-redux';
  import { RootState } from '../store/index.js';

  export default function MetricsGrid() {
    const shipments = useSelector((state: RootState) => state.shipments.items);
    const drivers = useSelector((state: RootState) => state.drivers.items);
    const [metrics, setMetrics] = useState({
      activeCount: 0,
      totalCount: 0,
      deliveredCount: 0,
      utilizationRate: 0,
      onTimeRate: 100
    });

    useEffect(() => {
      // Fetch initial metrics
      fetch('http://localhost:3001/api/metrics')
        .then(res => res.json())
        .then(data => setMetrics(data))
        .catch(err => console.error(err));
    }, [shipments, drivers]);

    return (
      <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="glass-card metric-card">
          <span className="metric-label">Active Shipments</span>
          <span className="metric-value">{metrics.activeCount}</span>
        </div>
        <div className="glass-card metric-card">
          <span className="metric-label">Total Shipments</span>
          <span className="metric-value">{metrics.totalCount}</span>
        </div>
        <div className="glass-card metric-card">
          <span className="metric-label">Driver Utilization</span>
          <span className="metric-value">{metrics.utilizationRate.toFixed(1)}%</span>
        </div>
        <div className="glass-card metric-card">
          <span className="metric-label">On-Time Rate</span>
          <span className="metric-value">{metrics.onTimeRate.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  ```

---

### Task 8: Simulated Map Widget (Visual Centerpiece)

**Files:**
- Create: `frontend/src/components/LiveMap.tsx`

- [ ] **Step 1: Create `frontend/src/components/LiveMap.tsx`**
  Renders coordinates on an SVG canvas, mapping US geography to screen space with responsive scaling, interactive hover nodes, active vehicle markers, and dynamic tooltips.
  ```tsx
  import React, { useState } from 'react';
  import { useSelector, useDispatch } from 'react-redux';
  import { RootState } from '../store/index.js';
  import { selectShipment } from '../store/shipmentsSlice.js';

  export default function LiveMap() {
    const dispatch = useDispatch();
    const warehouses = useSelector((state: RootState) => state.warehouses.items);
    const shipments = useSelector((state: RootState) => state.shipments.items);
    const selectedShipmentId = useSelector((state: RootState) => state.shipments.selectedId);
    
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Map latitude/longitude to SVG coordinate space (Width 800, Height 500)
    // Seattle (47.6, -122.3) -> top-left
    // LA (34, -118.2) -> bottom-left
    // Chicago (41.8, -87.6) -> top-middle
    // New York (40.7, -74) -> top-right
    const mapCoords = (lat: number, lng: number) => {
      // Simple projection for visual map
      const minLng = -125;
      const maxLng = -70;
      const minLat = 25;
      const maxLat = 50;

      const x = ((lng - minLng) / (maxLng - minLng)) * 800;
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * 500;
      return { x, y };
    };

    const activeShipments = shipments.filter(s => s.status === 'EN_ROUTE' || s.status === 'DELAYED');

    return (
      <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '16px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 600 }}>Live Fleet Tracking Map</h3>
        
        <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%', background: '#0e1117', borderRadius: '8px' }}>
          {/* Background grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Dotted paths connecting all warehouses */}
          {warehouses.map((wOrigin, idx) => 
            warehouses.slice(idx + 1).map(wDest => {
              const start = mapCoords(wOrigin.latitude, wOrigin.longitude);
              const end = mapCoords(wDest.latitude, wDest.longitude);
              return (
                <line 
                  key={`${wOrigin.id}-${wDest.id}`}
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              );
            })
          )}

          {/* Selected Shipment path route highlight */}
          {activeShipments.map(s => {
            if (s.id !== selectedShipmentId) return null;
            const start = mapCoords(s.originWarehouse.latitude, s.originWarehouse.longitude);
            const end = mapCoords(s.destinationWarehouse.latitude, s.destinationWarehouse.longitude);
            return (
              <line 
                key={`route-${s.id}`}
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                stroke={s.status === 'DELAYED' ? '#ef4444' : '#3b82f6'}
                strokeWidth="2.5"
                strokeOpacity="0.6"
              />
            );
          })}

          {/* Warehouses (Nodes) */}
          {warehouses.map(w => {
            const { x, y } = mapCoords(w.latitude, w.longitude);
            const isHovered = hoveredNode === w.id;
            return (
              <g 
                key={w.id} 
                onMouseEnter={() => setHoveredNode(w.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={x} cy={y} r={isHovered ? 12 : 8} fill="#8b5cf6" fillOpacity={isHovered ? 0.4 : 0.2} style={{ transition: 'all 0.2s' }} />
                <circle cx={x} cy={y} r="5" fill="#8b5cf6" />
                <text x={x} y={y - 12} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500">
                  {w.name}
                </text>
              </g>
            );
          })}

          {/* Shipments/Trucks moving */}
          {activeShipments.map(s => {
            const { x, y } = mapCoords(s.currentLatitude, s.currentLongitude);
            const isSelected = s.id === selectedShipmentId;
            return (
              <g 
                key={s.id} 
                onClick={() => dispatch(selectShipment(isSelected ? null : s.id))}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse wave ring */}
                <circle 
                  cx={x} cy={y} 
                  r={isSelected ? 16 : 10} 
                  fill="none" 
                  stroke={s.status === 'DELAYED' ? '#ef4444' : '#3b82f6'} 
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                >
                  <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Core Truck Icon Dot */}
                <circle 
                  cx={x} cy={y} 
                  r={isSelected ? 6 : 4.5} 
                  fill={s.status === 'DELAYED' ? '#ef4444' : '#3b82f6'} 
                />
              </g>
            );
          })}
        </svg>

        {/* Selected details tooltip overlay */}
        {selectedShipmentId && (() => {
          const selected = shipments.find(s => s.id === selectedShipmentId);
          if (!selected) return null;
          return (
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '12px', width: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>{selected.trackingNumber}</span>
                <span className={`badge badge-${selected.status.toLowerCase().replace('_', '')}`}>{selected.status}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Driver: {selected.driver?.name || 'Unassigned'}</p>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>From: {selected.originWarehouse.name}</p>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>To: {selected.destinationWarehouse.name}</p>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Progress</span>
                  <span>{selected.progress.toFixed(0)}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${selected.progress}%`, background: '#3b82f6', height: '100%' }} />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }
  ```

---

### Task 9: Shipments List Widget & Control Center

**Files:**
- Create: `frontend/src/components/ShipmentsList.tsx`
- Create: `frontend/src/components/ControlCenter.tsx`

- [ ] **Step 1: Create `frontend/src/components/ShipmentsList.tsx`**
  Renders search-filtered dynamic list of shipments.
  ```tsx
  import React, { useState } from 'react';
  import { useSelector, useDispatch } from 'react-redux';
  import { RootState } from '../store/index.js';
  import { selectShipment } from '../store/shipmentsSlice.js';

  export default function ShipmentsList() {
    const dispatch = useDispatch();
    const shipments = useSelector((state: RootState) => state.shipments.items);
    const selectedId = useSelector((state: RootState) => state.shipments.selectedId);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const filtered = shipments.filter(s => {
      const matchSearch = s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.driver?.name.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchFilter = filterStatus === 'ALL' || s.status === filterStatus;
      return matchSearch && matchFilter;
    });

    return (
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: 0 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Shipments Console</h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search tracking / driver..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
          />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No shipments found</div>
          ) : (
            filtered.map(s => {
              const isSelected = s.id === selectedId;
              return (
                <div 
                  key={s.id} 
                  onClick={() => dispatch(selectShipment(isSelected ? null : s.id))}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)', 
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{s.trackingNumber}</span>
                    <span className={`badge badge-${s.status.toLowerCase().replace('_', '')}`}>{s.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af' }}>
                    <span>Route: {s.originWarehouse.name.split(' ')[0]} ➔ {s.destinationWarehouse.name.split(' ')[0]}</span>
                    <span>Prog: {s.progress.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Create `frontend/src/components/ControlCenter.tsx`**
  Interactive panel allowing users to trigger dispatches, delays, and state resets.
  ```tsx
  import React, { useState } from 'react';
  import { useSelector, useDispatch } from 'react-redux';
  import { RootState, AppDispatch } from '../store/index.js';
  import { addShipment, fetchShipments } from '../store/shipmentsSlice.js';
  import { fetchDrivers } from '../store/driversSlice.js';

  export default function ControlCenter() {
    const dispatch = useDispatch<AppDispatch>();
    const warehouses = useSelector((state: RootState) => state.warehouses.items);
    const selectedShipmentId = useSelector((state: RootState) => state.shipments.selectedId);
    const shipments = useSelector((state: RootState) => state.shipments.items);
    
    const selectedShipment = shipments.find(s => s.id === selectedShipmentId);
    
    const [originId, setOriginId] = useState('');
    const [destId, setDestId] = useState('');
    const [error, setError] = useState('');

    const handleDispatch = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!originId || !destId) {
        setError("Select origin and destination");
        return;
      }
      if (originId === destId) {
        setError("Origin and Destination must differ");
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/api/shipments/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originId, destinationId: destId })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to dispatch");
        } else {
          dispatch(addShipment(data));
          dispatch(fetchDrivers()); // Update status
          setOriginId('');
          setDestId('');
        }
      } catch (err) {
        setError("Connection error");
      }
    };

    const handleSimulateDelay = async () => {
      if (!selectedShipmentId) return;
      try {
        await fetch(`http://localhost:3001/api/shipments/${selectedShipmentId}/delay`, { method: 'POST' });
        dispatch(fetchShipments());
      } catch (err) {
        console.error(err);
      }
    };

    const handleReset = async () => {
      if (!confirm("Reset database state?")) return;
      try {
        await fetch('http://localhost:3001/api/reset', { method: 'POST' });
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Operations Control Center</h3>
        
        <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Dispatch Origin</label>
            <select 
              value={originId} 
              onChange={e => setOriginId(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Dispatch Destination</label>
            <select 
              value={destId} 
              onChange={e => setDestId(e.target.value)}
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white' }}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Dispatch Shipment</button>
        </form>

        <hr style={{ border: 'none', height: '1px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSimulateDelay} 
            disabled={!selectedShipment || selectedShipment.status !== 'EN_ROUTE'}
            className="btn btn-secondary" 
            style={{ flex: 1, opacity: (!selectedShipment || selectedShipment.status !== 'EN_ROUTE') ? 0.5 : 1, cursor: (!selectedShipment || selectedShipment.status !== 'EN_ROUTE') ? 'not-allowed' : 'pointer' }}
          >
            Trigger Delay
          </button>
          <button onClick={handleReset} className="btn btn-secondary" style={{ flex: 1, border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}>
            Reset App
          </button>
        </div>
      </div>
    );
  }
  ```

---

### Task 10: Assembling Main App and Bootstrapping Client

**Files:**
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/App.tsx`**
  Integrate Redux data loads, dispatch WebSocket bootstrap, and tie Layout components together.
  ```tsx
  import React, { useEffect } from 'react';
  import { useDispatch, useSelector } from 'react-redux';
  import { AppDispatch, RootState } from './store/index.js';
  import { fetchShipments } from './store/shipmentsSlice.js';
  import { fetchDrivers } from './store/driversSlice.js';
  import { fetchWarehouses } from './store/warehousesSlice.js';
  
  import Sidebar from './components/Sidebar.js';
  import MetricsGrid from './components/MetricsGrid.js';
  import LiveMap from './components/LiveMap.js';
  import ShipmentsList from './components/ShipmentsList.js';
  import ControlCenter from './components/ControlCenter.js';

  export default function App() {
    const dispatch = useDispatch<AppDispatch>();
    const shipmentsLoading = useSelector((state: RootState) => state.shipments.loading);

    useEffect(() => {
      // Connect to Socket server
      dispatch({ type: 'socket/connect' });
      
      // Load initial lists
      dispatch(fetchShipments());
      dispatch(fetchDrivers());
      dispatch(fetchWarehouses());
    }, [dispatch]);

    return (
      <div className="app-container">
        <Sidebar />
        <main className="dashboard-content">
          <header className="dashboard-header">
            <h1>Logistics Command Dashboard</h1>
          </header>
          
          <MetricsGrid />

          <div className="layout-grid">
            <div className="left-column">
              <LiveMap />
            </div>
            <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
              <ControlCenter />
              <ShipmentsList />
            </div>
          </div>
        </main>
      </div>
    );
  }
  ```

---

## Verification Plan

### Automated Tests
1. Run backend unit & integration tests:
   Command: `cd backend && npm run test`
   Expected output: `4 tests passed`

### Manual Verification
1. Start postgres local instance (or configure alternative endpoint in `.env`).
2. Run database migrations: `cd backend && npx prisma migrate dev && npx prisma db seed`
3. Run backend server: `cd backend && npm run dev`
4. Run frontend client: `cd frontend && npm install && npm run dev`
5. Open browser to `http://localhost:5173`.
6. Dispatch a new shipment in the Control Center; verify a new vehicle indicator appears at the origin warehouse node on the map and begins traveling toward the destination warehouse.
7. Click the active route and trigger a delay; verify the indicator turns red and moves at a slower pace.
8. Verify shipment list details display live progress percentage updates.

### Security Verification
- Verify backend API port binds to `localhost` and server does not bind to wildcard `0.0.0.0` or allow unvalidated origins.
- Verify ORM Prisma query parameters prevent all SQL Injection risks automatically.
- Verify UI does not use `dangerouslySetInnerHTML` or direct raw DOM injection sinks (`innerHTML`).
