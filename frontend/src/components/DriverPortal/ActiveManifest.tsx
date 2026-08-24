import { useState } from 'react';
import { Shipment } from '../../store/shipmentsSlice.js';
import ProofOfDeliveryModal from './ProofOfDeliveryModal.js';
import BillOfLadingModal from '../BillOfLadingModal.js';

interface ActiveManifestProps {
  shipment: Shipment;
  onDispatch: () => void;
  onReachCheckpoint: (id: string) => void;
  onAbsentCheckpoint: (id: string) => void;
  onDeliver: (podData: {
    receivedBy: string;
    signatureData: string;
    photoUrl?: string;
    notes?: string;
    deliveryLat?: number;
    deliveryLng?: number;
  }) => Promise<void>;
}

export default function ActiveManifest({
  shipment,
  onDispatch,
  onReachCheckpoint,
  onAbsentCheckpoint,
  onDeliver,
}: ActiveManifestProps) {
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isBolModalOpen, setIsBolModalOpen] = useState(false);

  const isEnRoute = shipment.status === 'EN_ROUTE' || shipment.status === 'IN_TRANSIT';
  const totalWeight = shipment.items?.reduce((sum, it) => sum + it.weightKg, 0) || 1000;
  const totalPieces = shipment.items?.reduce((sum, it) => sum + it.quantity, 0) || 1;

  // Check if all checkpoints have been reached or bypassed
  const pendingCheckpoints = shipment.checkpoints.filter((cp) => !cp.reached && !cp.isAbsent);
  const canDeliver = isEnRoute && pendingCheckpoints.length === 0;

  return (
    <article className="w-full max-w-4xl mx-auto flex flex-col font-body space-y-6" aria-labelledby="manifest-title">
      
      {/* Top Header Card */}
      <header className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
              <h1 id="manifest-title" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Assigned Line-Haul Trip
              </h1>
            </div>
            <p className="text-3xl font-bold font-mono text-zinc-100">{shipment.trackingNumber}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBolModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer border border-white/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              View Waybill / e-BOL
            </button>

            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
                shipment.status === 'DELAYED'
                  ? 'bg-status-danger/10 border border-status-danger/20 text-status-danger animate-pulse'
                  : isEnRoute
                  ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}
            >
              {shipment.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Route Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="card p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Origin Facility</span>
            <p className="text-sm font-semibold text-zinc-200">{shipment.originWarehouse.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{shipment.originWarehouse.city}, {shipment.originWarehouse.state || 'MH'}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Destination Facility</span>
            <p className="text-sm font-semibold text-zinc-200">{shipment.destinationWarehouse.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{shipment.destinationWarehouse.city}, {shipment.destinationWarehouse.state || 'MH'}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Departure Target</span>
            <p className="text-sm font-semibold text-zinc-200">
              {new Date(shipment.targetDispatchDate).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              {shipment.actualDispatchDate ? `Departed: ${new Date(shipment.actualDispatchDate).toLocaleTimeString()}` : 'Pending departure'}
            </p>
          </div>
        </div>
      </header>

      {/* Equipment & Cargo Manifest Card */}
      <section className="glass-panel p-6 space-y-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transport Equipment & Cargo Manifest</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Equipment */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Allocated Truck</span>
              <p className="font-mono font-bold text-sm text-brand-primary mt-0.5">
                {shipment.vehicle?.licensePlate || 'MH-04-GP-8812'}
              </p>
              <p className="text-xs text-zinc-400">{shipment.vehicle?.modelName || 'Tata Prima 5530.S Line-Haul'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Capacity</span>
              <span className="text-xs font-mono text-zinc-300">
                {shipment.vehicle?.maxWeightKg ? `${shipment.vehicle.maxWeightKg.toLocaleString()} kg` : '28,000 kg'}
              </span>
            </div>
          </div>

          {/* Cargo */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Declared Consignment</span>
              <p className="font-semibold text-sm text-zinc-200 mt-0.5 truncate max-w-[200px]">
                {shipment.items?.[0]?.description || shipment.contentDescription || 'Precision Automotive Assemblies'}
              </p>
              <p className="text-xs text-zinc-400">{totalPieces} Pieces • {totalWeight.toLocaleString()} kg Total</p>
            </div>
            {shipment.items?.some((i) => i.isHazmat) && (
              <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] font-mono">
                HAZMAT
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Action: Dispatch (If not yet en route) */}
      {(shipment.status === 'PENDING' || shipment.status === 'ASSIGNED' || shipment.status === 'DELAYED') && (
        <button
          onClick={onDispatch}
          className="w-full py-4 rounded-xl bg-brand-primary hover:bg-brand-accent text-zinc-950 text-base font-bold shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          aria-label="Begin Route Execution"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Begin Line-Haul Route Execution
        </button>
      )}

      {/* Sequence Matrix (Checkpoints) */}
      {isEnRoute && shipment.checkpoints.length > 0 && (
        <section aria-label="Route Sequence" className="glass-panel p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sequential Route Waypoints</h2>
            <span className="text-xs font-mono text-zinc-400">
              {shipment.checkpoints.filter((c) => c.reached).length} of {shipment.checkpoints.length} verified
            </span>
          </div>

          <ol className="relative border-l border-white/10 ml-4 space-y-6">
            {shipment.checkpoints.map((cp, idx) => {
              const isPast = cp.reached || cp.isAbsent;
              const isNext =
                !isPast &&
                (idx === 0 || shipment.checkpoints[idx - 1].reached || shipment.checkpoints[idx - 1].isAbsent);

              return (
                <li
                  key={cp.id}
                  className={`pl-8 relative transition-opacity ${isPast ? 'opacity-60' : 'opacity-100'}`}
                  aria-current={isNext ? 'step' : undefined}
                >
                  <span
                    className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-8 ring-[#0e0e11] ${
                      cp.reached
                        ? 'bg-status-success text-zinc-950'
                        : cp.isAbsent
                        ? 'bg-status-danger text-zinc-950'
                        : isNext
                        ? 'bg-brand-primary text-zinc-950 shadow-[0_0_12px_rgba(45,212,191,0.5)]'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                    aria-hidden="true"
                  >
                    {cp.reached ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : cp.isAbsent ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div>
                      <p
                        className={`text-sm ${
                          isNext ? 'text-zinc-100 font-bold' : 'text-zinc-300 font-medium'
                        } ${cp.isAbsent ? 'line-through text-status-danger/80' : ''}`}
                      >
                        Stop #{cp.orderIndex}: {cp.name}
                      </p>
                      {cp.reached && cp.reachedAt && (
                        <p className="text-xs text-status-success mt-1 font-mono">
                          ✓ Reached at {new Date(cp.reachedAt).toLocaleTimeString()}
                        </p>
                      )}
                      {cp.isAbsent && <p className="text-xs text-status-danger mt-1">Bypassed milestone</p>}
                      {!isPast && !isNext && <p className="text-xs text-zinc-500 mt-1">Upcoming waypoint</p>}
                    </div>

                    {/* Actions */}
                    {isNext && (
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => onAbsentCheckpoint(cp.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-status-danger/30 text-status-danger hover:bg-status-danger hover:text-zinc-950 transition-all cursor-pointer"
                        >
                          Bypass
                        </button>
                        <button
                          onClick={() => onReachCheckpoint(cp.id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-primary hover:bg-brand-accent text-zinc-950 shadow-sm transition-all cursor-pointer"
                        >
                          Confirm Checkpoint
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Confirm Delivery & Proof of Delivery Trigger */}
      {isEnRoute && (
        <div className="space-y-2">
          {!canDeliver && (
            <p className="text-xs text-amber-400 text-center font-mono">
              Note: Complete or bypass all route checkpoints above before submitting Proof of Delivery.
            </p>
          )}
          <button
            onClick={() => setIsPodModalOpen(true)}
            disabled={!canDeliver}
            className="w-full py-4 rounded-xl bg-status-success disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-base font-bold shadow-lg shadow-status-success/20 hover:bg-[#2fb280] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Confirm Destination Reached"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Confirm Destination Reached & Capture Digital POD
          </button>
        </div>
      )}

      {/* Modals */}
      {isPodModalOpen && (
        <ProofOfDeliveryModal
          shipment={shipment}
          onClose={() => setIsPodModalOpen(false)}
          onSubmit={onDeliver}
        />
      )}

      {isBolModalOpen && (
        <BillOfLadingModal
          shipment={shipment}
          onClose={() => setIsBolModalOpen(false)}
        />
      )}
    </article>
  );
}
