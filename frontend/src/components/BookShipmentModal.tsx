import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config.js';

interface Warehouse {
  id: string;
  name: string;
}

interface BookShipmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  warehouses: Warehouse[];
}

export default function BookShipmentModal({ onClose, onSuccess, warehouses }: BookShipmentModalProps) {
  const [originId, setOriginId] = useState(warehouses[0]?.id || '');
  const [destId, setDestId] = useState(warehouses[1]?.id || '');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus modal on mount
    modalRef.current?.focus();
    
    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (originId === destId) {
      setError("Origin and Destination must differ");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/customer/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originWarehouseId: originId,
          destinationWarehouseId: destId,
          contentDescription: content,
          targetDispatchDate: date
        })
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to book shipment.");
      }
    } catch (err) {
      setError("A connection error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg card border border-white/[0.08] bg-bg-surface p-8 flex flex-col gap-6 outline-none shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="modal-title" className="font-display text-xl font-bold text-zinc-100">
            Book New Shipment
          </h2>
          <button 
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-status-danger/10 text-status-danger border border-status-danger/30 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="origin" className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Origin</label>
            <select 
              id="origin" 
              value={originId} 
              onChange={e => setOriginId(e.target.value)} 
              className="glass-input p-3 w-full cursor-pointer" 
              required
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="destination" className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Destination</label>
            <select 
              id="destination" 
              value={destId} 
              onChange={e => setDestId(e.target.value)} 
              className="glass-input p-3 w-full cursor-pointer" 
              required
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contents" className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Contents</label>
            <input 
              id="contents" 
              type="text" 
              placeholder="e.g. 5 Boxes of Electronics" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="glass-input p-3 w-full" 
              required 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Target Dispatch Date</label>
            <input 
              id="date" 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="glass-input p-3 w-full" 
              required 
            />
          </div>

          <div className="flex gap-3 mt-4 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium hover:bg-white/5 transition-colors focus:ring-2 focus:ring-zinc-500 outline-none"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 glass-button py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Booking...' : 'Book Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
