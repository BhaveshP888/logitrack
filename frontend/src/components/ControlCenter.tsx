import { useState, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { addShipment, fetchShipments } from '../store/shipmentsSlice.js';
import { fetchDrivers } from '../store/driversSlice.js';

export default function ControlCenter() {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((state) => state.warehouses.items);
  const selectedShipmentId = useAppSelector((state) => state.shipments.selectedId);
  const shipments = useAppSelector((state) => state.shipments.items);
  
  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);
  
  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [error, setError] = useState('');

  const handleDispatch = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!originId || !destId) {
      setError("Select origin and destination");
      return;
    }
    if (originId === destId) {
      setError("Origin and Destination must differ");
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/shipments/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originId, destinationId: destId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to dispatch");
      } else {
        dispatch(addShipment(data));
        dispatch(fetchDrivers()); // Update status
        setOriginId('');
        setDestId('');
      }
    } catch (err) {
      setError("Connection error");
    }
  };

  const handleSimulateDelay = async () => {
    if (!selectedShipmentId) return;
    try {
      await fetch(`http://localhost:3001/api/shipments/${selectedShipmentId}/delay`, { method: 'POST' });
      dispatch(fetchShipments());
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset database state?")) return;
    try {
      await fetch('http://localhost:3001/api/reset', { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const selectClass = "w-full px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 font-body text-sm outline-none transition duration-150 focus:border-brand-primary focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]";

  return (
    <div className="bg-bg-surface border border-border-color rounded-xl p-6 transition-all duration-250 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-bg-surface-hover hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col gap-5">
      <h3 className="text-base font-semibold font-display">Operations Control Center</h3>
      
      <form onSubmit={handleDispatch} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Dispatch Origin</label>
          <select 
            value={originId} 
            onChange={e => setOriginId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select Warehouse</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Dispatch Destination</label>
          <select 
            value={destId} 
            onChange={e => setDestId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select Warehouse</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        {error && <p className="text-status-danger text-xs font-semibold">{error}</p>}
        <button 
          type="submit" 
          className="w-full py-3 px-4 rounded-lg bg-brand-primary text-white font-semibold text-sm cursor-pointer transition duration-150 flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Dispatch Shipment
        </button>
      </form>

      <hr className="border-none h-px bg-border-color" />

      <div className="flex gap-2.5">
        <button 
          onClick={handleSimulateDelay} 
          disabled={!selectedShipment || selectedShipment.status !== 'EN_ROUTE'}
          className="flex-1 py-3 px-4 rounded-lg bg-white/4 border border-border-color text-slate-100 font-semibold text-sm cursor-pointer transition duration-150 flex items-center justify-center gap-2 hover:bg-bg-surface-hover hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Trigger Delay
        </button>
        <button 
          onClick={handleReset} 
          className="flex-1 py-3 px-4 rounded-lg bg-white/4 border border-status-danger/20 text-status-danger font-semibold text-sm cursor-pointer transition duration-150 flex items-center justify-center gap-2 hover:bg-bg-surface-hover hover:border-status-danger/40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
