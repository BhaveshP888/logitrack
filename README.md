<div align="center">
  <img src="https://raw.githubusercontent.com/BhaveshP888/logitrack/main/frontend/public/vite.svg" alt="LogiTrack Logo" width="80" />

  # LogiTrack
  **Logistics Command Center & Global Fleet Management**

  [![React](https://img.shields.io/badge/React-19.0-blue.svg?style=flat&logo=react)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg?style=flat&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791.svg?style=flat&logo=postgresql)](https://neon.tech/)

  [View Live Demo](https://logitrack-beta.vercel.app/) • [Report Bug](https://github.com/BhaveshP888/logitrack/issues)
</div>

<br />

## 📋 Overview

LogiTrack is a modern, real-time logistics and supply chain orchestration platform. It enables administrators to manage complex global infrastructures, monitor real-time telemetrics, and optimize routing across fleets with military-grade precision. The platform also provides a dedicated driver portal for route execution and checkpoint tracking.

## ✨ Features

- **Real-Time Telemetry & Tracking**: Live shipment monitoring using Socket.io WebSockets.
- **Role-Based Access Control**: Secure JWT-based authentication for `ADMIN` and `DRIVER` roles.
- **Admin Command Center**: Unified dashboard to manage warehouses, track fleet utilization, and dispatch shipments.
- **Driver Portal**: Dedicated interface for drivers to accept deliveries and update checkpoint statuses in real time.
- **Interactive Analytics**: Live metrics grid detailing active deliveries, on-time rates, and total fleet utilization.
- **Premium UI/UX**: Distinctive "Warm Graphite" dark-mode aesthetic with hardware-accelerated animations and glassmorphism.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit (RTK)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Variables
- **Real-time**: Socket.io-client

### Backend (Server)
- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL (hosted on Neon/Supabase)
- **ORM**: Prisma (with `@prisma/adapter-pg`)
- **Real-time**: Socket.io
- **Auth**: JWT (JSON Web Tokens) & bcryptjs
- **Testing**: Vitest + Supertest

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database (Local or Cloud like Neon/Supabase)

### 1. Clone the repository
```bash
git clone https://github.com/BhaveshP888/logitrack.git
cd logitrack
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `/backend` directory:
```env
DATABASE_URL="postgresql://user:password@host:5432/logitrack?schema=public"
PORT=3001
ADMIN_EMAIL="admin@email.com"
ADMIN_PASS="adminlogin1212"
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

Initialize the database:
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to build the schema
npx prisma migrate dev

# Seed the database with initial warehouses, admin, and mock data
npm run prisma:seed
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `/frontend` directory:
```env
# Only required if bypassing the Vercel proxy rewrite in local dev
VITE_API_BASE_URL="http://localhost:3001"
VITE_WS_URL="http://localhost:3001"
```

Start the frontend development server:
```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

---

## 🌩️ Cloud Deployment

LogiTrack is architected for seamless cloud deployment with independent scaling for the client and server.

1. **Database**: Provision a Postgres database on [Neon.tech](https://neon.tech/) or Supabase.
2. **Backend (Render)**: Deploy the `/backend` folder as a Node Web Service.
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npx prisma db seed && npm start`
3. **Frontend (Vercel)**: Deploy the `/frontend` folder as a Vite project.
   - Requires setting the `VITE_WS_URL` environment variable to your deployed Render backend URL.
   - API REST calls are automatically proxied via `vercel.json` rewrites to prevent third-party cookie restrictions on mobile devices.

---

## 🧪 Testing

The backend includes a comprehensive Vitest test suite for endpoints and authentication flows. It automatically connects to an isolated local Postgres database in CI pipelines.

```bash
cd backend
npm run test
```

---

## 📄 License

This project is licensed under the MIT License.
