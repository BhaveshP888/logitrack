# Design Spec: Maharashtra Routing & Layout Fixes

## Goal
Transition the logistics tracker region from generic US coordinates to real-world Maharashtra geography using Leaflet OpenStreetMap, and fix vertical height layout bugs causing the shipments console to collapse.

## Proposed Changes

### 1. Backend Schema & Seed Updates
- Update `backend/prisma/seed.ts` and the `/api/reset` route in `backend/src/routes/api.ts` to use real cities in Maharashtra:
  - **Mumbai Hub (W1):** 19.0760, 72.8777
  - **Pune Hub (W2):** 18.5204, 73.8567
  - **Nagpur Hub (W3):** 21.1458, 79.0882
  - **Nashik Hub (W4):** 19.9975, 73.7898
  - **Aurangabad Hub (W5):** 19.8762, 75.3433 (Adding a 5th hub for additional routing variety)
- Drivers will be updated to start at these warehouses.

### 2. Frontend Map Updates (Leaflet OSM)
- Install `@tailwindcss/vite` configuration remains, and add `leaflet` and `react-leaflet` to `frontend/package.json`.
- Import Leaflet CSS in `frontend/src/main.tsx` (`import 'leaflet/dist/leaflet.css'`).
- Rewrite `frontend/src/components/LiveMap.tsx`:
  - Render `<MapContainer>` centered on Maharashtra (19.75, 75.72, Zoom 7).
  - Use TileLayer: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
  - Apply custom Tailwind-based marker overlays (using `L.divIcon` to retain the custom neon styling from the sleek layout).
  - Render routes in transit as `<Polyline>` components.

### 3. Layout Fixes
- Constrain dashboard height to viewport bounds:
  - Add `h-screen overflow-hidden` to `.app-container`.
  - Set layout columns to stretch to full height:
    - Left column (Map container): `flex-1 h-full flex flex-col`.
    - Right column (Console column): `w-[400px] h-full flex flex-col gap-6 overflow-hidden`.
  - Ensure `ShipmentsList` occupies remaining space dynamically: `flex-1 min-h-0 flex flex-col`, with list items wrapped inside a scrollable `overflow-y-auto` container.
