import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { Shipment, updateShipment } from '../store/shipmentsSlice.js';
import { fetchDrivers } from '../store/driversSlice.js';
import { fetchVehicles } from '../store/vehiclesSlice.js';
import { API_BASE } from '../config.js';

interface AllocateModalProps {
  shipment: Shipment;
  onClose: () => void;
}

export default function AllocateModal({ shipment, onClose }: AllocateModalProps) {
  const dispatch = useAppDispatch();
  const drivers = useAppSelector((state) => state.drivers.items);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  const [selectedDriverId, setSelectedDriverId] = useState(shipment.driverId || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState(shipment.vehicleId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate cargo requirements
  const totalWeightKg = shipment.items?.reduce((sum, it) => sum + it.weightKg, 0) || 1000;
  const totalVolumeCbm = shipment.items?.reduce((sum, it) => sum + it.volumeCbm, 0) || 4.0;

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Capacity calculations
  const weightUtilizationPct = selectedVehicle
    ? Math.min(100, Math.round((totalWeightKg / selectedVehicle.maxWeightKg) * 100))
    : 0;
  const isOverweight = selectedVehicle ? totalWeightKg > selectedVehicle.maxWeightKg : false;

  const volumeUtilizationPct = selectedVehicle
    ? Math.min(100, Math.round((totalVolumeCbm / selectedVehicle.maxVolumeCbm) * 100))
    : 0;
  const isOverVolume = selectedVehicle ? totalVolumeCbm > selectedVehicle.maxVolumeCbm : false;

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      setError('Please select a driver to assign.');
      return;
    }
    if (isOverweight) {
      setError('Selected vehicle cannot carry this cargo (payload capacity exceeded).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipment.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          driverId: selectedDriverId,
          vehicleId: selectedVehicleId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to allocate resource');
      }

      const updated = await res.json();
      dispatch(updateShipment(updated));
      dispatch(fetchDrivers());
      dispatch(fetchVehicles());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Allocation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-zinc-200 font-body">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h2 className="font-display font-bold text-base text-zinc-100">Equipment & Driver Allocation</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{shipment.trackingNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAllocate} className="p-6 space-y-5">
          
          {/* Shipment Summary Card */}
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Transit Corridor</span>
              <p className="font-semibold text-zinc-200 mt-0.5">{shipment.originWarehouse.code || 'BOM-01'} → {shipment.destinationWarehouse.code || 'NAG-01'}</p>
              <p className="text-[11px] text-zinc-400">{shipment.originWarehouse.city} to {shipment.destinationWarehouse.city}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Cargo Manifest Size</span>
              <p className="font-semibold text-brand-primary mt-0.5">{totalWeightKg.toLocaleString()} kg</p>
              <p className="text-[11px] text-zinc-400">{totalVolumeCbm.toFixed(1)} m³ volume</p>
            </div>
          </div>

          {/* Driver Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Select Fleet Driver *
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
              required
            >
              <option value="">-- Choose Available Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status}) - {d.phone || 'Fleet Driver'}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Select Commercial Vehicle (Truck/Trailer)
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} | {v.modelName} ({v.maxWeightKg.toLocaleString()} kg max)
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Payload Live Capacity Meter */}
          {selectedVehicle && (
            <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-300">Payload Capacity Meter</span>
                <span className="font-mono text-[11px] text-zinc-400">{selectedVehicle.modelName}</span>
              </div>

              {/* Weight Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Cargo Weight Utilization</span>
                  <span className={`font-mono font-bold ${isOverweight ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {totalWeightKg.toLocaleString()} / {selectedVehicle.maxWeightKg.toLocaleString()} kg ({weightUtilizationPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverweight ? 'bg-rose-500' : weightUtilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (totalWeightKg / selectedVehicle.maxWeightKg) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Volume Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Cubic Space Utilization</span>
                  <span className={`font-mono font-bold ${isOverVolume ? 'text-rose-400' : 'text-zinc-300'}`}>
                    {totalVolumeCbm.toFixed(1)} / {selectedVehicle.maxVolumeCbm.toFixed(1)} m³ ({volumeUtilizationPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-brand-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalVolumeCbm / selectedVehicle.maxVolumeCbm) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {isOverweight && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>Overweight Warning: Cargo exceeds maximum truck capacity!</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverweight}
              className="px-5 py-2 text-xs font-semibold text-zinc-950 bg-brand-primary hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
