import { useState } from 'react';
import { Shipment } from '../../store/shipmentsSlice.js';
import BillOfLadingModal from '../BillOfLadingModal.js';

interface DriverLogProps {
  email: string;
  isEnRoute: boolean;
  completedShipments: Shipment[];
  totalAssigned: number;
}

export default function DriverLog({ email, isEnRoute, completedShipments, totalAssigned }: DriverLogProps) {
  const [selectedShipmentForBol, setSelectedShipmentForBol] = useState<Shipment | null>(null);

  const driverId = (email || 'DRV').split('@')[0].toUpperCase();
  const statusLabel = isEnRoute ? 'Line-Haul In Transit' : 'Available on Standby';

  const totalDeliveries = completedShipments.length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekDeliveries = completedShipments.filter(
    (s) => new Date(s.targetDispatchDate) >= oneWeekAgo
  ).length;
  const completionRate = totalAssigned > 0 ? Math.round((totalDeliveries / totalAssigned) * 100) : 100;

  return (
    <aside className="flex flex-col h-full overflow-hidden font-body" aria-label="Driver Telemetry and Log">
      {/* Identity Block */}
      <section className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">{driverId}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isEnRoute ? 'bg-brand-primary animate-pulse' : 'bg-status-success'}`}></span>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{statusLabel}</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
          <span className="text-brand-primary font-bold text-xs">{driverId.substring(0, 2)}</span>
        </div>
      </section>

      {/* Driver KPI Metrics */}
      <section className="px-6 py-4 border-b border-white/10 shrink-0">
        <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Operator Metrics</h3>
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
          <div className="text-center px-2">
            <span className="text-lg font-bold font-mono text-zinc-200 block">{totalDeliveries}</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Delivered</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-center px-2">
            <span className="text-lg font-bold font-mono text-zinc-200 block">{thisWeekDeliveries}</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">7-Day</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-center px-2">
            <span className="text-lg font-bold font-mono text-emerald-400 block">{completionRate}%</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">SLA Score</span>
          </div>
        </div>
      </section>

      {/* Activity Log / Completed Trips */}
      <section className="flex flex-col flex-1 min-h-0">
        <div className="px-6 py-3.5 shrink-0 flex justify-between items-center border-b border-white/5">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Verified Trip History</h3>
          <span className="text-[10px] font-mono text-zinc-500">{completedShipments.length} Runs</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
          {completedShipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-white/10 rounded-xl">
              <p className="text-xs text-zinc-500 font-medium">No past trip logs</p>
              <p className="text-[11px] text-zinc-600 mt-1">Delivered manifests and signed PODs will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {completedShipments.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-brand-primary">{s.trackingNumber}</span>
                    <button
                      onClick={() => setSelectedShipmentForBol(s)}
                      className="text-[10px] font-semibold text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Waybill / POD
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                    <span className="font-mono text-zinc-400">{s.originWarehouse.code || s.originWarehouse.city}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="font-mono text-zinc-400">{s.destinationWarehouse.code || s.destinationWarehouse.city}</span>
                  </div>

                  {s.proofOfDelivery && (
                    <div className="text-[10px] text-emerald-400/90 font-mono bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 truncate">
                      ✓ POD: {s.proofOfDelivery.receivedBy}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* View Waybill Modal */}
      {selectedShipmentForBol && (
        <BillOfLadingModal
          shipment={selectedShipmentForBol}
          onClose={() => setSelectedShipmentForBol(null)}
        />
      )}
    </aside>
  );
}
