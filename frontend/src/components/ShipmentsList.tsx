import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { selectShipment } from '../store/shipmentsSlice.js';
import CustomSelect from './CustomSelect.js';

export default function ShipmentsList() {
  const dispatch = useAppDispatch();
  const shipments = useAppSelector((state) => state.shipments.items);
  const selectedId = useAppSelector((state) => state.shipments.selectedId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = shipments.filter(s => {
    const matchSearch = s.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (s.driver?.name.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'ALL' || s.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const badgeClass = (status: string) => {
    const base = "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:inline-block";
    switch (status) {
      case 'PENDING':
        return `${base} bg-status-warning/8 text-status-warning border border-status-warning/15 before:bg-status-warning`;
      case 'EN_ROUTE':
        return `${base} bg-brand-primary/8 text-brand-primary border border-brand-primary/15 before:bg-brand-primary`;
      case 'DELIVERED':
        return `${base} bg-status-success/8 text-status-success border border-status-success/15 before:bg-status-success`;
      case 'DELAYED':
        return `${base} bg-status-danger/8 text-status-danger border border-status-danger/15 before:bg-status-danger`;
      default:
        return base;
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex justify-between items-center shrink-0">
        <h3 className="font-display font-semibold text-zinc-100 tracking-wide text-sm">Active Roster</h3>
      </div>
      
      <div className="flex gap-2 shrink-0">
        <input 
          type="text" 
          placeholder="Search tracking / driver..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input flex-1 min-w-0 p-2 text-xs"
        />
        <CustomSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'EN_ROUTE', label: 'En Route' },
            { value: 'DELIVERED', label: 'Delivered' },
            { value: 'DELAYED', label: 'Delayed' },
          ]}
          className="w-28"
        />
      </div>

      <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {filtered.length === 0 && (
          <p className="text-zinc-500 text-sm font-body italic p-4 text-center border border-dashed border-white/10 rounded-xl">No active shipments.</p>
        )}
        {filtered.map(s => (
          <div 
            key={s.id} 
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border backdrop-blur-md ${selectedId === s.id ? 'bg-brand-primary/10 border-brand-primary/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            onClick={() => dispatch(selectShipment(s.id))}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-medium text-zinc-200 tracking-wide text-xs">{s.trackingNumber}</span>
              <span className={badgeClass(s.status)}>{s.status.replace('_', ' ')}</span>
            </div>
            
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">
              <span className="max-w-[45%] truncate">{s.originWarehouse.name.split(' ')[0]}</span>
              <span className="opacity-50">→</span>
              <span className="max-w-[45%] text-right truncate">{s.destinationWarehouse.name.split(' ')[0]}</span>
            </div>
            
            <div className="w-full bg-zinc-900/80 rounded-full h-1 mt-2 overflow-hidden shadow-inner border border-white/5">
              <div 
                className={`h-1 rounded-full transition-all duration-1000 ${
                  s.status === 'DELIVERED' ? 'bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 
                  s.status === 'DELAYED' ? 'bg-status-danger shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse' : 
                  s.status === 'PENDING' ? 'bg-transparent' :
                  'bg-brand-accent shadow-[0_0_8px_rgba(14,165,233,0.8)]'
                }`} 
                style={{ width: `${s.status === 'PENDING' ? 0 : s.status === 'DELIVERED' ? 100 : Math.max(10, (s.checkpoints.filter(c => c.reached).length / s.checkpoints.length) * 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
