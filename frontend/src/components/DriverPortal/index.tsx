import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks.js';
import { logoutUser } from '../../store/authSlice.js';
import { Shipment } from '../../store/shipmentsSlice.js';
import { API_BASE as GLOBAL_API_BASE } from '../../config.js';

import DriverLog from './DriverLog.js';
import StandbyPanel from './StandbyPanel.js';
import ActiveManifest from './ActiveManifest.js';

const API_BASE = `${GLOBAL_API_BASE}/api`;

export default function DriverPortal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);

  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShipments = useCallback(() => {
    fetch(`${API_BASE}/shipments`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch shipments');
        return res.json();
      })
      .then((data: Shipment[]) => {
        if (!user?.driverId) {
          setAllShipments([]);
          setLoading(false);
          return;
        }
        const mine = data.filter(s => s.driverId === user.driverId);
        setAllShipments(mine);
        setLoading(false);
        setError(null);
      })
      .catch(err => { 
        console.error(err); 
        setLoading(false);
        setError("Could not load shipments");
      });
  }, [user]);

  useEffect(() => {
    loadShipments();
    const interval = setInterval(loadShipments, 5000);
    return () => clearInterval(interval);
  }, [loadShipments]);

  // Derived data
  const activeShipment = allShipments
    .filter(s => s.status !== 'DELIVERED')
    .sort((a, b) => new Date(a.targetDispatchDate).getTime() - new Date(b.targetDispatchDate).getTime())[0] ?? null;
    
  const completedShipments = allShipments
    .filter(s => s.status === 'DELIVERED')
    .sort((a, b) => new Date(b.targetDispatchDate).getTime() - new Date(a.targetDispatchDate).getTime());

  // Handlers
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
      dispatch(logoutUser());
    } catch (err) { console.error(err); }
  };

  const handleDispatch = async () => {
    if (!activeShipment) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${activeShipment.id}/dispatch`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to dispatch');
      }
      loadShipments();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to dispatch route"); 
    }
  };

  const handleReachCheckpoint = async (checkpointId: string) => {
    if (!activeShipment) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${activeShipment.id}/checkpoints/${checkpointId}/reach`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to reach checkpoint');
      }
      loadShipments();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to confirm checkpoint"); 
    }
  };

  const handleAbsentCheckpoint = async (checkpointId: string) => {
    if (!activeShipment) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${activeShipment.id}/checkpoints/${checkpointId}/absent`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to mark checkpoint absent');
      }
      loadShipments();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to mark checkpoint absent"); 
    }
  };

  const handleDeliver = async () => {
    if (!activeShipment) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${activeShipment.id}/deliver`, { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to deliver shipment');
      }
      loadShipments();
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || "Failed to confirm delivery"); 
    }
  };

  if (!user?.driverId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-status-danger font-body" role="alert">
        <p className="glass-panel p-8">Error: Operator credentials invalid. Please contact dispatch.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-brand-primary font-body" aria-busy="true" aria-label="Loading portal">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Connecting to logistics network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen relative overflow-hidden font-body text-zinc-200">
      {/* Top Navbar */}
      <header className="flex justify-between items-center px-6 sm:px-8 py-4 border-b border-border-color bg-bg-sidebar/50 backdrop-blur-md shrink-0 relative z-20" aria-label="Portal Navigation">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-950"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">LogiTrack <span className="font-medium text-zinc-500">Driver Portal</span></h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 border border-border-color hover:border-status-danger/40 hover:text-status-danger hover:bg-status-danger/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
          aria-label="Sign out"
        >
          Sign Out
        </button>
      </header>

      {error && (
        <div className="bg-status-danger/10 border-b border-status-danger/20 text-status-danger p-3 text-center text-sm font-medium shrink-0 relative z-20" role="alert">
          {error}
        </div>
      )}

      {/* Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-0 relative z-10">
        
        {/* Main Terminal View */}
        <main className="flex flex-col p-4 sm:p-8 overflow-y-auto custom-scrollbar" aria-label="Active Assignment">
          <div className="w-full max-w-4xl mx-auto pb-12">
            {activeShipment ? (
              <ActiveManifest
                shipment={activeShipment}
                onDispatch={handleDispatch}
                onReachCheckpoint={handleReachCheckpoint}
                onAbsentCheckpoint={handleAbsentCheckpoint}
                onDeliver={handleDeliver}
              />
            ) : (
              <StandbyPanel />
            )}
          </div>
        </main>

        {/* Sidebar Log */}
        <div className="border-l border-border-color bg-bg-sidebar/30 backdrop-blur-sm h-full overflow-hidden flex flex-col">
          <DriverLog 
            email={user.email} 
            isEnRoute={!!activeShipment} 
            completedShipments={completedShipments} 
            totalAssigned={allShipments.length} 
          />
        </div>
      </div>
    </div>
  );
}
