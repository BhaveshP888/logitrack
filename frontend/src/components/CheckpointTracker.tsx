import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { Shipment, fetchShipments } from '../store/shipmentsSlice.js';
import BillOfLadingModal from './BillOfLadingModal.js';
import { API_BASE } from '../config.js';

export default function CheckpointTracker() {
  const dispatch = useAppDispatch();
  const selectedShipmentId = useAppSelector((state) => state.shipments.selectedId);
  const shipments = useAppSelector((state) => state.shipments.items);
  
  const [selectedBol, setSelectedBol] = useState<Shipment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const shipment = shipments.find((s) => s.id === selectedShipmentId) as Shipment | undefined;

  if (!shipment) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0e0e11] border border-white/10 rounded-2xl h-full shadow-inner font-body">
        <div className="text-zinc-500 font-semibold flex flex-col items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          Select a shipment from the manifest list to view live tracking telemetry
        </div>
      </div>
    );
  }

  // Quick Action Handlers
  const handleDispatch = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipment.id}/dispatch`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) dispatch(fetchShipments());
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReachWaypoint = async (cpId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipment.id}/checkpoints/${cpId}/reach`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) dispatch(fetchShipments());
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliver = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipment.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receivedBy: 'Facility Receiving Supervisor',
          signatureData: 'OPERATOR_VERIFIED_SIGNATURE',
          notes: 'Cargo verified and accepted in good order',
        }),
      });
      if (res.ok) dispatch(fetchShipments());
    } finally {
      setIsProcessing(false);
    }
  };

  let activeIndex = 0;
  if (shipment.status === 'EN_ROUTE' || shipment.status === 'DELAYED' || shipment.status === 'DELIVERED') {
    activeIndex = 1;
    for (const cp of shipment.checkpoints || []) {
      if (cp.reached) {
        activeIndex++;
      } else {
        break;
      }
    }
  }

  const isDelayed = shipment.status === 'DELAYED';
  const nextUnreachedCp = shipment.checkpoints?.find((c) => !c.reached && !c.isAbsent);

  interface TrackerNode {
    id?: string;
    name: string;
    isReached: boolean;
    isActive: boolean;
    type: string;
    code?: string;
    reachedAt?: string | null;
  }

  const nodes: TrackerNode[] = [
    { name: shipment.originWarehouse.name, isReached: activeIndex > 0, isActive: activeIndex === 0, type: 'Origin Facility', code: shipment.originWarehouse.code, reachedAt: null },
    ...(shipment.checkpoints || []).map((cp, idx) => ({
      id: cp.id,
      name: cp.name,
      isReached: cp.reached,
      isActive: activeIndex === idx + 1,
      type: `Waypoint #${cp.orderIndex}`,
      reachedAt: cp.reachedAt,
    })),
    {
      name: shipment.destinationWarehouse.name,
      isReached: shipment.status === 'DELIVERED',
      isActive: activeIndex === (shipment.checkpoints?.length || 0) + 1 && shipment.status !== 'DELIVERED',
      type: 'Destination Terminal',
      code: shipment.destinationWarehouse.code,
      reachedAt: shipment.actualDeliveryDate || null,
    },
  ];

  return (
    <div className="flex-1 rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden flex flex-col relative h-full font-body">
      {/* Header Banner */}
      <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-end gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] block mb-1">
            Freight Route Telemetry
          </span>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">{shipment.trackingNumber}</h2>
          <p className="text-xs text-zinc-400 mt-1">
            {shipment.originWarehouse.city} → {shipment.destinationWarehouse.city}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedBol(shipment)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 border border-white/10 transition-colors cursor-pointer"
          >
            Waybill (BOL)
          </button>

          <span
            className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider ${
              shipment.status === 'DELAYED'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                : shipment.status === 'EN_ROUTE'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                : shipment.status === 'DELIVERED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            {shipment.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Operator Action Bar */}
      <div className="px-6 py-3 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between">
        <div className="text-xs text-zinc-400 flex items-center gap-2">
          <span>Equipment:</span>
          <span className="font-mono text-brand-primary font-semibold">{shipment.vehicle?.licensePlate || 'Fleet Truck'}</span>
          <span>• Driver:</span>
          <span className="text-zinc-200 font-semibold">{shipment.driver?.name || 'Assigned Driver'}</span>
        </div>

        <div>
          {/* Dispatch Button if Ready */}
          {(shipment.status === 'PENDING' || shipment.status === 'ASSIGNED') && (
            <button
              disabled={isProcessing}
              onClick={handleDispatch}
              className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {isProcessing ? 'Dispatching...' : 'Dispatch Shipment'}
            </button>
          )}

          {/* Clear Next Waypoint Button if En Route */}
          {(shipment.status === 'EN_ROUTE' || shipment.status === 'DELAYED') && (
            nextUnreachedCp ? (
              <button
                disabled={isProcessing}
                onClick={() => handleReachWaypoint(nextUnreachedCp.id)}
                className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-sky-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Verifying...' : `✓ Clear Waypoint: ${nextUnreachedCp.name}`}
              </button>
            ) : (
              <button
                disabled={isProcessing}
                onClick={handleDeliver}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Completing...' : '✓ Confirm Hub Delivery'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Sequential Route Progression */}
      <div className="flex-1 p-6 flex flex-col items-start justify-start overflow-y-auto custom-scrollbar">
        <div className="flex flex-col relative w-full mt-2 space-y-1">
          {nodes.map((node, idx) => {
            const isLast = idx === nodes.length - 1;

            let dotColor = 'bg-zinc-900 border-zinc-700';
            let textColor = 'text-zinc-500';
            let lineClass = 'bg-zinc-800';

            if (node.isReached) {
              dotColor = 'bg-emerald-500 border-emerald-500 text-zinc-950';
              textColor = 'text-zinc-200';
              lineClass = 'bg-emerald-500/80';
            } else if (node.isActive) {
              if (isDelayed) {
                dotColor = 'bg-rose-500 border-rose-500 animate-pulse text-white';
                textColor = 'text-rose-400 font-semibold';
              } else {
                dotColor = 'bg-sky-500 border-sky-400 text-zinc-950';
                textColor = 'text-sky-300 font-semibold';
              }
            }

            return (
              <div key={idx} className="flex flex-row items-stretch relative">
                <div className="w-10 flex flex-col items-center relative">
                  {/* The Node Dot */}
                  <div
                    className={`w-6 h-6 rounded-full border-[2px] z-10 flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${dotColor}`}
                  >
                    {node.isReached ? '✓' : idx + 1}
                  </div>

                  {/* The Connecting Line */}
                  {!isLast && (
                    <div className={`w-[2px] flex-1 my-1 rounded-full transition-all duration-300 ${lineClass}`}></div>
                  )}
                </div>

                {/* Node Label */}
                <div className="pb-8 pl-3 flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold mb-0.5">
                    {node.type}
                  </div>
                  <div className={`text-sm ${textColor}`}>
                    {node.name}
                  </div>
                  {node.reachedAt && (
                    <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                      Cleared at {new Date(node.reachedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOL Modal */}
      {selectedBol && (
        <BillOfLadingModal shipment={selectedBol} onClose={() => setSelectedBol(null)} />
      )}
    </div>
  );
}
