import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { Shipment, fetchShipments } from '../store/shipmentsSlice.js';
import BillOfLadingModal from './BillOfLadingModal.js';
import AllocateModal from './AllocateModal.js';
import { API_BASE } from '../config.js';

export default function DispatchKanban() {
  const dispatch = useAppDispatch();
  const shipments = useAppSelector((state) => state.shipments.items);
  const [selectedBolShipment, setSelectedBolShipment] = useState<Shipment | null>(null);
  const [selectedAllocateShipment, setSelectedAllocateShipment] = useState<Shipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleQuickDispatch = async (shipmentId: string) => {
    setLoadingAction(shipmentId);
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/dispatch`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        dispatch(fetchShipments());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleQuickAdvanceWaypoint = async (shipmentId: string, cpId: string) => {
    setLoadingAction(`${shipmentId}-${cpId}`);
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/checkpoints/${cpId}/reach`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        dispatch(fetchShipments());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleQuickDeliver = async (shipmentId: string) => {
    setLoadingAction(shipmentId);
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receivedBy: 'Warehouse Terminal Manager',
          signatureData: 'OPERATOR_VERIFIED_SIGNATURE',
          notes: 'Delivered and verified at destination hub',
        }),
      });
      if (res.ok) {
        dispatch(fetchShipments());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.originWarehouse.name.toLowerCase().includes(q) ||
      s.destinationWarehouse.name.toLowerCase().includes(q) ||
      (s.originWarehouse.code && s.originWarehouse.code.toLowerCase().includes(q)) ||
      (s.destinationWarehouse.code && s.destinationWarehouse.code.toLowerCase().includes(q))
    );
  });

  // 4 Kanban Columns
  const unassigned = filteredShipments.filter((s) => s.status === 'PENDING' && !s.driverId);
  const allocated = filteredShipments.filter((s) => (s.status === 'PENDING' || s.status === 'ASSIGNED') && s.driverId);
  const inTransit = filteredShipments.filter((s) => s.status === 'EN_ROUTE' || s.status === 'IN_TRANSIT' || s.status === 'DELAYED');
  const delivered = filteredShipments.filter((s) => s.status === 'DELIVERED');

  const renderCard = (shipment: Shipment) => {
    const totalWeight = shipment.items?.reduce((sum, it) => sum + it.weightKg, 0) || 1000;
    const reachedCount = shipment.checkpoints?.filter((c) => c.reached).length || 0;
    const totalCheckpoints = shipment.checkpoints?.length || 0;
    const nextUnreachedCp = shipment.checkpoints?.find((c) => !c.reached && !c.isAbsent);

    return (
      <div
        key={shipment.id}
        className="p-4 rounded-xl bg-[#141419] border border-white/10 hover:border-white/20 transition-all shadow-md flex flex-col gap-3 group"
      >
        {/* Top Tracking & Badge */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-brand-primary">{shipment.trackingNumber}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              shipment.status === 'DELIVERED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : shipment.status === 'DELAYED'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                : shipment.status === 'EN_ROUTE'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : shipment.driverId
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {shipment.status === 'PENDING' && !shipment.driverId ? 'UNASSIGNED' : shipment.status.replace('_', ' ')}
          </span>
        </div>

        {/* Route Hubs */}
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
          <div className="flex flex-col">
            <span className="font-mono text-[11px] text-zinc-400">{shipment.originWarehouse.code || 'BOM-01'}</span>
            <span className="truncate max-w-[100px] text-[11px] text-zinc-300">{shipment.originWarehouse.city}</span>
          </div>

          <div className="flex-1 mx-3 flex items-center justify-center">
            <div className="w-full h-px bg-white/10 relative flex items-center justify-center">
              <span className="text-[10px] text-zinc-500 bg-[#141419] px-1">→</span>
            </div>
          </div>

          <div className="flex flex-col text-right">
            <span className="font-mono text-[11px] text-zinc-400">{shipment.destinationWarehouse.code || 'NAG-01'}</span>
            <span className="truncate max-w-[100px] text-[11px] text-zinc-300">{shipment.destinationWarehouse.city}</span>
          </div>
        </div>

        {/* Cargo Summary */}
        <div className="text-[11px] text-zinc-400 bg-white/[0.02] p-2 rounded-lg border border-white/5 flex justify-between items-center">
          <span className="truncate max-w-[140px] text-zinc-300">
            {shipment.items?.[0]?.description || shipment.contentDescription || 'General Freight'}
          </span>
          <span className="font-mono text-zinc-400 font-semibold">{totalWeight.toLocaleString()} kg</span>
        </div>

        {/* Equipment & Driver Allocation */}
        <div className="text-[11px] text-zinc-400 flex items-center justify-between">
          <span>
            {shipment.driver ? (
              <span className="text-zinc-200 font-medium">{shipment.driver.name}</span>
            ) : (
              <span className="text-amber-400/80 font-medium">No Driver</span>
            )}
          </span>
          <span className="font-mono text-[10px] text-zinc-500">
            {shipment.vehicle?.licensePlate || 'Pending Truck'}
          </span>
        </div>

        {/* Milestone Progress Bar */}
        {totalCheckpoints > 0 && (shipment.status === 'EN_ROUTE' || shipment.status === 'DELAYED') && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>Waypoints</span>
              <span className="font-mono text-zinc-400">
                {reachedCount} / {totalCheckpoints} passed
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${(reachedCount / totalCheckpoints) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Delivered POD details */}
        {shipment.proofOfDelivery && (
          <div className="text-[10px] text-emerald-400 bg-emerald-500/10 p-1.5 rounded font-mono truncate">
            ✓ POD: {shipment.proofOfDelivery.receivedBy}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => setSelectedBolShipment(shipment)}
            className="flex-1 py-1.5 px-2 text-[11px] font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Waybill
          </button>

          {/* Unassigned -> Allocate */}
          {!shipment.driverId && shipment.status === 'PENDING' && (
            <button
              onClick={() => setSelectedAllocateShipment(shipment)}
              className="py-1.5 px-3 text-[11px] font-bold text-zinc-950 bg-brand-primary hover:bg-brand-accent rounded-lg transition-colors cursor-pointer"
            >
              Allocate
            </button>
          )}

          {/* Allocated / Ready -> Dispatch */}
          {shipment.driverId && (shipment.status === 'PENDING' || shipment.status === 'ASSIGNED') && (
            <button
              disabled={loadingAction === shipment.id}
              onClick={() => handleQuickDispatch(shipment.id)}
              className="py-1.5 px-3 text-[11px] font-bold text-zinc-950 bg-indigo-400 hover:bg-indigo-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingAction === shipment.id ? 'Starting...' : 'Dispatch'}
            </button>
          )}

          {/* In-Transit -> Advance Waypoint or Deliver */}
          {(shipment.status === 'EN_ROUTE' || shipment.status === 'DELAYED') && (
            nextUnreachedCp ? (
              <button
                disabled={loadingAction === `${shipment.id}-${nextUnreachedCp.id}`}
                onClick={() => handleQuickAdvanceWaypoint(shipment.id, nextUnreachedCp.id)}
                className="py-1.5 px-2 text-[10px] font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer truncate max-w-[110px]"
                title={`Advance: ${nextUnreachedCp.name}`}
              >
                ✓ Clear {nextUnreachedCp.name.split(' ')[0]}
              </button>
            ) : (
              <button
                disabled={loadingAction === shipment.id}
                onClick={() => handleQuickDeliver(shipment.id)}
                className="py-1.5 px-3 text-[11px] font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
              >
                Deliver
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 font-body">
      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search consignments, hubs, tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-white/10 text-zinc-200 text-xs placeholder:text-zinc-500 focus:outline-none focus:border-brand-primary transition-colors"
          />
          <svg
            className="absolute left-3 top-2.5 text-zinc-500"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>Active Pipeline: {filteredShipments.length}</span>
        </div>
      </div>

      {/* Kanban Board 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-x-auto pb-2">
        {/* Column 1: Unassigned Bookings */}
        <div className="flex flex-col rounded-2xl bg-[#0e0e11] border border-amber-500/20 overflow-hidden flex-1 min-w-[280px]">
          <div className="px-4 py-3 border-b border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-amber-400">Unassigned</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-xs font-bold">
              {unassigned.length}
            </span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {unassigned.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-600">No unassigned bookings</div>
            ) : (
              unassigned.map(renderCard)
            )}
          </div>
        </div>

        {/* Column 2: Allocated / Ready */}
        <div className="flex flex-col rounded-2xl bg-[#0e0e11] border border-indigo-500/20 overflow-hidden flex-1 min-w-[280px]">
          <div className="px-4 py-3 border-b border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-indigo-400">Allocated / Ready</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold">
              {allocated.length}
            </span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {allocated.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-600">No ready dispatches</div>
            ) : (
              allocated.map(renderCard)
            )}
          </div>
        </div>

        {/* Column 3: In Transit */}
        <div className="flex flex-col rounded-2xl bg-[#0e0e11] border border-sky-500/20 overflow-hidden flex-1 min-w-[280px]">
          <div className="px-4 py-3 border-b border-sky-500/20 bg-sky-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-sky-400">In Transit</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono text-xs font-bold">
              {inTransit.length}
            </span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {inTransit.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-600">No active line-hauls</div>
            ) : (
              inTransit.map(renderCard)
            )}
          </div>
        </div>

        {/* Column 4: Delivered */}
        <div className="flex flex-col rounded-2xl bg-[#0e0e11] border border-emerald-500/20 overflow-hidden flex-1 min-w-[280px]">
          <div className="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-emerald-400">Delivered</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold">
              {delivered.length}
            </span>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {delivered.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-600">No completed runs</div>
            ) : (
              delivered.map(renderCard)
            )}
          </div>
        </div>
      </div>

      {/* Bill of Lading Modal */}
      {selectedBolShipment && (
        <BillOfLadingModal
          shipment={selectedBolShipment}
          onClose={() => setSelectedBolShipment(null)}
        />
      )}

      {/* Truck & Driver Allocation Modal */}
      {selectedAllocateShipment && (
        <AllocateModal
          shipment={selectedAllocateShipment}
          onClose={() => {
            setSelectedAllocateShipment(null);
            dispatch(fetchShipments());
          }}
        />
      )}
    </div>
  );
}
