# RBAC and Driver Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a secure authentication and Role-Based Access Control (RBAC) system in LogiTrack separating Admins from Drivers, and build a mobile-first Driver Portal featuring en-route shipment tracking and live GPS location simulation.

**Architecture:** Use `jsonwebtoken` and `bcryptjs` on the backend to enforce secure, cookie-based session management. Connect a mobile-friendly frontend view for drivers that streams simulated coordinates back to the server using WebSockets, while locking the Logistics Command Dashboard to authorized Admins.

**Tech Stack:** React, Redux Toolkit, React-Leaflet, Tailwind CSS v4, Express, Prisma, SQLite, jsonwebtoken, bcryptjs.

---

## Proposed Subsystems & Files

### Dependencies to Install
- Backend: `npm install bcryptjs jsonwebtoken`
- Backend DevDependencies: `npm install -D @types/bcryptjs @types/jsonwebtoken`

### File Structure Changes

#### Backend
- Create: `backend/src/routes/auth.ts` (Auth endpoints)
- Create: `backend/src/middleware/auth.ts` (RBAC & Verification middlewares)
- Modify: `backend/prisma/schema.prisma` (Add `User` model, role enum, and links to `Driver`)
- Modify: `backend/prisma/seed.ts` (Seed admin and driver users)
- Modify: `backend/src/routes/api.ts` (Secure en-route, delay, and dispatch endpoints)
- Modify: `backend/src/server.ts` (Integrate auth routes, cookie-parser, and token parser)
- Modify: `backend/src/simulation.ts` (Allow incoming custom coordinates from active driver socket clients)

#### Frontend
- Create: `frontend/src/store/authSlice.ts` (Auth state, login/logout thunks)
- Create: `frontend/src/components/Login.tsx` (Login page UI)
- Create: `frontend/src/components/DriverPortal.tsx` (Driver console and live location simulator)
- Modify: `frontend/src/store/index.ts` (Register authSlice)
- Modify: `frontend/src/App.tsx` (Route switching logic based on user role)

---

### Task 1: Database Auth Schema & Seed
**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/prisma/seed.ts`
- Test: `backend/tests/auth.test.ts` (Create new test file)

- [ ] **Step 1: Write the database model test**
  Create `backend/tests/auth.test.ts`:
  ```typescript
  import { describe, it, expect, beforeAll } from 'vitest';
  import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  describe('Auth Schema & Users', () => {
    it('should seed admin and driver users successfully', async () => {
      const users = await prisma.user.findMany();
      expect(users.length).toBeGreaterThanOrEqual(2);
      
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      expect(admin).toBeDefined();
      expect(admin?.email).toBe('admin@logitrack.com');
      
      const driverUser = await prisma.user.findFirst({ where: { role: 'DRIVER' } });
      expect(driverUser).toBeDefined();
      expect(driverUser?.driverId).not.toBeNull();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `cd backend && npm run test`
  Expected: FAIL with "PrismaClient has no property user"

- [ ] **Step 3: Update schema.prisma and migrate**
  Modify `backend/prisma/schema.prisma`:
  Add at the end:
  ```prisma
  enum Role {
    ADMIN
    DRIVER
  }

  model User {
    id           String   @id @default(uuid())
    email        String   @unique
    passwordHash String
    role         Role
    driverId     String?  @unique
    driver       Driver?  @relation(fields: [driverId], references: [id])
    createdAt    DateTime @default(now())
  }
  ```
  Also modify `model Driver` in `backend/prisma/schema.prisma` to add the relation:
  ```prisma
  user User?
  ```
  Apply migration: `npx prisma migrate dev --name add_users`

- [ ] **Step 4: Update seed.ts to seed users**
  Modify `backend/prisma/seed.ts` to seed users with hashed passwords (using bcryptjs).
  ```typescript
  import { PrismaClient } from '@prisma/client';
  import bcrypt from 'bcryptjs';

  const prisma = new PrismaClient();

  async function main() {
    // Clear old data
    await prisma.user.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.driver.deleteMany({});
    await prisma.warehouse.deleteMany({});

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const driverPasswordHash = await bcrypt.hash('driver123', 10);

    // Create warehouses
    const w1 = await prisma.warehouse.create({ data: { name: 'Mumbai Hub', latitude: 19.0760, longitude: 72.8777 } });
    const w2 = await prisma.warehouse.create({ data: { name: 'Pune Hub', latitude: 18.5204, longitude: 73.8567 } });
    const w3 = await prisma.warehouse.create({ data: { name: 'Nagpur Hub', latitude: 21.1458, longitude: 79.0882 } });
    const w4 = await prisma.warehouse.create({ data: { name: 'Nashik Hub', latitude: 19.9975, longitude: 73.7898 } });
    const w5 = await prisma.warehouse.create({ data: { name: 'Aurangabad Hub', latitude: 19.8762, longitude: 75.3433 } });

    // Create drivers and link to users
    const d1 = await prisma.driver.create({ data: { name: 'Rajesh Kumar', status: 'AVAILABLE', latitude: 19.0760, longitude: 72.8777 } });
    const d2 = await prisma.driver.create({ data: { name: 'Amit Patil', status: 'AVAILABLE', latitude: 18.5204, longitude: 73.8567 } });

    await prisma.user.create({
      data: { email: 'admin@logitrack.com', passwordHash: adminPasswordHash, role: 'ADMIN' }
    });

    await prisma.user.create({
      data: { email: 'driver1@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d1.id }
    });

    await prisma.user.create({
      data: { email: 'driver2@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d2.id }
    });
  }

  main().catch(console.error).finally(() => prisma.$disconnect());
  ```
  Run: `npm run prisma:seed`

- [ ] **Step 5: Run tests and verify they pass**
  Run: `npm run test`
  Expected: PASS

- [ ] **Step 6: Commit**
  Run: `git add backend/prisma/schema.prisma backend/prisma/seed.ts backend/tests/auth.test.ts && git commit -m "feat: add user auth models to database schema and seed"`

---

### Task 2: Backend Auth Endpoints
**Files:**
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/middleware/auth.ts`
- Modify: `backend/src/server.ts`
- Test: `backend/tests/auth.test.ts`

- [ ] **Step 1: Write failing integration tests**
  Modify `backend/tests/auth.test.ts`:
  Add tests for login, session check, and logout:
  ```typescript
  import request from 'supertest';
  import { app } from '../src/server.js'; // Ensure app is exported in server.ts

  describe('Auth HTTP Endpoints', () => {
    it('should login admin and return HTTP cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@logitrack.com', password: 'admin123' });
      
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@logitrack.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm run test`
  Expected: FAIL with 404 (endpoints not found)

- [ ] **Step 3: Implement auth middleware and router**
  Create `backend/src/middleware/auth.ts`:
  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import jwt from 'jsonwebtoken';

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-12345';

  export interface AuthRequest extends Request {
    user?: {
      id: string;
      email: string;
      role: 'ADMIN' | 'DRIVER';
      driverId: string | null;
    };
  }

  export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token." });
    }
  }

  export function requireRole(role: 'ADMIN' | 'DRIVER') {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || req.user.role !== role) {
        return res.status(403).json({ error: `Forbidden. Requires ${role} role.` });
      }
      next();
    };
  }
  ```

  Create `backend/src/routes/auth.ts`:
  ```typescript
  import { Router, Response } from 'express';
  import { PrismaClient } from '@prisma/client';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';
  import { verifyToken, AuthRequest } from '../middleware/auth.js';

  const prisma = new PrismaClient();
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-12345';

  export const authRouter = Router();

  authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const payload = { id: user.id, email: user.email, role: user.role, driverId: user.driverId };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.json({ user: { id: user.id, email: user.email, role: user.role, driverId: user.driverId } });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  authRouter.get('/me', verifyToken, (req: AuthRequest, res: Response) => {
    return res.json({ user: req.user });
  });

  authRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true });
  });
  ```

  Modify `backend/src/server.ts` to register cookie-parser and authRouter:
  Install cookie-parser: `npm install cookie-parser && npm install -D @types/cookie-parser`
  ```typescript
  import cookieParser from 'cookie-parser';
  import { authRouter } from './routes/auth.js';

  // Inside app middleware configuration:
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  ```

- [ ] **Step 4: Run tests and verify they pass**
  Run: `npm run test`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add backend/src/middleware/auth.ts backend/src/routes/auth.ts backend/src/server.ts backend/tests/auth.test.ts && git commit -m "feat: implement auth middleware, router, and integration tests"`

---

### Task 3: Secure API Routes with RBAC Middleware
**Files:**
- Modify: `backend/src/routes/api.ts`
- Test: `backend/tests/api.test.ts`

- [ ] **Step 1: Write failing checks in tests**
  Modify `backend/tests/api.test.ts`:
  Verify en-route operations (e.g. `/shipments/dispatch`) reject unauthenticated users:
  ```typescript
  it('should block unauthenticated dispatches', async () => {
    const res = await request(app)
      .post('/api/shipments/dispatch')
      .send({ originId: 'id', destinationId: 'id' });
    expect(res.status).toBe(401);
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm run test`
  Expected: FAIL (returns 200/400 instead of 401 because it is not protected)

- [ ] **Step 3: Secure the endpoints in api.ts**
  Modify `backend/src/routes/api.ts`:
  Import `verifyToken` and `requireRole` from `../middleware/auth.js`.
  Update routing hooks:
  - `POST /shipments/dispatch` $\rightarrow$ `verifyToken`, `requireRole('ADMIN')`
  - `POST /shipments/:id/delay` $\rightarrow$ `verifyToken` (either roles)
  - `POST /reset` $\rightarrow$ `verifyToken`, `requireRole('ADMIN')`

- [ ] **Step 4: Run tests and verify they pass**
  Run: `npm run test`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run: `git add backend/src/routes/api.ts backend/tests/api.test.ts && git commit -m "feat: secure admin and sensitive endpoints with role validation middleware"`

---

### Task 4: Driver Live Location Websocket Endpoint
**Files:**
- Modify: `backend/src/server.ts`
- Modify: `backend/src/simulation.ts`

- [ ] **Step 1: Accept location updates from drivers**
  Modify `backend/src/server.ts` socket initialization:
  Listen for driver socket connections. When a driver socket connects, verify their identity (role: `DRIVER`) and allow them to emit location ticks manually.
  ```typescript
  io.on('connection', (socket) => {
    // Add handler for live driver location telemetry
    socket.on('DRIVER_TELEMETRY', async (data: { driverId: string; latitude: number; longitude: number; shipmentId?: string }) => {
      // Broadcast update to all clients (admins)
      io.emit('DRIVER_UPDATE', { id: data.driverId, latitude: data.latitude, longitude: data.longitude });

      if (data.shipmentId) {
        // Also update en-route coordinates database record
        await prisma.shipment.update({
          where: { id: data.shipmentId },
          data: { currentLatitude: data.latitude, currentLongitude: data.longitude }
        });
        io.emit('SHIPMENT_UPDATE', { id: data.shipmentId, currentLatitude: data.latitude, currentLongitude: data.longitude });
      }
    });
  });
  ```

- [ ] **Step 2: Verify in integration tests**
  Expected: WebSockets stream `DRIVER_TELEMETRY` events and broadcast updates to listening consoles.

- [ ] **Step 3: Commit**
  Run: `git commit -a -m "feat: add driver telemetry websocket receiver and database synchronizer"`

---

### Task 5: Frontend Auth Redux Slice
**Files:**
- Create: `frontend/src/store/authSlice.ts`
- Modify: `frontend/src/store/index.ts`

- [ ] **Step 1: Implement authSlice**
  Create `frontend/src/store/authSlice.ts`:
  ```typescript
  import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

  export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'DRIVER';
    driverId: string | null;
  }

  interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
  }

  const initialState: AuthState = {
    user: null,
    loading: false,
    error: null
  };

  export const checkSession = createAsyncThunk('auth/checkSession', async () => {
    const res = await fetch('http://localhost:3001/api/auth/me');
    if (!res.ok) throw new Error("No session");
    return (await res.json()) as { user: User };
  });

  const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
      setUser: (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      },
      logoutUser: (state) => {
        state.user = null;
      }
    },
    extraReducers: (builder) => {
      builder
        .addCase(checkSession.pending, (state) => { state.loading = true; })
        .addCase(checkSession.fulfilled, (state, action) => {
          state.user = action.payload.user;
          state.loading = false;
        })
        .addCase(checkSession.rejected, (state) => {
          state.user = null;
          state.loading = false;
        });
    }
  });

  export const { setUser, logoutUser } = authSlice.actions;
  export default authSlice.reducer;
  ```

- [ ] **Step 2: Register in store index**
  Modify `frontend/src/store/index.ts`:
  ```typescript
  import authReducer from './authSlice.js';
  // Inside reducer configuration:
  auth: authReducer
  ```

- [ ] **Step 3: Verify frontend build**
  Run: `cd frontend && npm run build`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run: `git add frontend/src/store/authSlice.ts frontend/src/store/index.ts && git commit -m "feat: add auth Redux state slice for session caching"`

---

### Task 6: Frontend Login Interface
**Files:**
- Create: `frontend/src/components/Login.tsx`

- [ ] **Step 1: Write Login component**
  Create `frontend/src/components/Login.tsx`:
  Use neon aesthetics, dynamic hover transitions, Jakarta Outfit fonts.
  ```tsx
  import React, { useState } from 'react';
  import { useAppDispatch } from '../store/hooks.js';
  import { setUser } from '../store/authSlice.js';

  export default function Login() {
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed");
        } else {
          dispatch(setUser(data.user));
        }
      } catch (err) {
        setError("Network error");
      }
    };

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-main font-body">
        <form onSubmit={handleLogin} className="w-[400px] bg-bg-surface border border-border-color rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-slate-100 tracking-tight mb-1">LogiTrack Command</h1>
            <p className="text-xs text-slate-400">Enter your credentials to enter the logistics hub</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 text-sm outline-none transition focus:border-brand-primary"
              required 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 text-sm outline-none transition focus:border-brand-primary"
              required 
            />
          </div>

          {error && <p className="text-status-danger text-xs font-semibold">{error}</p>}

          <button type="submit" className="py-3 px-4 rounded-lg bg-brand-primary text-white font-semibold text-sm cursor-pointer transition hover:bg-blue-600">
            Secure Entry
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  Run: `git add frontend/src/components/Login.tsx && git commit -m "feat: design modern login user interface"`

---

### Task 7: Implement Driver Portal
**Files:**
- Create: `frontend/src/components/DriverPortal.tsx`

- [ ] **Step 1: Write DriverPortal UI**
  Create `frontend/src/components/DriverPortal.tsx`:
  Includes driver logouts, en-route assigned shipment list, and real-time simulator sending location increments along the route.
  ```tsx
  import React, { useState, useEffect } from 'react';
  import { useAppDispatch, useAppSelector } from '../store/hooks.js';
  import { logoutUser } from '../store/authSlice.js';
  import io from 'socket.io-client';

  let socket: any;

  export default function DriverPortal() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.auth.user);
    const [assignedShipment, setAssignedShipment] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
      if (!socket) {
        socket = io('http://localhost:3001');
      }

      // Fetch en-route shipment assigned to this driver
      fetch('http://localhost:3001/api/shipments')
        .then(res => res.json())
        .then((data: any[]) => {
          const active = data.find(s => s.driverId === user?.driverId && (s.status === 'EN_ROUTE' || s.status === 'DELAYED'));
          if (active) setAssignedShipment(active);
        });

      return () => {
        if (socket) socket.disconnect();
      };
    }, [user]);

    const handleLogout = async () => {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST' });
      dispatch(logoutUser());
      window.location.reload();
    };

    // Simulate location updates periodically
    useEffect(() => {
      if (!isSimulating || !assignedShipment) return;

      let pct = assignedShipment.progress;
      const interval = setInterval(() => {
        pct += 2;
        if (pct >= 100) {
          pct = 100;
          setIsSimulating(false);
          // Complete delivery
          socket.emit('DRIVER_TELEMETRY', {
            driverId: user?.driverId,
            latitude: assignedShipment.destinationWarehouse.latitude,
            longitude: assignedShipment.destinationWarehouse.longitude,
            shipmentId: assignedShipment.id
          });
          clearInterval(interval);
        } else {
          // Linear interpolation for coordinate telemetry
          const origin = assignedShipment.originWarehouse;
          const dest = assignedShipment.destinationWarehouse;
          const currentLat = origin.latitude + (dest.latitude - origin.latitude) * (pct / 100);
          const currentLng = origin.longitude + (dest.longitude - origin.longitude) * (pct / 100);

          socket.emit('DRIVER_TELEMETRY', {
            driverId: user?.driverId,
            latitude: currentLat,
            longitude: currentLng,
            shipmentId: assignedShipment.id
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    }, [isSimulating, assignedShipment, user]);

    return (
      <div className="flex h-screen w-screen bg-bg-main text-slate-100 flex-col font-body p-6">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-xl font-bold">Driver Terminal</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="py-2 px-4 rounded-lg bg-white/5 border border-border-color text-sm transition hover:bg-bg-surface-hover">
            Logout
          </button>
        </header>

        {assignedShipment ? (
          <div className="bg-bg-surface border border-border-color rounded-xl p-6 shadow-md flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Shipment</span>
              <h2 className="text-lg font-bold font-display text-slate-100">{assignedShipment.trackingNumber}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500">From</span>
                <p className="font-semibold">{assignedShipment.originWarehouse.name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">To</span>
                <p className="font-semibold">{assignedShipment.destinationWarehouse.name}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Simulation Status</span>
                <span className="font-semibold text-brand-primary">{isSimulating ? "GPS Tracking Active" : "Standby"}</span>
              </div>
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition cursor-pointer ${
                  isSimulating ? 'bg-status-danger text-white hover:bg-red-600' : 'bg-brand-primary text-white hover:bg-blue-600'
                }`}
              >
                {isSimulating ? "Stop Live Simulation" : "Start Live Simulation"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-bg-surface border border-border-color rounded-xl p-8 text-center text-slate-400">
            No active en-route shipments assigned. Standby for dispatch.
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**
  Run: `git add frontend/src/components/DriverPortal.tsx && git commit -m "feat: implement driver console interface with en-route simulator"`

---

### Task 8: Navigation Route Switcher
**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Check session and render views**
  Modify `frontend/src/App.tsx`:
  ```tsx
  import { useEffect } from 'react';
  import { useAppDispatch, useAppSelector } from './store/hooks.js';
  import { checkSession } from './store/authSlice.js';
  import Login from './components/Login.js';
  import DriverPortal from './components/DriverPortal.js';
  // Keep original imports for sidebar, metrics, etc.

  export default function App() {
    const dispatch = useAppDispatch();
    const { user, loading } = useAppSelector(state => state.auth);

    useEffect(() => {
      dispatch(checkSession());
    }, [dispatch]);

    if (loading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-bg-main text-slate-400">
          Syncing logistics feed...
        </div>
      );
    }

    if (!user) {
      return <Login />;
    }

    if (user.role === 'DRIVER') {
      return <DriverPortal />;
    }

    // Default: ADMIN layout (Original Dashboard)
    return (
      <div className="flex h-screen w-screen bg-bg-main">
        {/* Sidebar, LiveMap, Metrics, etc. */}
      </div>
    );
  }
  ```

- [ ] **Step 2: Verify compilation and tests**
  Run: `npm run build` inside frontend.
  Run: `npm run test` inside backend.
  Expected: Both PASS.

- [ ] **Step 3: Commit**
  Run: `git commit -a -m "feat: complete RBAC navigation route switcher"`

---

## Verification Plan

### Security Verification
1. Verify API validation logic:
   - Call `POST http://localhost:3001/api/shipments/dispatch` without cookie. Expect `401 Unauthorized`.
   - Call with invalid role session. Expect `403 Forbidden`.
2. Confirm session cookie flags:
   - Check response header `Set-Cookie`. Expect `HttpOnly`, `SameSite=Lax`.

### Automated Tests
- Run: `cd backend && npm run test`
- Expected: All tests pass.

### Manual Verification
1. Seed & Migrate database: `cd backend && npm run prisma:migrate && npm run prisma:seed`
2. Start servers (`npm run dev` in both dirs).
3. Open `http://localhost:5173`. Verify redirect to `/login`.
4. Login as driver (`driver1@logitrack.com` / `driver2@logitrack.com`). Verify redirect to Driver Terminal.
5. Login as admin (`admin@logitrack.com`). Verify redirect to Admin Command Dashboard.
6. Dispatch en-route shipment in Admin dashboard.
7. Open another window/incognito as driver, click "Start Live Simulation".
8. Verify vehicle dot moves smoothly across Maharashtra OSM map in Admin window.
