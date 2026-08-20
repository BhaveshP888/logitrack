import { useState, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { addShipment } from '../store/shipmentsSlice.js';
import { fetchDrivers } from '../store/driversSlice.js';
import { fetchVehicles } from '../store/vehiclesSlice.js';
import CustomSelect from './CustomSelect.js';
import { API_BASE } from '../config.js';

export default function ControlCenter() {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((state) => state.warehouses.items);
  const drivers = useAppSelector((state) => state.drivers.items);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [targetDispatchDate, setTargetDispatchDate] = useState('');
  const [cargoDescription, setCargoDescription] = useState('Precision Industrial Components');
  const [weightKg, setWeightKg] = useState('4500');
  const [volumeCbm, setVolumeCbm] = useState('12.5');
  const [isHazmat, setIsHazmat] = useState(false);
  const [checkpoints, setCheckpoints] = useState<{ name: string }[]>([
    { name: 'Regional Weigh & Toll Plaza' },
    { name: 'Midway Highway Checkpost' }
  ]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = "w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors";

  const handleAddCheckpoint = () => {
    setCheckpoints([...checkpoints, { name: '' }]);
  };

  const handleRemoveCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleCheckpointChange = (index: number, val: string) => {
    const newCp = [...checkpoints];
    newCp[index].name = val;
    setCheckpoints(newCp);
  };

  const handleCreateShipment = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!originId || !destId || !targetDispatchDate) {
      setError("Please specify Origin, Destination, and Target Departure Date");
      return;
    }
    if (originId === destId) {
      setError("Origin and Destination must be different facilities");
      return;
    }

    const validCheckpoints = checkpoints.filter((c) => c.name.trim() !== '');

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originId,
          destinationId: destId,
          driverId: driverId || null,
          vehicleId: vehicleId || null,
          targetDispatchDate: new Date(targetDispatchDate).toISOString(),
          contentDescription: cargoDescription,
          items: [
            {
              description: cargoDescription,
              quantity: 1,
              weightKg: parseFloat(weightKg) || 1000,
              volumeCbm: parseFloat(volumeCbm) || 4.0,
              isHazmat
            }
          ],
          checkpoints: validCheckpoints
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create consignment");
      } else {
        dispatch(addShipment(data));
        dispatch(fetchDrivers());
        dispatch(fetchVehicles());
        setOriginId('');
        setDestId('');
        setDriverId('');
        setVehicleId('');
        setTargetDispatchDate('');
        setSuccessMsg(`Consignment ${data.trackingNumber} booked successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch {
      setError("Network or server communication error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6 flex flex-col gap-5 text-zinc-200 font-body">
      <div>
        <h2 className="font-display font-bold text-base text-zinc-100">Create Freight Consignment</h2>
        <p className="text-xs text-zinc-400">Book new line-haul, allocate equipment, and define waypoints</p>
      </div>

      <form onSubmit={handleCreateShipment} className="flex flex-col gap-4">
        {/* Origin & Destination Hubs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Origin Facility *</label>
            <CustomSelect
              options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code || 'HUB'})` }))}
              value={originId}
              onChange={setOriginId}
              placeholder="Select Origin Hub"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Destination Facility *</label>
            <CustomSelect
              options={warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code || 'HUB'})` }))}
              value={destId}
              onChange={setDestId}
              placeholder="Select Destination Hub"
            />
          </div>
        </div>

        {/* Departure Date & Time */}
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Target Departure Date & Time *</label>
          <input
            type="datetime-local"
            value={targetDispatchDate}
            onChange={(e) => setTargetDispatchDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Cargo Details */}
        <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Cargo Manifest Details</span>
          <div>
            <input
              type="text"
              placeholder="Cargo Description (e.g. Euro-6 Engine Assemblies, Solar Inverters)"
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className={inputClass}
                placeholder="4500"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-0.5">Volume (m³)</label>
              <input
                type="number"
                step="0.1"
                value={volumeCbm}
                onChange={(e) => setVolumeCbm(e.target.value)}
                className={inputClass}
                placeholder="12.5"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isHazmat}
                  onChange={(e) => setIsHazmat(e.target.checked)}
                  className="rounded border-white/10 bg-zinc-900 text-brand-primary"
                />
                <span className="text-[11px]">HazMat Cargo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Equipment & Driver (Optional at creation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Assign Driver (Optional)</label>
            <CustomSelect
              options={drivers.map((d) => ({ value: d.id, label: `${d.name} (${d.status})` }))}
              value={driverId}
              onChange={setDriverId}
              placeholder="Assign Driver Later"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Assign Commercial Vehicle</label>
            <CustomSelect
              options={vehicles.map((v) => ({ value: v.id, label: `${v.licensePlate} (${v.modelName})` }))}
              value={vehicleId}
              onChange={setVehicleId}
              placeholder="Assign Vehicle Later"
            />
          </div>
        </div>

        {/* Route Waypoints */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Transit Waypoints & Checkpoints</label>
            <button
              type="button"
              onClick={handleAddCheckpoint}
              className="text-[11px] font-semibold text-brand-primary hover:text-brand-accent cursor-pointer"
            >
              + Add Waypoint
            </button>
          </div>

          <div className="space-y-2">
            {checkpoints.map((cp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 w-5">#{idx + 1}</span>
                <input
                  type="text"
                  placeholder={`Waypoint name (e.g. Toll Plaza, Regional Transshipment Hub)`}
                  value={cp.name}
                  onChange={(e) => handleCheckpointChange(idx, e.target.value)}
                  className={inputClass}
                />
                {checkpoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCheckpoint(idx)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-accent text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? 'Creating Consignment...' : 'Book & Issue Waybill'}
        </button>
      </form>
    </div>
  );
}
