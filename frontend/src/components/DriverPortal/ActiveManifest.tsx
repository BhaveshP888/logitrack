import { Shipment } from '../../store/shipmentsSlice.js';

interface ActiveManifestProps {
  shipment: Shipment;
  onDispatch: () => void;
  onReachCheckpoint: (id: string) => void;
  onAbsentCheckpoint: (id: string) => void;
  onDeliver: () => void;
}

export default function ActiveManifest({ shipment, onDispatch, onReachCheckpoint, onAbsentCheckpoint, onDeliver }: ActiveManifestProps) {
  const isEnRoute = shipment.status === 'EN_ROUTE';
  
  return (
    <article className="w-full max-w-4xl mx-auto flex flex-col font-body" aria-labelledby="manifest-title">
      {/* Structural Header */}
      <header className="glass-panel p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8 relative z-10">
          <div>
            <h1 id="manifest-title" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Active Route</h1>
            <p className="text-3xl font-bold text-zinc-100">{shipment.trackingNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Status</span>
            <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full ${
              shipment.status === 'DELAYED' ? 'bg-status-danger/10 border border-status-danger/20 text-status-danger' :
              isEnRoute ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary' :
              'bg-white/5 border border-white/10 text-zinc-400'
            }`}>
              {shipment.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="card p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Origin</span>
            <p className="text-sm font-semibold text-zinc-200">{shipment.originWarehouse.name}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Destination</span>
            <p className="text-sm font-semibold text-zinc-200">{shipment.destinationWarehouse.name}</p>
          </div>
          <div className="card p-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Dispatch Target</span>
            <p className="text-sm font-semibold text-zinc-200">{new Date(shipment.targetDispatchDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </header>

      {/* Action: Dispatch */}
      {(shipment.status === 'PENDING' || shipment.status === 'DELAYED') && (
        <button 
          onClick={onDispatch} 
          className="glass-button w-full py-4 text-base shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 mb-6 flex items-center justify-center gap-2"
          aria-label="Begin Route Execution"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Begin Route Execution
        </button>
      )}

      {/* Sequence Matrix (Checkpoints) */}
      {isEnRoute && shipment.checkpoints.length > 0 && (
        <section aria-label="Route Sequence" className="glass-panel p-6 sm:p-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-6">Checkpoint Progress</h2>
          
          <ol className="relative border-l border-border-color ml-4 space-y-8">
            {shipment.checkpoints.map((cp, idx) => {
              const isPast = cp.reached || cp.isAbsent;
              const isNext = !isPast && (idx === 0 || shipment.checkpoints[idx - 1].reached || shipment.checkpoints[idx - 1].isAbsent);
              
              return (
                <li 
                  key={cp.id} 
                  className={`pl-8 relative transition-opacity ${
                    isPast ? 'opacity-60' : 'opacity-100'
                  }`}
                  aria-current={isNext ? "step" : undefined}
                >
                  <span className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-8 ring-bg-surface ${
                    cp.reached ? 'bg-status-success text-zinc-950' :
                    cp.isAbsent ? 'bg-status-danger text-zinc-950' :
                    isNext ? 'bg-brand-primary text-zinc-950 shadow-[0_0_12px_rgba(45,212,191,0.5)]' :
                    'bg-zinc-800 text-zinc-500'
                  }`} aria-hidden="true">
                    {cp.reached ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : cp.isAbsent ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div>
                      <p className={`text-base ${isNext ? 'text-zinc-100 font-bold' : 'text-zinc-300 font-medium'} ${cp.isAbsent ? 'line-through text-status-danger/80' : ''}`}>
                        {cp.name}
                      </p>
                      {cp.reached && cp.reachedAt && (
                        <p className="text-xs text-status-success mt-1">Confirmed at {new Date(cp.reachedAt).toLocaleTimeString()}</p>
                      )}
                      {cp.isAbsent && (
                        <p className="text-xs text-status-danger mt-1">Marked absent</p>
                      )}
                      {!isPast && !isNext && (
                        <p className="text-xs text-zinc-500 mt-1">Pending arrival</p>
                      )}
                    </div>

                    {/* Actions */}
                    {isNext && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => onAbsentCheckpoint(cp.id)} 
                          className="px-4 py-2 rounded-xl text-xs font-semibold border border-status-danger/30 text-status-danger hover:bg-status-danger hover:text-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
                          aria-label={`Mark ${cp.name} as absent`}
                        >
                          Absent
                        </button>
                        <button 
                          onClick={() => onReachCheckpoint(cp.id)} 
                          className="glass-button px-4 py-2 text-xs"
                          aria-label={`Confirm reaching ${cp.name}`}
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Confirm Delivery button */}
      {isEnRoute && (
        <button 
          onClick={onDeliver} 
          className="mt-6 w-full py-4 rounded-xl bg-status-success text-zinc-950 text-base font-bold shadow-lg shadow-status-success/20 hover:bg-[#2fb280] transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-success focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
          aria-label="Confirm Destination Reached"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          Confirm Destination Reached
        </button>
      )}
    </article>
  );
}
