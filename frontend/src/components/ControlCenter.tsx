import { useState, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { addShipment, updateShipment } from '../store/shipmentsSlice.js';
import { fetchDrivers } from '../store/driversSlice.js';
import CustomSelect from './CustomSelect.js';
import { API_BASE } from '../config.js';

export default function ControlCenter() {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((state) => state.warehouses.items);
  const drivers = useAppSelector((state) => state.drivers.items);
  const shipments = useAppSelector((state) => state.shipments.items);
  
  const unassignedShipments = shipments.filter(s => s.status === 'PENDING' && !s.driver);

  const handleAssignDriver = async (shipmentId: string, driverId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ driverId })
      });
      if (res.ok) {
        setSuccessMsg('Driver assigned successfully!');
        dispatch(updateShipment(await res.json()));
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setError('Failed to assign driver');
    }
  };

  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [targetDispatchDate, setTargetDispatchDate] = useState('');
  const [checkpoints, setCheckpoints] = useState<{name: string}[]>([{name: ''}]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = "glass-input p-2 w-full text-xs";

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
    
    if (!originId || !destId || !driverId || !targetDispatchDate) {
      setError("Please fill all required fields");
      return;
    }
    if (originId === destId) {
      setError("Origin and Destination must differ");
      return;
    }

    const validCheckpoints = checkpoints.filter(c => c.name.trim() !== '');

    setIsSubmitting(true);

    try {
      // Artificial delay of 1s
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res = await fetch(`${API_BASE}/api/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          originId, 
          destinationId: destId,
          driverId,
          targetDispatchDate: new Date(targetDispatchDate).toISOString(),
          checkpoints: validCheckpoints
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create shipment");
      } else {
        dispatch(addShipment(data));
        dispatch(fetchDrivers());
        setOriginId('');
        setDestId('');
        setDriverId('');
        setTargetDispatchDate('');
        setCheckpoints([{name: ''}]);
        setSuccessMsg('Shipment created successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch {
      setError("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset database state?")) return;
    try {
      await fetch(`${API_BASE}/api/reset`, { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));
  const driverOptions = drivers.map(d => ({ value: d.id, label: `${d.name} (${d.status})` }));

  return (
    <div className="card p-5 flex flex-col gap-4 relative h-full">
      <div className="flex justify-between items-center shrink-0">
        <h3 className="font-display font-semibold text-zinc-100 text-sm tracking-wide">Dispatch Control</h3>
        <button 
          onClick={handleReset} 
          className="text-[10px] text-zinc-500 hover:text-status-danger transition-colors flex items-center gap-1.5 cursor-pointer"
          aria-label="Reset Application"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Reset
        </button>
      </div>

      {error && <div className="p-2.5 bg-status-danger/10 text-status-danger border border-status-danger/30 rounded-lg text-xs shrink-0">{error}</div>}
      {successMsg && <div className="p-2.5 bg-status-success/10 text-status-success border border-status-success/30 rounded-lg text-xs shrink-0">{successMsg}</div>}
      
      <form onSubmit={handleCreateShipment} className="flex flex-col gap-3 shrink-0">
        <div className="grid grid-cols-2 gap-2.5">
          <CustomSelect
            value={originId}
            onChange={setOriginId}
            options={warehouseOptions}
            placeholder="Origin..."
          />
          <CustomSelect
            value={destId}
            onChange={setDestId}
            options={warehouseOptions}
            placeholder="Destination..."
          />
          <CustomSelect
            value={driverId}
            onChange={setDriverId}
            options={driverOptions}
            placeholder="Driver..."
          />
          <input 
            type="datetime-local" 
            aria-label="Target Dispatch Date"
            value={targetDispatchDate} 
            onChange={e => setTargetDispatchDate(e.target.value)} 
            className={inputClass}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Checkpoints inline */}
        <div className="flex flex-col gap-2 mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Checkpoints</span>
            <button type="button" onClick={handleAddCheckpoint} className="text-brand-primary text-[10px] font-semibold hover:text-brand-accent transition cursor-pointer">
              + Add
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
            {checkpoints.map((cp, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input 
                  type="text" 
                  aria-label={`Checkpoint ${idx + 1}`}
                  placeholder={`Checkpoint ${idx + 1}`} 
                  value={cp.name}
                  onChange={e => handleCheckpointChange(idx, e.target.value)}
                  className={inputClass}
                />
                {checkpoints.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveCheckpoint(idx)} 
                    className="p-1 text-zinc-500 hover:text-status-danger transition shrink-0 cursor-pointer"
                    aria-label={`Remove checkpoint ${idx + 1}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="glass-button w-full py-2.5 text-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Shipment'
          )}
        </button>
      </form>

      {/* Unassigned Shipments */}
      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <h4 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-widest shrink-0">Pending Assignment</h4>
        {unassignedShipments.length > 0 ? (
          unassignedShipments.map(s => (
            <div key={s.id} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-zinc-400">{s.trackingNumber}</span>
              </div>
              <div className="text-[11px] text-zinc-500">
                {s.originWarehouse.name} → {s.destinationWarehouse.name}
              </div>
              <div className="flex gap-2">
                <CustomSelect
                  value={''}
                  onChange={(val) => handleAssignDriver(s.id, val)}
                  options={driverOptions}
                  placeholder="Assign Driver..."
                />
              </div>
            </div>
          ))
        ) : (
          <div className="p-3 text-center border border-white/[0.05] rounded-lg bg-white/[0.01]">
            <p className="text-[11px] text-zinc-500">All pending shipments have been assigned.</p>
          </div>
        )}
      </div>
    </div>
  );
}
