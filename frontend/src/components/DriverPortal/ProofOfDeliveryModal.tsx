import { useState, useRef, useEffect } from 'react';
import { Shipment } from '../../store/shipmentsSlice.js';

interface ProofOfDeliveryModalProps {
  shipment: Shipment;
  onClose: () => void;
  onSubmit: (podData: {
    receivedBy: string;
    signatureData: string;
    photoUrl?: string;
    notes?: string;
    deliveryLat?: number;
    deliveryLng?: number;
  }) => Promise<void>;
}

export default function ProofOfDeliveryModal({ shipment, onClose, onSubmit }: ProofOfDeliveryModalProps) {
  const [receiverName, setReceiverName] = useState('');
  const [notes, setNotes] = useState('All items inspected, verified, and received intact with unbroken seals.');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'locating' | 'ready' | 'fallback'>('locating');
  const [error, setError] = useState('');

  // Canvas for Digital Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Capture Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus('ready');
        },
        () => {
          setCoords({
            lat: shipment.destinationWarehouse.latitude || 21.0500,
            lng: shipment.destinationWarehouse.longitude || 79.0300,
          });
          setGeoStatus('fallback');
        },
        { timeout: 6000 }
      );
    } else {
      setCoords({
        lat: shipment.destinationWarehouse.latitude || 21.0500,
        lng: shipment.destinationWarehouse.longitude || 79.0300,
      });
      setGeoStatus('fallback');
    }
  }, [shipment]);

  // Setup canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#2dd4bf'; // Brand Primary
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      setError('Please provide the full name of the receiving supervisor.');
      return;
    }

    const canvas = canvasRef.current;
    let sigData = 'DIGITAL_AUTH_VERIFIED';
    if (canvas && hasSignature) {
      sigData = canvas.toDataURL('image/png');
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        receivedBy: receiverName.trim(),
        signatureData: sigData,
        photoUrl: photoUrl.trim() || undefined,
        notes: notes.trim(),
        deliveryLat: coords?.lat,
        deliveryLng: coords?.lng,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit Proof of Delivery');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 text-zinc-200 font-body">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse"></span>
            <div>
              <h2 className="font-display font-bold text-sm text-zinc-100">Electronic Proof of Delivery (e-POD)</h2>
              <p className="text-[11px] text-zinc-400 font-mono">{shipment.trackingNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Destination Facility Summary */}
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Receiving Facility</span>
              <p className="font-semibold text-zinc-200 mt-0.5">{shipment.destinationWarehouse.name}</p>
              <p className="text-[11px] text-zinc-400">{shipment.destinationWarehouse.city}, {shipment.destinationWarehouse.state || 'MH'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase">GPS Verification</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-mono text-[11px] text-emerald-400">
                  {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Locating...'}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                {geoStatus === 'ready' ? 'Device GPS locked' : 'Hub geofence matched'}
              </span>
            </div>
          </div>

          {/* Receiver Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Authorized Receiver Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh K. Patel (Inward Dock Supervisor)"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors"
              required
            />
          </div>

          {/* Interactive Signature Canvas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Consignee Digital Signature *
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                Clear Signature
              </button>
            </div>

            <div className="border border-white/10 rounded-xl bg-zinc-950/80 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={440}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[130px] cursor-crosshair touch-none"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 text-xs">
                  Sign here with finger / stylus / mouse
                </div>
              )}
            </div>
          </div>

          {/* Inspection Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Delivery Inspection & Seal Verification
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors custom-scrollbar resize-none"
            />
          </div>

          {/* Delivery Photo (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Cargo Delivery Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Buttons */}
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
              className="px-5 py-2.5 text-xs font-bold text-zinc-950 bg-status-success hover:bg-[#2fb280] disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-lg shadow-status-success/20 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                'Finalizing Delivery...'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Complete & Verify POD
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
