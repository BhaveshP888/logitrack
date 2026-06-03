import { useAppSelector } from '../store/hooks.js';

export default function FleetView() {
  const drivers = useAppSelector(state => state.drivers.items);
  const warehouses = useAppSelector(state => state.warehouses.items);
  const shipments = useAppSelector(state => state.shipments.items);

  const totalDrivers = drivers.length;
  const available = drivers.filter(d => d.status === 'AVAILABLE').length;
  const enRoute = drivers.filter(d => d.status === 'ON_DELIVERY').length;

  const getWarehouseName = (id: string | null) => {
    if (!id) return 'Unassigned';
    return warehouses.find(w => w.id === id)?.name || 'Unknown';
  };

  const getActiveShipment = (driverId: string) => {
    const active = shipments.find(s => s.driverId === driverId && (s.status === 'EN_ROUTE' || s.status === 'DELAYED'));
    return active?.trackingNumber || '-';
  };

  const badgeClass = (status: string) => {
    const base = "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:inline-block";
    if (status === 'ON_DELIVERY') {
      return `${base} bg-brand-primary/8 text-brand-primary border border-brand-primary/15 before:bg-brand-primary`;
    }
    if (status === 'AVAILABLE') {
      return `${base} bg-status-success/8 text-status-success border border-status-success/15 before:bg-status-success`;
    }
    return `${base} bg-zinc-500/8 text-zinc-400 border border-zinc-500/15 before:bg-zinc-400`;
  };

  return (
    <>
      <header className="flex justify-between items-center mb-2">
        <h1 className="font-display text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">Fleet Management</h1>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-2">
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-zinc-500"></div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-zinc-500/10 rounded-full blur-2xl group-hover:bg-zinc-500/20 transition-all"></div>
          <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-1 relative z-10">Total Fleet</p>
          <p className="text-3xl font-display font-light text-zinc-100 relative z-10">{totalDrivers}</p>
        </div>
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-status-success shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-status-success/10 rounded-full blur-2xl group-hover:bg-status-success/20 transition-all"></div>
          <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-1 relative z-10">Available Drivers</p>
          <p className="text-3xl font-display font-light text-zinc-100 relative z-10">{available}</p>
        </div>
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all"></div>
          <p className="text-zinc-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-1 relative z-10">On Route</p>
          <p className="text-3xl font-display font-light text-zinc-100 relative z-10">{enRoute}</p>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="glass-panel overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="font-display font-semibold text-zinc-100 tracking-wide">Driver Roster</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-300 font-body border-collapse">
            <thead className="bg-zinc-900/50 backdrop-blur-md text-[10px] uppercase font-bold tracking-[0.1em] text-zinc-400 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 border-b border-white/5">Driver Name</th>
                <th className="px-6 py-4 border-b border-white/5">Status</th>
                <th className="px-6 py-4 border-b border-white/5">Base Location</th>
                <th className="px-6 py-4 border-b border-white/5">Active Shipment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    No drivers found in the fleet.
                  </td>
                </tr>
              ) : (
                drivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-white/5 transition-colors duration-150 group">
                    <td className="px-6 py-4 font-medium text-zinc-100 group-hover:text-white transition-colors">{driver.name}</td>
                    <td className="px-6 py-4">
                      <span className={badgeClass(driver.status)}>{driver.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{getWarehouseName((driver as any).warehouseId)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{getActiveShipment(driver.id)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
