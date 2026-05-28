import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/index.js';
import { selectShipment } from '../store/shipmentsSlice.js';

export default function ShipmentsList() {
  const dispatch = useDispatch();
  const shipments = useSelector((state: RootState) => state.shipments.items);
  const selectedId = useSelector((state: RootState) => state.shipments.selectedId);
  
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

  const inputClass = "flex-1 px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 font-body text-sm outline-none transition duration-150 focus:border-brand-primary focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)]";
  const selectClass = "px-3.5 py-2.5 bg-bg-main border border-border-color rounded-lg text-slate-100 font-body text-sm outline-none transition duration-150 focus:border-brand-primary focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)] w-auto";

  return (
    <div className="bg-bg-surface border border-border-color rounded-xl p-6 transition-all duration-250 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-bg-surface-hover hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-col gap-4 flex-1 min-h-0">
      <h3 className="text-base font-semibold font-display">Shipments Console</h3>
      
      <div className="flex gap-2.5">
        <input 
          type="text" 
          placeholder="Search tracking / driver..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className={inputClass}
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectClass}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="EN_ROUTE">En Route</option>
          <option value="DELIVERED">Delivered</option>
          <option value="DELAYED">Delayed</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm">
            No shipments found
          </div>
        ) : (
          filtered.map(s => {
            const isSelected = s.id === selectedId;
            return (
              <div 
                key={s.id} 
                onClick={() => dispatch(selectShipment(isSelected ? null : s.id))}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-150 border ${
                  isSelected 
                    ? 'bg-brand-primary/5 border-brand-primary' 
                    : 'bg-bg-main border-border-color hover:bg-bg-surface-hover hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold font-display text-sm text-slate-100">{s.trackingNumber}</span>
                  <span className={badgeClass(s.status)}>{s.status}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{s.originWarehouse.name.split(' ')[0]} ➔ {s.destinationWarehouse.name.split(' ')[0]}</span>
                  <span className="font-mono">{s.progress.toFixed(0)}%</span>
                </div>
                
                {/* Progress bar inside the row for quick preview */}
                <div className="bg-white/5 h-0.5 rounded-sm mt-2.5 overflow-hidden">
                  <div 
                    className="h-full" 
                    style={{ 
                      width: `${s.progress}%`, 
                      backgroundColor: s.status === 'DELAYED' ? 'var(--color-status-danger)' : 'var(--color-brand-primary)' 
                    }} 
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
