import { useState, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { addShipment } from '../store/shipmentsSlice.js';
import { fetchDrivers } from '../store/driversSlice.js';
import CustomSelect from './CustomSelect.js';

export default function ControlCenter() {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((state) => state.warehouses.items);
  const drivers = useAppSelector((state) => state.drivers.items);
  
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

      const res = await fetch('http://localhost:3001/api/shipments', {
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
    } catch (err) {
      setError("Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset database state?")) return;
    try {
      await fetch('http://localhost:3001/api/reset', { method: 'POST', credentials: 'include' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));
  const driverOptions = drivers.map(d => ({ value: d.id, label: `${d.name} (${d.status})` }));

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 relative">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold text-zinc-100 tracking-wide">Dispatch Control</h3>
      </div>

      {error && <div className="p-3 bg-status-danger/10 text-status-danger border border-status-danger/30 rounded-lg text-sm">{error}</div>}
      {successMsg && <div className="p-3 bg-status-success/10 text-status-success border border-status-success/30 rounded-lg text-sm transition-all">{successMsg}</div>}
      
      <form onSubmit={handleCreateShipment} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
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
            value={targetDispatchDate} 
            onChange={e => setTargetDispatchDate(e.target.value)} 
            className={inputClass}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5 block">Checkpoints</label>
          <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
            {checkpoints.map((cp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder={`Checkpoint ${idx + 1}`} 
                  value={cp.name}
                  onChange={e => handleCheckpointChange(idx, e.target.value)}
                  className={inputClass}
                />
                {checkpoints.length > 1 && (
                  <button type="button" onClick={() => handleRemoveCheckpoint(idx)} className="p-1.5 text-zinc-400 hover:text-status-danger transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddCheckpoint} className="text-brand-primary text-xs font-semibold self-start hover:text-brand-accent transition">+ Add Checkpoint</button>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 mt-1 rounded-lg bg-brand-primary text-zinc-950 font-semibold text-sm cursor-pointer transition duration-150 flex items-center justify-center gap-2 hover:bg-brand-accent disabled:opacity-50 disabled:cursor-wait"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      <hr className="border-none h-px bg-border-color my-0.5" />

      <div className="flex gap-2">
        <button 
          onClick={handleReset} 
          className="flex-1 py-3 px-4 rounded-lg bg-white/4 border border-status-danger/20 text-status-danger font-semibold text-xs cursor-pointer transition duration-150 flex items-center justify-center gap-2 hover:bg-bg-surface-hover hover:border-status-danger/40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Reset App
        </button>
      </div>
    </div>
  );
}
