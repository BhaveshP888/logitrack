import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks.js';

export default function MetricsGrid() {
  const shipments = useAppSelector((state) => state.shipments.items);
  const drivers = useAppSelector((state) => state.drivers.items);
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

  const cardBase = "bg-bg-surface border border-border-color rounded-xl p-6 transition-all duration-250 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-bg-surface-hover hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col gap-2 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full";

  return (
    <div className="grid grid-cols-4 gap-6">
      <div className={`${cardBase} before:bg-brand-primary`}>
        <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Active Shipments</span>
        <span className="font-display text-4xl font-bold text-slate-100 tracking-tight leading-none">{metrics.activeCount}</span>
      </div>
      <div className={`${cardBase} before:bg-brand-accent`}>
        <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Total Shipments</span>
        <span className="font-display text-4xl font-bold text-slate-100 tracking-tight leading-none">{metrics.totalCount}</span>
      </div>
      <div className={`${cardBase} before:bg-status-success`}>
        <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Driver Utilization</span>
        <span className="font-display text-4xl font-bold text-slate-100 tracking-tight leading-none">{metrics.utilizationRate.toFixed(1)}%</span>
      </div>
      <div className={`${cardBase} before:bg-status-warning`}>
        <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">On-Time Rate</span>
        <span className="font-display text-4xl font-bold text-slate-100 tracking-tight leading-none">{metrics.onTimeRate.toFixed(1)}%</span>
      </div>
    </div>
  );
}
