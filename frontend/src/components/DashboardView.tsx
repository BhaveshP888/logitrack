import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks.js';
import ControlCenter from './ControlCenter.js';
import DispatchKanban from './DispatchKanban.js';
import { API_BASE } from '../config.js';

export default function DashboardView() {
  const shipments = useAppSelector((state) => state.shipments.items);
  const drivers = useAppSelector((state) => state.drivers.items);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  const [activeTab, setActiveTab] = useState<'kanban' | 'workbench'>('kanban');
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    totalCount: 0,
    deliveredCount: 0,
    utilizationRate: 0,
    onTimeRate: 100,
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/metrics`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setMetrics(data);
        }
      })
      .catch((err) => console.error(err));
  }, [shipments, drivers]);

  const pending = shipments.filter((s) => s.status === 'PENDING' || s.status === 'BOOKED');
  const inTransit = shipments.filter((s) => s.status === 'EN_ROUTE' || s.status === 'IN_TRANSIT');
  const delayed = shipments.filter((s) => s.status === 'DELAYED');
  const delivered = shipments.filter((s) => s.status === 'DELIVERED');
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE');
  const busyDrivers = drivers.filter((d) => d.status === 'ON_DELIVERY');

  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const statusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'text-emerald-400';
      case 'EN_ROUTE':
        return 'text-sky-400';
      case 'DELAYED':
        return 'text-rose-400';
      default:
        return 'text-amber-400';
    }
  };

  const statusDot = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-400';
      case 'EN_ROUTE':
        return 'bg-sky-400';
      case 'DELAYED':
        return 'bg-rose-400';
      default:
        return 'bg-amber-400';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden pr-1 font-body">
      {/* Header Row & Mode Toggle */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em]">Logistics Dispatch Control</p>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Freight Command Center</h1>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'kanban' ? 'bg-brand-primary text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dispatch Kanban
          </button>
          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'workbench' ? 'bg-brand-primary text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Create & Activity
          </button>
        </div>
      </header>

      {/* Unified Status Bar */}
      <div className="card p-3.5 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-3.5 px-3">
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Total Freight</p>
            <p className="text-xl font-bold font-mono text-white">{shipments.length}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/[0.06]"></div>

        {/* In Transit */}
        <div className="flex items-center gap-3 px-3">
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Line-Haul In Transit</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-sky-400">{inTransit.length}</span>
              <span className="text-[10px] text-zinc-500">{delayed.length > 0 ? `(${delayed.length} delayed)` : 'on-time'}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-8 bg-white/[0.06]"></div>

        {/* Pending */}
        <div className="flex items-center gap-3 px-3">
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Awaiting Dispatch</p>
            <p className="text-xl font-bold font-mono text-amber-400">{pending.length}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/[0.06]"></div>

        {/* Completed */}
        <div className="flex items-center gap-3 px-3">
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Delivered (SLA {metrics.onTimeRate.toFixed(0)}%)</p>
            <p className="text-xl font-bold font-mono text-emerald-400">{delivered.length}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/[0.06]"></div>

        {/* Fleet Utilization */}
        <div className="flex flex-col gap-0.5 px-3">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Fleet Assets</p>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-300">{vehicles.length} Trucks</span>
            <span className="text-zinc-500">•</span>
            <span className="text-emerald-400">{availableDrivers.length} Drivers Free</span>
            <span className="text-zinc-500">•</span>
            <span className="text-sky-400">{busyDrivers.length} Active</span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'kanban' ? (
          <DispatchKanban />
        ) : (
          <div className="grid grid-cols-[3fr_2fr] gap-5 h-full min-h-0">
            {/* Create Consignment / Dispatch Control */}
            <div className="flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
              <ControlCenter />
            </div>

            {/* Activity Feed + Delayed alerts */}
            <div className="flex flex-col gap-4 min-h-0">
              {delayed.length > 0 && (
                <div className="card p-4 border-rose-500/30 bg-rose-500/5 shrink-0">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">
                    ⚠ SLA Departure Delayed ({delayed.length})
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {delayed.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-zinc-300">{s.trackingNumber}</span>
                        <span className="text-rose-400 font-semibold">
                          {s.originWarehouse.code || s.originWarehouse.name} → {s.destinationWarehouse.code || s.destinationWarehouse.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Activity Stream */}
              <div className="card p-5 flex flex-col flex-1 min-h-0">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 shrink-0">
                  Milestone & Dispatch Audit Trail
                </p>
                <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
                  {recentShipments.length > 0 ? (
                    recentShipments.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(s.status)}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-200 font-medium truncate">
                            <span className="font-mono text-[11px] text-zinc-400">{s.trackingNumber}</span>
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {s.originWarehouse.city} → {s.destinationWarehouse.city}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusColor(s.status)}`}>
                            {s.status.replace('_', ' ')}
                          </p>
                          <p className="text-[9px] text-zinc-600">{timeAgo(s.updatedAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-600 text-xs text-center py-4">No shipments yet. Create one to get started.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
