import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config.js';
import CustomSelect from './CustomSelect.js';

interface Warehouse {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

interface BookShipmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  warehouses: Warehouse[];
}

export default function BookShipmentModal({ onClose, onSuccess, warehouses }: BookShipmentModalProps) {
  const [originId, setOriginId] = useState(warehouses[0]?.id || '');
  const [destId, setDestId] = useState(warehouses[1]?.id || '');
  const [content, setContent] = useState('Industrial High-Precision Equipment & Assemblies');
  const [date, setDate] = useState('');
  const [weightKg, setWeightKg] = useState('3200');
  const [volumeCbm, setVolumeCbm] = useState('8.5');
  const [isHazmat, setIsHazmat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Approximate distance & rate calculation for UI preview
  const estimatedBase = 2500;
  const weightSurcharge = (parseFloat(weightKg) || 500) * 2.0;
  const hazmatSurcharge = isHazmat ? 3500 : 0;
  const estimatedRate = Math.round(estimatedBase + 8500 + weightSurcharge + hazmatSurcharge);

  useEffect(() => {
    modalRef.current?.focus();
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

    if (!originId || !destId || !date) {
      setError("Please select origin, destination, and dispatch date.");
      setIsSubmitting(false);
      return;
    }

    if (originId === destId) {
      setError("Origin and Destination facilities must differ");
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
          targetDispatchDate: new Date(date).toISOString(),
          items: [
            {
              description: content,
              quantity: 1,
              weightKg: parseFloat(weightKg) || 1000,
              volumeCbm: parseFloat(volumeCbm) || 3.0,
              isHazmat
            }
          ]
        })
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to book shipment.");
      }
    } catch {
      setError("A connection error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg card border border-white/10 bg-[#0e0e11] p-6 sm:p-8 flex flex-col gap-5 outline-none shadow-2xl my-6 text-zinc-200 font-body"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-bold text-zinc-100">
              Book Line-Haul Freight
            </h2>
            <p className="text-xs text-zinc-400">Reserve full-truckload (FTL) or palletized cargo transit</p>
          </div>
          <button 
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Facility Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Origin Facility *</label>
              <CustomSelect
                options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code || 'HUB'})` }))}
                value={originId}
                onChange={setOriginId}
                placeholder="Select Origin Hub"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Destination Facility *</label>
              <CustomSelect
                options={warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code || 'HUB'})` }))}
                value={destId}
                onChange={setDestId}
                placeholder="Select Destination Hub"
              />
            </div>
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Target Dispatch Date & Time *</label>
            <input 
              type="datetime-local" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>

          {/* Cargo Manifest */}
          <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Consignment Manifest</span>
            <div>
              <input 
                type="text" 
                placeholder="Description of cargo (e.g. Euro-6 Engine Assemblies)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors"
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
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-0.5">Volume (m³)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={volumeCbm}
                  onChange={(e) => setVolumeCbm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors"
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
                  <span className="text-[11px]">HazMat</span>
                </label>
              </div>
            </div>
          </div>

          {/* Dynamic Rate Estimate */}
          <div className="p-3.5 rounded-xl border border-brand-primary/20 bg-brand-primary/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Estimated Freight Cost</span>
              <span className="text-xs text-zinc-400">Includes distance, payload surcharge, & toll corridor</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-brand-primary">₹{estimatedRate.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 block">+18% GST</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-zinc-950 bg-brand-primary hover:bg-brand-accent rounded-xl transition-colors cursor-pointer shadow-md shadow-brand-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Confirming Booking...' : 'Confirm Freight Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
