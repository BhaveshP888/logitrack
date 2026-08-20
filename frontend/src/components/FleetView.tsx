import { useState } from 'react';
import { useAppSelector } from '../store/hooks.js';

export default function FleetView() {
  const drivers = useAppSelector((state) => state.drivers.items);
  const warehouses = useAppSelector((state) => state.warehouses.items);
  const shipments = useAppSelector((state) => state.shipments.items);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');

  // Drivers stats
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE').length;
  const enRouteDrivers = drivers.filter((d) => d.status === 'ON_DELIVERY').length;

  // Vehicles stats
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) =>
    shipments.some((s) => s.vehicleId === v.id && (s.status === 'EN_ROUTE' || s.status === 'IN_TRANSIT'))
  ).length;
  const availableVehicles = totalVehicles - activeVehicles;

  const getWarehouseName = (id: string | null | undefined) => {
    if (!id) return 'Unassigned';
    return warehouses.find((w) => w.id === id)?.name || 'Central Hub';
  };

  const getActiveShipmentForDriver = (driverId: string) => {
    const active = shipments.find(
      (s) => s.driverId === driverId && (s.status === 'EN_ROUTE' || s.status === 'IN_TRANSIT' || s.status === 'DELAYED')
    );
    return active?.trackingNumber || '-';
  };

  const getActiveShipmentForVehicle = (vehicleId: string) => {
    const active = shipments.find(
      (s) => s.vehicleId === vehicleId && (s.status === 'EN_ROUTE' || s.status === 'IN_TRANSIT' || s.status === 'DELAYED')
    );
    return active?.trackingNumber || '-';
  };

  const driverBadgeClass = (status: string) => {
    const base = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:inline-block";
    if (status === 'ON_DELIVERY') {
      return `${base} bg-sky-500/10 text-sky-400 border border-sky-500/20 before:bg-sky-400`;
    }
    if (status === 'AVAILABLE') {
      return `${base} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 before:bg-emerald-400`;
    }
    return `${base} bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 before:bg-zinc-400`;
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden font-body">
      {/* Header Row */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.2em]">Equipment & Personnel</p>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Fleet Asset Management</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'vehicles' ? 'bg-brand-primary text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            Commercial Vehicles ({totalVehicles})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'drivers' ? 'bg-brand-primary text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Fleet Drivers ({totalDrivers})
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      {activeTab === 'vehicles' ? (
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <div className="card p-4 flex flex-col">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Heavy Fleets</p>
            <p className="text-2xl font-bold font-mono text-white">{totalVehicles}</p>
          </div>
          <div className="card p-4 flex flex-col border-emerald-500/20">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Available in Hub Yards</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{availableVehicles}</p>
          </div>
          <div className="card p-4 flex flex-col border-sky-500/20">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Active Line-Hauls</p>
            <p className="text-2xl font-bold font-mono text-sky-400">{activeVehicles}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 shrink-0">
          <div className="card p-4 flex flex-col">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Certified Drivers</p>
            <p className="text-2xl font-bold font-mono text-white">{totalDrivers}</p>
          </div>
          <div className="card p-4 flex flex-col border-emerald-500/20">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Available on Standby</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">{availableDrivers}</p>
          </div>
          <div className="card p-4 flex flex-col border-sky-500/20">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">En Route Driving</p>
            <p className="text-2xl font-bold font-mono text-sky-400">{enRouteDrivers}</p>
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="card overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <h3 className="font-display font-semibold text-sm text-zinc-200">
            {activeTab === 'vehicles' ? 'Commercial Equipment Registry' : 'Driver Roster & Operational Status'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'vehicles' ? (
            <table className="w-full text-left text-xs text-zinc-300 font-body border-collapse">
              <thead className="bg-zinc-900/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-zinc-400 sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3">License Plate</th>
                  <th className="px-5 py-3">Vehicle Model</th>
                  <th className="px-5 py-3">Equipment Type</th>
                  <th className="px-5 py-3 text-right">Max Payload</th>
                  <th className="px-5 py-3 text-right">Max Volume</th>
                  <th className="px-5 py-3">Base Hub Facility</th>
                  <th className="px-5 py-3">Current Consignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                      No commercial vehicles registered.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => {
                    const activeTrk = getActiveShipmentForVehicle(v.id);
                    return (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-brand-primary">{v.licensePlate}</td>
                        <td className="px-5 py-3.5 font-medium text-zinc-200">{v.modelName}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">
                            {v.vehicleType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-zinc-200">
                          {v.maxWeightKg.toLocaleString()} kg
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-zinc-400">
                          {v.maxVolumeCbm.toFixed(1)} m³
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">{getWarehouseName(v.currentWarehouseId)}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          {activeTrk !== '-' ? (
                            <span className="text-sky-400 font-semibold">{activeTrk}</span>
                          ) : (
                            <span className="text-zinc-600">Standby in Yard</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-zinc-300 font-body border-collapse">
              <thead className="bg-zinc-900/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-zinc-400 sticky top-0 z-10 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">License #</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Base Location</th>
                  <th className="px-5 py-3">Active Consignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                      No drivers registered in fleet.
                    </td>
                  </tr>
                ) : (
                  drivers.map((d) => {
                    const activeTrk = getActiveShipmentForDriver(d.id);
                    return (
                      <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-zinc-200">{d.name}</td>
                        <td className="px-5 py-3.5 font-mono text-zinc-400">{d.licenseNumber || 'MH-04-2022'}</td>
                        <td className="px-5 py-3.5 font-mono text-zinc-400">{d.phone || '+91 98200 00000'}</td>
                        <td className="px-5 py-3.5">
                          <span className={driverBadgeClass(d.status)}>{d.status.replace('_', ' ')}</span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">{getWarehouseName(d.warehouseId)}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          {activeTrk !== '-' ? (
                            <span className="text-sky-400 font-semibold">{activeTrk}</span>
                          ) : (
                            <span className="text-zinc-600">Standby</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
