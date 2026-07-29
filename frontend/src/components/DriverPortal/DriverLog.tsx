import { Shipment } from '../../store/shipmentsSlice.js';

interface DriverLogProps {
  email: string;
  isEnRoute: boolean;
  completedShipments: Shipment[];
  totalAssigned: number;
}

export default function DriverLog({ email, isEnRoute, completedShipments, totalAssigned }: DriverLogProps) {
  const driverId = (email || 'DRV').split('@')[0].toUpperCase();
  const statusLabel = isEnRoute ? 'En Route' : 'Available';
  
  const totalDeliveries = completedShipments.length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekDeliveries = completedShipments.filter(
    s => new Date(s.targetDispatchDate) >= oneWeekAgo
  ).length;
  const completionRate = totalAssigned > 0
    ? Math.round((totalDeliveries / totalAssigned) * 100)
    : 0;

  return (
    <aside 
      className="flex flex-col h-full overflow-hidden"
      aria-label="Driver Telemetry and Log"
    >
      {/* Identity Block - Compact */}
      <section className="px-6 py-4 border-b border-border-color flex justify-between items-center shrink-0" aria-label="Identity">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">{driverId}</h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{statusLabel}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-zinc-300 font-bold text-xs">{driverId.substring(0, 2)}</span>
        </div>
      </section>

      {/* Telemetry / Stats - Compact Horizontal layout */}
      <section className="px-6 py-4 border-b border-border-color shrink-0" aria-label="Telemetry">
        <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">Metrics</h3>
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
          <div className="text-center px-2">
            <span className="text-lg font-bold text-zinc-200 block">{totalDeliveries}</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Total</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-center px-2">
            <span className="text-lg font-bold text-zinc-200 block">{thisWeekDeliveries}</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Cycle</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="text-center px-2">
            <span className="text-lg font-bold text-zinc-200 block">{completionRate}%</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Rating</span>
          </div>
        </div>
      </section>

      {/* Activity Log - Expanded to use remaining space */}
      <section className="flex flex-col flex-1 min-h-0" aria-label="Activity Log">
        <div className="px-6 py-4 shrink-0 flex justify-between items-center">
          <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Delivery History</h3>
          <span className="text-[10px] text-zinc-600 font-medium">{completedShipments.length} Records</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
          {completedShipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-border-color rounded-xl">
              <p className="text-sm text-zinc-500 font-medium">No history found</p>
              <p className="text-xs text-zinc-600 mt-1">Completed assignments will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 m-0 p-0">
              {completedShipments.map(s => (
                <div key={s.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-300 font-bold">{s.trackingNumber}</span>
                    <span className="text-[9px] font-semibold text-zinc-500">{new Date(s.targetDispatchDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="truncate max-w-[80px]">{s.originWarehouse.name.split(' ')[0]}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    <span className="truncate max-w-[80px]">{s.destinationWarehouse.name.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
