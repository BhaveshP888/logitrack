import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks.js';
import ControlCenter from './ControlCenter.js';
import { API_BASE } from '../config.js';

export default function DashboardView() {
  const shipments = useAppSelector(state => state.shipments.items);
  const drivers = useAppSelector(state => state.drivers.items);

  const [metrics, setMetrics] = useState({
    activeCount: 0,
    totalCount: 0,
    deliveredCount: 0,
    utilizationRate: 0,
    onTimeRate: 100
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/metrics`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setMetrics(data);
        }
      })
      .catch(err => console.error(err));
  }, [shipments, drivers]);

  const pending = shipments.filter(s => s.status === 'PENDING');
  const enRoute = shipments.filter(s => s.status === 'EN_ROUTE');
  const delayed = shipments.filter(s => s.status === 'DELAYED');
  const delivered = shipments.filter(s => s.status === 'DELIVERED');
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');
  const busyDrivers = drivers.filter(d => d.status === 'ON_DELIVERY');

  // Recent activity from shipments sorted by updatedAt
  const recentShipments = [...shipments]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  const statusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'text-emerald-400';
      case 'EN_ROUTE': return 'text-sky-400';
      case 'DELAYED': return 'text-rose-400';
      default: return 'text-amber-400';
    }
  };

  const statusDot = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-emerald-400';
      case 'EN_ROUTE': return 'bg-sky-400';
      case 'DELAYED': return 'bg-rose-400';
      default: return 'bg-amber-400';
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

  // Donut chart SVG for status breakdown
  const total = shipments.length || 1;
  const segments = [
    { count: delivered.length, color: '#10b981', label: 'Delivered' },
    { count: enRoute.length, color: '#0ea5e9', label: 'En Route' },
    { count: delayed.length, color: '#f43f5e', label: 'Delayed' },
    { count: pending.length, color: '#f59e0b', label: 'Pending' },
  ].filter(s => s.count > 0);

  let cumulativePercent = 0;
  const donutSegments = segments.map(seg => {
    const pct = (seg.count / total) * 100;
    const offset = cumulativePercent;
    cumulativePercent += pct;
    return { ...seg, pct, offset };
  });

  return (
    <div className="flex flex-col h-full gap-5 overflow-y-auto custom-scrollbar pr-1">
      {/* Header Row */}
      <header className="shrink-0">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-1">Command Center</p>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">System Overview</h1>
      </header>

      {/* Unified Status Bar */}
      <div className="card p-3.5 flex items-center shrink-0">
        {/* Shipments (Donut + Legend) */}
        <div className="flex items-center gap-3.5 px-3">
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {donutSegments.length > 0 ? donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="4"
                  strokeDasharray={`${seg.pct * 0.88} ${88 - seg.pct * 0.88}`}
                  strokeDashoffset={`${-seg.offset * 0.88}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )) : (
                <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{shipments.length}</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Shipments</p>
            <div className="flex items-center gap-3">
              {segments.map((seg, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                  <span className="text-zinc-400">{seg.label}</span>
                  <span className="text-white font-semibold tabular-nums">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-px h-8 bg-white/[0.06]"></div>
        {/* In Transit */}
        <div className="flex items-center gap-3 px-3">
          <p className="text-xl font-bold text-white">{metrics.activeCount}</p>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">In Transit</p>
            <p className="text-[10px] text-zinc-500">{delayed.length > 0 ? `${delayed.length} delayed` : 'on schedule'}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/[0.06]"></div>
        {/* On-Time */}
        <div className="flex items-center gap-3 px-3">
          <p className="text-xl font-bold text-white">{metrics.onTimeRate.toFixed(0)}%</p>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">On-Time</p>
            <p className="text-[10px] text-zinc-500">{delivered.length} done</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/[0.06]"></div>
        {/* Fleet */}
        <div className="flex flex-col gap-1 px-3">
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Fleet</p>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-400">{availableDrivers.length} avail</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span className="text-zinc-400">{busyDrivers.length} active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Two columns — Dispatch gets more space */}
      <div className="grid grid-cols-[3fr_2fr] gap-5 flex-1 min-h-0">

        {/* Dispatch Control — primary action area */}
        <div className="flex flex-col min-h-0">
          <ControlCenter />
        </div>

        {/* Activity Feed + conditional alerts */}
        <div className="flex flex-col gap-5 min-h-0">
          {/* Delayed Alerts */}
          {delayed.length > 0 && (
            <div className="card p-4 border-status-danger/20 shrink-0">
              <p className="text-[10px] font-bold text-status-danger uppercase tracking-widest mb-2">⚠ Delayed ({delayed.length})</p>
              <div className="flex flex-col gap-1.5">
                {delayed.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-400">{s.trackingNumber}</span>
                    <span className="text-status-danger font-semibold">{s.originWarehouse.name.split(' ')[0]} → {s.destinationWarehouse.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="card p-5 flex flex-col flex-1 min-h-0">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 shrink-0">Activity Feed</p>
            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
              {recentShipments.length > 0 ? recentShipments.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(s.status)}`}></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-200 font-medium truncate">
                      <span className="font-mono text-[11px] text-zinc-400">{s.trackingNumber}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {s.originWarehouse.name.split(' ')[0]} → {s.destinationWarehouse.name.split(' ')[0]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${statusColor(s.status)}`}>{s.status.replace('_', ' ')}</p>
                    <p className="text-[9px] text-zinc-600">{timeAgo(s.updatedAt)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-zinc-600 text-xs text-center py-4">No shipments yet. Create one to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
