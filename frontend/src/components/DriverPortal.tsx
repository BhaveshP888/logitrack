import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { logoutUser } from '../store/authSlice.js';
import { Shipment } from '../store/shipmentsSlice.js';

export default function DriverPortal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);

  const loadShipments = () => {
    fetch('http://localhost:3001/api/shipments', { credentials: 'include' })
      .then(res => res.json())
      .then((data: Shipment[]) => {
        const mine = data.filter(s => s.driverId === user?.driverId);
        setAllShipments(mine);
      })
      .catch(err => { console.error(err); });
  };

  useEffect(() => {
    loadShipments();
    const interval = setInterval(loadShipments, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const activeShipment = allShipments.find(s => s.status !== 'DELIVERED') ?? null;

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
      dispatch(logoutUser());
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatch = async () => {
    if (!activeShipment) return;
    try {
      await fetch(`http://localhost:3001/api/shipments/${activeShipment.id}/dispatch`, { method: 'POST', credentials: 'include' });
      loadShipments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReachCheckpoint = async (checkpointId: string) => {
    if (!activeShipment) return;
    try {
      await fetch(`http://localhost:3001/api/shipments/${activeShipment.id}/checkpoints/${checkpointId}/reach`, { method: 'POST', credentials: 'include' });
      loadShipments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-transparent relative z-0 text-zinc-100 flex-col font-body p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Driver Terminal</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mt-1">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="glass-button p-2 px-4 text-xs">
          Logout
        </button>
      </header>

      {activeShipment ? (
        <div className="glass-panel p-8 flex flex-col gap-5 max-w-md w-full mx-auto overflow-y-auto custom-scrollbar">
          <div className="relative">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Assigned Shipment</span>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-display text-zinc-100 tracking-wider">{activeShipment.trackingNumber}</h2>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                activeShipment.status === 'DELAYED' ? 'bg-status-danger/10 text-status-danger border border-status-danger/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' :
                activeShipment.status === 'EN_ROUTE' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-[0_0_15px_rgba(79,70,229,0.3)]' :
                'bg-zinc-800/50 text-zinc-400 border border-zinc-700'
              }`}>
                {activeShipment.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm border-b border-white/10 pb-5">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">From</span>
              <p className="font-semibold">{activeShipment.originWarehouse.name}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">To</span>
              <p className="font-semibold">{activeShipment.destinationWarehouse.name}</p>
            </div>
          </div>

          {(activeShipment.status === 'PENDING' || activeShipment.status === 'DELAYED') && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="text-sm">
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider mr-2">Target Dispatch</span>
                <span className="font-mono font-bold text-zinc-200">{new Date(activeShipment.targetDispatchDate).toLocaleString()}</span>
              </div>
              <button 
                onClick={handleDispatch}
                className="glass-button p-3 flex justify-center items-center gap-2 font-bold"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                Begin Route
              </button>
            </div>
          )}

          {activeShipment.status === 'EN_ROUTE' && (
            <div className="flex flex-col gap-3 pt-2">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Route Progress</h3>
              <div className="flex flex-col gap-3 relative">
                <div className="absolute left-3.5 top-2 bottom-6 w-0.5 bg-white/5 z-0"></div>
                {activeShipment.checkpoints.map((cp, idx) => {
                  const isNextUnreached = !cp.reached && (idx === 0 || activeShipment.checkpoints[idx - 1].reached);
                  
                  return (
                    <div key={cp.id} className={`flex justify-between items-center p-4 rounded-xl border backdrop-blur-md relative z-10 transition-all ${
                      cp.reached ? 'bg-white/5 border-transparent text-zinc-400' : 
                      isNextUnreached ? 'border-brand-primary/50 bg-brand-primary/10 shadow-[0_0_15px_rgba(79,70,229,0.2)] scale-[1.02]' : 
                      'border-white/10 bg-black/20 text-zinc-500'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          cp.reached ? 'bg-status-success shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 
                          isNextUnreached ? 'bg-brand-primary shadow-[0_0_10px_rgba(79,70,229,0.8)]' : 
                          'bg-zinc-700'
                        }`}>
                        </div>
                        <span className="text-sm font-semibold tracking-wide">{cp.name}</span>
                      </div>
                      
                      {isNextUnreached && (
                        <button 
                          onClick={() => handleReachCheckpoint(cp.id)}
                          className="glass-button px-3 py-1.5 text-xs flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Confirm
                        </button>
                      )}
                      
                      {cp.reached && cp.reachedAt && (
                        <span className="text-[10px] font-mono text-status-success">{new Date(cp.reachedAt).toLocaleTimeString()}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-8 text-center max-w-md w-full mx-auto flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-zinc-200 mb-1">Standby Mode</h3>
            <p className="text-sm text-zinc-400">No active shipments assigned to your unit.</p>
          </div>
        </div>
      )}
    </div>
  );
}
