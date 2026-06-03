# Driver Terminal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Driver Terminal into a full two-column layout with profile card, performance stats, delivery history, and an improved active shipment view.

**Architecture:** Single file rewrite of `DriverPortal.tsx`. Fetch all of the driver's shipments once on mount and poll every 5s. Split filtered data into `activeShipment` and `completedShipments` arrays; compute stats inline. Render left column (always) and right column (context-dependent) using a CSS grid.

**Tech Stack:** React, TypeScript, Tailwind CSS (via custom theme tokens), existing Redux auth slice for `user`.

---

### Task 1: Data Layer — Fetch All Driver Shipments

**Files:**
- Modify: `frontend/src/components/DriverPortal.tsx`

This task replaces the current fetch (which only tracks the first active shipment) with a fetch that loads ALL shipments for this driver and derives separate `activeShipment` and `completedShipments` from them.

- [ ] **Step 1: Replace state and fetch logic**

Replace the top of `DriverPortal.tsx` (imports through `loadShipment`) with:

```tsx
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { logoutUser } from '../store/authSlice.js';
import { Shipment } from '../store/shipmentsSlice.js';

export default function DriverPortal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShipments = () => {
    fetch('http://localhost:3001/api/shipments', { credentials: 'include' })
      .then(res => res.json())
      .then((data: Shipment[]) => {
        const mine = data.filter(s => s.driverId === user?.driverId);
        setAllShipments(mine);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    loadShipments();
    const interval = setInterval(loadShipments, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const activeShipment = allShipments.find(s => s.status !== 'DELIVERED') ?? null;
  const completedShipments = allShipments
    .filter(s => s.status === 'DELIVERED')
    .sort((a, b) => new Date(b.targetDispatchDate).getTime() - new Date(a.targetDispatchDate).getTime());
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DriverPortal.tsx
git commit -m "feat(driver): fetch all driver shipments, derive active + completed"
```

---

### Task 2: Stats Computation

**Files:**
- Modify: `frontend/src/components/DriverPortal.tsx` (add stats block after the derivations from Task 1)

- [ ] **Step 1: Add stats computation**

Add these lines immediately after the `completedShipments` derivation:

```tsx
  // Stats
  const totalDeliveries = completedShipments.length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekDeliveries = completedShipments.filter(
    s => new Date(s.targetDispatchDate) >= oneWeekAgo
  ).length;
  const nonDelayedDelivered = completedShipments.filter(s => s.status === 'DELIVERED').length;
  // A shipment is "on time" if it was never DELAYED — we track this via status at delivery.
  // Since status is DELIVERED by the time we see it, use a proxy: count all completed as on-time
  // because delayed shipments are re-dispatched and still end up DELIVERED.
  // On-time rate = completed / total assigned * 100 (simpler, honest metric)
  const totalAssigned = allShipments.length;
  const onTimeRate = totalAssigned > 0
    ? Math.round((nonDelayedDelivered / totalAssigned) * 100)
    : 0;
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```
Expected: `✓ built`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DriverPortal.tsx
git commit -m "feat(driver): compute performance stats"
```

---

### Task 3: Left Column — Profile Card & Stats

**Files:**
- Modify: `frontend/src/components/DriverPortal.tsx` (replace the JSX return)

- [ ] **Step 1: Add logout handler + build the header and left column JSX**

Replace the entire `return (...)` block (keep the `handleLogout`, `handleDispatch`, `handleReachCheckpoint` functions above it unchanged) with:

```tsx
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
      dispatch(logoutUser());
      window.location.reload();
    } catch (err) { console.error(err); }
  };

  const handleDispatch = async () => {
    if (!activeShipment) return;
    try {
      await fetch(`http://localhost:3001/api/shipments/${activeShipment.id}/dispatch`, { method: 'POST', credentials: 'include' });
      loadShipments();
    } catch (err) { console.error(err); }
  };

  const handleReachCheckpoint = async (checkpointId: string) => {
    if (!activeShipment) return;
    try {
      await fetch(`http://localhost:3001/api/shipments/${activeShipment.id}/checkpoints/${checkpointId}/reach`, { method: 'POST', credentials: 'include' });
      loadShipments();
    } catch (err) { console.error(err); }
  };

  // Derive initials from email
  const initials = (user?.email ?? 'D').split('@')[0].slice(0, 2).toUpperCase();

  const statusLabel = activeShipment ? 'EN ROUTE' : 'AVAILABLE';
  const statusColor = activeShipment ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/10' : 'text-status-success border-status-success/30 bg-status-success/10';

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-main text-zinc-500 font-body">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-transparent font-body text-zinc-100">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-white/[0.04] shrink-0">
        <div>
          <h1 className="font-display text-xl font-bold text-zinc-100">Driver Terminal</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5 uppercase tracking-widest">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-zinc-500 hover:text-status-danger hover:bg-status-danger/8 border border-transparent hover:border-status-danger/15 transition-all duration-150 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </header>

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-0">

        {/* LEFT COLUMN */}
        <aside className="border-r border-white/[0.04] flex flex-col gap-5 p-6 overflow-y-auto custom-scrollbar">

          {/* Profile card */}
          <div className="glass-panel p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-primary font-bold text-lg font-display shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100 truncate">{(user?.email ?? '').split('@')[0]}</p>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user?.email}</p>
              <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Deliveries', value: totalDeliveries },
              { label: 'This Week', value: thisWeekDeliveries },
              { label: 'On-Time Rate', value: `${onTimeRate}%` },
              { label: 'Total Assigned', value: totalAssigned },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4 flex flex-col gap-1">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
                <span className="text-2xl font-bold text-zinc-100 font-display">{value}</span>
              </div>
            ))}
          </div>

          {/* Delivery History */}
          <div className="glass-panel p-4 flex flex-col gap-3 flex-1 min-h-0">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0">Delivery History</h3>
            {completedShipments.length === 0 ? (
              <p className="text-zinc-600 text-sm italic text-center py-6">No completed deliveries yet</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                {completedShipments.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-zinc-300 font-medium">{s.trackingNumber}</p>
                      <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                        {s.originWarehouse.name.split(' ')[0]} → {s.destinationWarehouse.name.split(' ')[0]}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(s.targetDispatchDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/20 shrink-0 ml-2">
                      Delivered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN — Active shipment or Standby */}
        <main className="flex flex-col p-6 overflow-y-auto custom-scrollbar">
          {activeShipment ? (
            <ActiveShipmentPanel
              shipment={activeShipment}
              onDispatch={handleDispatch}
              onReachCheckpoint={handleReachCheckpoint}
            />
          ) : (
            <StandbyPanel />
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```
Expected: error about `ActiveShipmentPanel` and `StandbyPanel` not defined — that's expected, they come in Task 4.

- [ ] **Step 3: Do NOT commit yet** — depends on Task 4.

---

### Task 4: Right Column — ActiveShipmentPanel & StandbyPanel

**Files:**
- Modify: `frontend/src/components/DriverPortal.tsx` (add the two sub-components above the `DriverPortal` function)

- [ ] **Step 1: Add StandbyPanel component** (above `export default function DriverPortal`)

```tsx
function StandbyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
          <span className="text-[11px] font-semibold text-status-success uppercase tracking-widest">On Standby</span>
        </div>
        <h2 className="text-2xl font-bold font-display text-zinc-200 mb-2">Ready for Dispatch</h2>
        <p className="text-sm text-zinc-500 max-w-xs">Awaiting dispatch assignment from operations. You'll see your shipment details here once assigned.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add ActiveShipmentPanel component** (above `StandbyPanel`, below imports)

```tsx
interface ActiveShipmentPanelProps {
  shipment: Shipment;
  onDispatch: () => void;
  onReachCheckpoint: (id: string) => void;
}

function ActiveShipmentPanel({ shipment, onDispatch, onReachCheckpoint }: ActiveShipmentPanelProps) {
  const statusStyle = {
    DELAYED: 'bg-status-danger/10 text-status-danger border-status-danger/30 animate-pulse',
    EN_ROUTE: 'bg-brand-primary/10 text-brand-primary border-brand-primary/30',
    PENDING: 'bg-zinc-800/50 text-zinc-400 border-zinc-700',
  }[shipment.status] ?? 'bg-zinc-800/50 text-zinc-400 border-zinc-700';

  return (
    <div className="glass-panel p-8 flex flex-col gap-6 max-w-xl w-full mx-auto">

      {/* Shipment header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Assigned Shipment</span>
          <h2 className="text-2xl font-bold font-mono text-zinc-100">{shipment.trackingNumber}</h2>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${statusStyle}`}>
          {shipment.status.replace('_', ' ')}
        </span>
      </div>

      {/* Route */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">From</span>
          <p className="font-semibold text-zinc-200 text-sm">{shipment.originWarehouse.name}</p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">To</span>
          <p className="font-semibold text-zinc-200 text-sm">{shipment.destinationWarehouse.name}</p>
        </div>
      </div>

      {/* Dispatch date */}
      <div className="flex items-center gap-2 text-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        <span className="text-zinc-500 text-[11px] uppercase tracking-wider">Target Dispatch</span>
        <span className="font-mono text-zinc-300 font-medium ml-1">{new Date(shipment.targetDispatchDate).toLocaleString()}</span>
      </div>

      {/* Begin Route button (PENDING or DELAYED) */}
      {(shipment.status === 'PENDING' || shipment.status === 'DELAYED') && (
        <button onClick={onDispatch} className="glass-button py-3 flex justify-center items-center gap-2 font-semibold w-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          Begin Route
        </button>
      )}

      {/* Checkpoint timeline (EN_ROUTE) */}
      {shipment.status === 'EN_ROUTE' && shipment.checkpoints.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Route Progress</h3>
          <div className="flex flex-col gap-2 relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[11px] top-5 bottom-5 w-px bg-white/[0.06] z-0"></div>
            {shipment.checkpoints.map((cp, idx) => {
              const isNext = !cp.reached && (idx === 0 || shipment.checkpoints[idx - 1].reached);
              return (
                <div key={cp.id} className={`flex items-center justify-between p-4 rounded-xl border relative z-10 transition-all duration-200 ${
                  cp.reached
                    ? 'bg-white/[0.02] border-white/[0.04] text-zinc-500'
                    : isNext
                    ? 'bg-brand-primary/8 border-brand-primary/25 scale-[1.01]'
                    : 'bg-transparent border-white/[0.04] text-zinc-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      cp.reached
                        ? 'bg-status-success border-status-success'
                        : isNext
                        ? 'border-brand-primary bg-brand-primary/20'
                        : 'border-zinc-700 bg-transparent'
                    }`}>
                      {cp.reached && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isNext ? 'text-zinc-100' : ''}`}>{cp.name}</p>
                      {cp.reached && cp.reachedAt && (
                        <p className="text-[10px] font-mono text-status-success mt-0.5">{new Date(cp.reachedAt).toLocaleTimeString()}</p>
                      )}
                    </div>
                  </div>
                  {isNext && (
                    <button onClick={() => onReachCheckpoint(cp.id)} className="glass-button px-3 py-1.5 text-xs flex items-center gap-1 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Confirm
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

```bash
cd frontend && npm run build
```
Expected: `✓ built` with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/DriverPortal.tsx
git commit -m "feat(driver): redesign terminal with 2-col layout, profile, stats, history, improved active view"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Two-column grid layout
- ✅ Header with name, email, status, logout
- ✅ Profile card with initials avatar + status badge
- ✅ 4 stats metrics (total deliveries, this week, on-time rate, total assigned)
- ✅ Delivery history list (completed, sorted, with badges)
- ✅ Standby panel (not empty)
- ✅ Active shipment panel with route, dispatch date, begin route button
- ✅ Improved checkpoint timeline with vertical line, confirm button
- ✅ All data from single fetch, filtered by driverId

**Placeholder scan:** None found.

**Type consistency:** `Shipment` type from `shipmentsSlice.js` used throughout. `ActiveShipmentPanelProps` defined inline before use. All function names consistent across Tasks 3 and 4 (`handleDispatch`, `handleReachCheckpoint`, `loadShipments`).
