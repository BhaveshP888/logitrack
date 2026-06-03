# Driver Terminal — Standby & Active Shipment Redesign

**Date:** 2026-06-03  
**Status:** Approved  

---

## Context & Goals

The current Driver Terminal (`DriverPortal.tsx`) shows either an active shipment card or a near-empty "Standby Mode" screen with nothing useful. The goal is to make the driver interface genuinely useful in both states:

1. **Standby state** — no longer an empty wall; show driver profile, performance stats, and delivery history.
2. **Active shipment state** — improve the existing view with a cleaner progress timeline and better information hierarchy.

All data is fetched from the existing `/api/shipments` endpoint (with `credentials: 'include'`) and filtered client-side by `driverId === user.driverId`. No new backend endpoints required.

---

## Layout

**Desktop:** Two-column grid (`320px | 1fr`), full-screen, no sidebar.  
**Mobile:** Single-column stacked.  
**Header:** Full-width top bar — driver name, email, availability status badge, logout button.

```
┌──────────────────────────────────────────────────────┐
│  Driver Terminal          rmjain@email.com  [Logout]  │
├────────────────────┬─────────────────────────────────┤
│                    │                                  │
│   Profile Card     │   Active Shipment View           │
│                    │       OR                         │
│   Stats Row        │   Standby Panel                  │
│   (4 metrics)      │                                  │
│                    │                                  │
│   Delivery         │                                  │
│   History List     │                                  │
│   (scrollable)     │                                  │
│                    │                                  │
└────────────────────┴─────────────────────────────────┘
```

---

## Left Column — Always Visible

### Profile Card
- Generated avatar using driver's initials (first letter of first + last name)
- Driver name (fetched via `user.email` or derived from shipment data)
- Email address
- Availability status badge: AVAILABLE (teal) / EN_ROUTE (blue) / OFFLINE (zinc)

### Stats Row (4 metric cards)
Computed from all driver's shipments:

| Metric | Computation |
|--------|-------------|
| Total Deliveries | `count where status === 'DELIVERED'` |
| This Week | `count where status === 'DELIVERED' && deliveredAt within last 7 days` |
| On-Time Rate | `(non-delayed DELIVERED / total DELIVERED) * 100` — shown as `%` |
| Shipments Total | `count of all shipments assigned (any status)` |

> Note: "distance" is excluded — coordinates exist but route distance calculation requires external API. Replaced with "Total Shipments" as a simpler reliable metric.

### Delivery History List
- Source: all shipments where `driverId === user.driverId && status === 'DELIVERED'`
- Sorted: most recent first (by `updatedAt` or `targetDispatchDate`)
- Each row:
  - Tracking number (monospace)
  - Origin → Destination (truncated warehouse names)
  - Date (formatted locale string)
  - `DELIVERED` status badge (green)
- Scrollable with `max-h` constraint
- Empty state: "No completed deliveries yet" — shown when list is empty

---

## Right Column — Context-Dependent

### State A: Active Shipment Assigned
Shown when a shipment exists with `driverId === user.driverId && status !== 'DELIVERED'`.

**Header section:**
- Tracking number (large, monospace)
- Status badge (PENDING / EN_ROUTE / DELAYED with appropriate colors and animations)
- Origin → Destination (with arrow icon)
- Target dispatch date/time

**Checkpoint Progress Timeline** (when `status === 'EN_ROUTE'`):
- Vertical stepper with connecting line
- Each checkpoint shows:
  - Circle indicator: green (reached), teal+pulse (next target), zinc (upcoming)
  - Checkpoint name
  - Confirmed timestamp (if `reachedAt` exists, shown in monospace)
  - "Confirm Arrival" button only on the next unreached checkpoint
- "Begin Route" button when status is `PENDING` or `DELAYED`

### State B: No Active Shipment (Standby)
Shown when no matching active shipment found.

- Large status icon
- "On Standby" heading  
- Subtext: "Awaiting dispatch assignment from operations"
- Pulsing availability indicator (teal dot)
- No empty wall — the left column (profile + history) still provides content

---

## Component Structure

Single file: `frontend/src/components/DriverPortal.tsx`

Internal logical sections (not separate files — component is focused enough):
- `DriverPortal` — root, data fetching, layout shell
- `DriverProfileCard` — inline sub-component for avatar + name + status
- `DriverStats` — inline sub-component for 4 metric cards
- `DeliveryHistory` — inline sub-component for scrollable history list
- `ActiveShipmentPanel` — inline sub-component for shipment detail + checkpoints
- `StandbyPanel` — inline sub-component for standby state

---

## Data Flow

```
DriverPortal mounts
  → fetch('/api/shipments', { credentials: 'include' })
  → filter by driverId === user.driverId
  → allShipments (all statuses)
  → activeShipment = find(status !== 'DELIVERED') 
  → completedShipments = filter(status === 'DELIVERED')
  → stats computed inline from completedShipments + allShipments
  → poll every 5s to catch admin assignments
```

---

## Styling

Follows the existing teal/graphite sleek theme:
- Glass panels (`glass-panel`) for cards
- `bg-bg-card` for metric tiles
- Teal (`brand-primary`) for active/CTA states
- `zinc-*` scale for text hierarchy
- DM Sans font, JetBrains Mono for tracking numbers and timestamps

---

## Out of Scope

- Map view on driver terminal (no Leaflet on driver side)
- Driver self-assigning shipments
- Push notifications
- Earnings/pay computation
- New backend endpoints
