import { useState, useEffect } from 'react';
import { API_BASE } from '../config.js';
import { Shipment } from '../store/shipmentsSlice.js';
import BillOfLadingModal from './BillOfLadingModal.js';

interface PublicTrackingViewProps {
  initialTrackingNumber?: string;
  onBack?: () => void;
}

export default function PublicTrackingView({ initialTrackingNumber, onBack }: PublicTrackingViewProps) {
  const [trackingInput, setTrackingInput] = useState(initialTrackingNumber || 'TRK-2026-8801');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBolOpen, setIsBolOpen] = useState(false);

  const fetchTrackingData = async (trkNum: string) => {
    if (!trkNum.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/shipments/public/${encodeURIComponent(trkNum.trim().toUpperCase())}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error(`Consignment '${trkNum}' not found in active tracking registry.`);
        throw new Error('Failed to load tracking data.');
      }
      const data = await res.json();
      setShipment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to find tracking record');
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingNumber) {
      fetchTrackingData(initialTrackingNumber);
    } else {
      fetchTrackingData('TRK-2026-8801');
    }
  }, [initialTrackingNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackingData(trackingInput);
  };

  const reachedCount = shipment?.checkpoints?.filter((c) => c.reached).length || 0;
  const totalCount = shipment?.checkpoints?.length || 0;
  const totalWeight = shipment?.items?.reduce((sum, it) => sum + it.weightKg, 0) || 1000;
  const totalPieces = shipment?.items?.reduce((sum, it) => sum + it.quantity, 0) || 1;

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-200 font-body flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 sm:px-12 py-4 border-b border-white/10 bg-[#0e0e11]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-zinc-950 text-sm">
            LT
          </div>
          <div>
            <span className="font-display font-bold text-base text-white tracking-tight">LOGITRACK</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">Public Cargo Tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer border border-white/10"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Tracking Search Input Card */}
        <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Enter Consignment or Tracking # (e.g. TRK-2026-8801)"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 font-mono text-sm uppercase placeholder:normal-case placeholder:text-zinc-500 focus:outline-none focus:border-brand-primary transition-colors"
              />
              <svg
                className="absolute left-3.5 top-3.5 text-zinc-500"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-brand-primary/20 shrink-0"
            >
              {loading ? 'Tracking...' : 'Track Freight'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Live Shipment Details */}
        {shipment && (
          <div className="space-y-6">
            
            {/* Overview Status Banner */}
            <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Consignment Reference</span>
                  </div>
                  <h2 className="text-3xl font-bold font-mono text-white tracking-tight">{shipment.trackingNumber}</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Booked on {new Date(shipment.createdAt).toLocaleDateString()} • Line-Haul Service
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsBolOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 border border-white/10 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    Electronic Waybill (e-BOL)
                  </button>

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider ${
                      shipment.status === 'DELIVERED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : shipment.status === 'DELAYED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                        : shipment.status === 'EN_ROUTE'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {shipment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Transit Hubs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Departure Facility</span>
                  <p className="font-semibold text-sm text-zinc-100">{shipment.originWarehouse.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{shipment.originWarehouse.address || shipment.originWarehouse.city}</p>
                  <div className="mt-2 text-[11px] font-mono text-zinc-500">
                    Departed: {shipment.actualDispatchDate ? new Date(shipment.actualDispatchDate).toLocaleString() : 'Pending dispatch'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Destination Facility</span>
                  <p className="font-semibold text-sm text-zinc-100">{shipment.destinationWarehouse.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{shipment.destinationWarehouse.address || shipment.destinationWarehouse.city}</p>
                  <div className="mt-2 text-[11px] font-mono text-zinc-500">
                    Est. Arrival: {shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleString() : 'Calculating'}
                  </div>
                </div>
              </div>
            </div>

            {/* Linear Milestone Progress Tracker */}
            {shipment.checkpoints && shipment.checkpoints.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-zinc-100">Live Route Progression</h3>
                    <p className="text-xs text-zinc-400">Sequential waypoint clearance along the freight corridor</p>
                  </div>
                  <span className="font-mono text-xs text-brand-primary font-semibold">
                    {reachedCount} of {totalCount} Milestones Verified
                  </span>
                </div>

                {/* Linear Waypoint Steps */}
                <div className="space-y-4">
                  {shipment.checkpoints.map((cp, idx) => (
                    <div
                      key={cp.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        cp.reached
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : cp.isAbsent
                          ? 'bg-zinc-900 border-zinc-800 opacity-50'
                          : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            cp.reached
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                              : cp.isAbsent
                              ? 'bg-zinc-800 text-zinc-500 line-through'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {cp.reached ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${cp.reached ? 'text-zinc-100' : 'text-zinc-400'}`}>
                            {cp.name}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono">Stop #{cp.orderIndex}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {cp.reached && cp.reachedAt ? (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            Cleared at {new Date(cp.reachedAt).toLocaleTimeString()}
                          </span>
                        ) : cp.isAbsent ? (
                          <span className="text-[11px] text-zinc-500">Bypassed</span>
                        ) : (
                          <span className="text-[11px] text-zinc-600 font-mono">Pending Waypoint</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cargo Manifest & Assigned Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manifest */}
              <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-zinc-100">Cargo Details</h3>
                  <span className="text-xs font-mono text-zinc-400">{totalPieces} Pieces • {totalWeight.toLocaleString()} kg</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <p className="text-xs font-semibold text-zinc-200">{shipment.contentDescription || 'Commercial Freight'}</p>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                    <span>Weight: {totalWeight.toLocaleString()} kg</span>
                    <span>Volume: 12.5 m³</span>
                    {shipment.items?.some((i) => i.isHazmat) && (
                      <span className="text-rose-400 font-bold">HAZMAT</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Carrier & Proof of Delivery */}
              <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/10 space-y-4">
                <h3 className="font-display font-bold text-sm text-zinc-100">Carrier & Delivery Verification</h3>
                
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transport Truck:</span>
                    <span className="font-mono font-semibold text-brand-primary">{shipment.vehicle?.licensePlate || 'Line-Haul Fleet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Driver:</span>
                    <span className="font-semibold text-zinc-200">{shipment.driver?.name || 'Assigned Driver'}</span>
                  </div>
                  {shipment.proofOfDelivery ? (
                    <div className="pt-2 mt-2 border-t border-white/10 text-emerald-400 font-mono">
                      <p className="font-bold">✓ Signed POD by: {shipment.proofOfDelivery.receivedBy}</p>
                      <p className="text-[10px] text-zinc-400">{new Date(shipment.proofOfDelivery.signedAt).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="pt-2 mt-2 border-t border-white/10 text-zinc-500 text-[11px]">
                      Awaiting receiver sign-off at destination facility.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Audit Trail */}
            {shipment.events && shipment.events.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-xl space-y-4">
                <h3 className="font-display font-bold text-sm text-zinc-100">Event Audit Log</h3>
                <div className="space-y-3">
                  {shipment.events.map((evt) => (
                    <div key={evt.id} className="flex items-start gap-3 text-xs">
                      <span className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0"></span>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-200">{evt.description}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {new Date(evt.createdAt).toLocaleString()} {evt.location ? `• ${evt.location}` : ''}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-400 uppercase">
                        {evt.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bill of Lading Modal */}
      {isBolOpen && shipment && (
        <BillOfLadingModal
          shipment={shipment}
          onClose={() => setIsBolOpen(false)}
        />
      )}
    </div>
  );
}
