import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks.js';
import ControlCenter from './ControlCenter.js';

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
    fetch('http://localhost:3001/api/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
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
    .slice(0, 5);

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
    <div className="flex flex-col h-full gap-6 overflow-y-auto custom-scrollbar pr-1">
      {/* Header */}
      <header className="flex justify-between items-end shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-1">Command Center</p>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">System Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        {/* Total Shipments */}
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em]">Total Shipments</p>
              <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-semibold text-white tracking-tight">{metrics.totalCount}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{metrics.deliveredCount} delivered</p>
          </div>
        </div>

        {/* Active */}
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-sky-500/20 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em]">In Transit</p>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-semibold text-white tracking-tight">{metrics.activeCount}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{delayed.length > 0 ? `${delayed.length} delayed` : 'all on schedule'}</p>
          </div>
        </div>

        {/* Utilization */}
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em]">Fleet Utilization</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-semibold text-white tracking-tight">{metrics.utilizationRate.toFixed(0)}%</p>
            <p className="text-[10px] text-zinc-500 mt-1">{busyDrivers.length}/{drivers.length} drivers active</p>
          </div>
        </div>

        {/* On-Time */}
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-amber-500/20 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em]">On-Time Rate</p>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-display font-semibold text-white tracking-tight">{metrics.onTimeRate.toFixed(0)}%</p>
            <p className="text-[10px] text-zinc-500 mt-1">{delivered.length} completed</p>
          </div>
        </div>
      </div>

      {/* Main Content: Two columns */}
      <div className="grid grid-cols-[1fr_380px] gap-6 flex-1 min-h-0">

        {/* Left: Dispatch Control */}
        <div className="flex flex-col gap-6 min-h-0">
          <ControlCenter />
        </div>

        {/* Right: Activity + Status */}
        <div className="flex flex-col gap-6 min-h-0">
          {/* Status Breakdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-4">Status Breakdown</p>
            <div className="flex items-center gap-6">
              {/* Mini donut */}
              <div className="relative w-20 h-20 shrink-0">
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
                  <span className="text-sm font-bold text-white">{shipments.length}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-col gap-2 flex-1">
                {segments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }}></span>
                      <span className="text-zinc-400">{seg.label}</span>
                    </div>
                    <span className="text-white font-semibold tabular-nums">{seg.count}</span>
                  </div>
                ))}
                {segments.length === 0 && (
                  <p className="text-zinc-600 text-xs italic">No shipments yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Fleet Quick View */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-4">Fleet Quick View</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-sm text-zinc-300">Available</span>
                </div>
                <span className="text-sm text-white font-semibold tabular-nums">{availableDrivers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span className="text-sm text-zinc-300">On Delivery</span>
                </div>
                <span className="text-sm text-white font-semibold tabular-nums">{busyDrivers.length}</span>
              </div>
              {/* Utilization bar */}
              <div className="mt-2">
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-700"
                    style={{ width: `${drivers.length > 0 ? (busyDrivers.length / drivers.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 flex-1 min-h-0 flex flex-col">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-4">Recent Activity</p>
            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1">
              {recentShipments.length > 0 ? recentShipments.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
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
                <p className="text-zinc-600 text-xs italic text-center py-4">No shipments yet. Create one to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
