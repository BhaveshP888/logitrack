import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks.js';
import { API_BASE } from '../config.js';

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
    fetch(`${API_BASE}/api/metrics`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setMetrics(data);
        }
      })
      .catch(err => console.error(err));
  }, [shipments, drivers]);

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="glass-panel p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-zinc-500"></div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Total Shipments</p>
        <p className="text-3xl font-display font-light text-white tracking-tight">{metrics.totalCount}</p>
      </div>
      
      <div className="glass-panel p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent"></div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Active Shipments</p>
        <p className="text-3xl font-display font-light text-white tracking-tight">{metrics.activeCount}</p>
      </div>

      <div className="glass-panel p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-status-success"></div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Driver Utilization</p>
        <p className="text-3xl font-display font-light text-white tracking-tight">{metrics.utilizationRate.toFixed(1)}%</p>
      </div>

      <div className="glass-panel p-5 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-status-warning"></div>
        <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">On-Time Rate</p>
        <p className="text-3xl font-display font-light text-white tracking-tight">{metrics.onTimeRate.toFixed(1)}%</p>
      </div>
    </div>
  );
}
