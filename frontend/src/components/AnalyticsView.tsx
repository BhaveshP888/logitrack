import { useAppSelector } from '../store/hooks.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AnalyticsView() {
  const shipments = useAppSelector(state => state.shipments.items);
  const drivers = useAppSelector(state => state.drivers.items);

  // Shipments Stats
  const totalShipments = shipments.length;
  const delivered = shipments.filter(s => s.status === 'DELIVERED').length;
  const delayed = shipments.filter(s => s.status === 'DELAYED').length;
  const pending = shipments.filter(s => s.status === 'PENDING').length;
  const enRoute = shipments.filter(s => s.status === 'EN_ROUTE').length;

  const deliveryRate = totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 0;

  const statusData = [
    { name: 'Delivered', value: delivered, color: '#10b981' },
    { name: 'Delayed', value: delayed, color: '#ef4444' },
    { name: 'En Route', value: enRoute, color: '#3b82f6' },
    { name: 'Pending', value: pending, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Drivers Stats
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'ON_DELIVERY').length;

  const fleetUtilization = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;

  // Checkpoints data
  const routeStats: Record<string, { route: string; avgProgress: number; count: number; sumPct: number }> = {};
  
  shipments.forEach(s => {
    if (!s.checkpoints || s.checkpoints.length === 0) return;
    const routeName = `${s.originWarehouse.name.split(' ')[0]} → ${s.destinationWarehouse.name.split(' ')[0]}`;
    const reached = s.checkpoints.filter(c => c.reached).length;
    const pct = (reached / s.checkpoints.length) * 100;
    
    if (!routeStats[routeName]) {
      routeStats[routeName] = { route: routeName, avgProgress: 0, count: 0, sumPct: 0 };
    }
    routeStats[routeName].count++;
    routeStats[routeName].sumPct += pct;
    routeStats[routeName].avgProgress = Math.round(routeStats[routeName].sumPct / routeStats[routeName].count);
  });

  const routeData = Object.values(routeStats);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-sm font-body">
          <p className="font-semibold text-zinc-100 mb-1">{payload[0].name || payload[0].payload.name || payload[0].payload.route}</p>
          <p className="text-zinc-300">
            Value: <span className="font-bold text-white">{payload[0].value}</span>
            {payload[0].dataKey === 'avgProgress' && '%'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex justify-between items-end shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-1">Insights</p>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Analytics Overview</h1>
        </div>
      </header>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Total Shipments</p>
              <p className="text-3xl font-display font-semibold text-white tracking-tight">{totalShipments}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-400/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Delivery Success</p>
              <p className="text-3xl font-display font-semibold text-white tracking-tight">{deliveryRate}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-sky-500/20 hover:bg-white/[0.05]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">Fleet Utilization</p>
              <p className="text-3xl font-display font-semibold text-white tracking-tight">{fleetUtilization}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col">
          <h3 className="font-display font-semibold text-zinc-100 mb-4 tracking-wide text-sm">Shipment Status Distribution</h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Route Progress */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 flex flex-col">
          <h3 className="font-display font-semibold text-zinc-100 mb-4 tracking-wide text-sm">Average Route Completion</h3>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} stroke="rgba(255,255,255,0.06)" />
                <YAxis dataKey="route" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="rgba(255,255,255,0.06)" width={90} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="avgProgress" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

