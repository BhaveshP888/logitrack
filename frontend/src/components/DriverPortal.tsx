import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { logoutUser } from '../store/authSlice.js';
import { io } from 'socket.io-client';

let socket: any;

export default function DriverPortal() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const [assignedShipment, setAssignedShipment] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:3001');
    }

    const loadShipment = () => {
      fetch('http://localhost:3001/api/shipments')
        .then(res => res.json())
        .then((data: any[]) => {
          const active = data.find(s => s.driverId === user?.driverId && (s.status === 'EN_ROUTE' || s.status === 'DELAYED'));
          if (active) setAssignedShipment(active);
          else setAssignedShipment(null);
        })
        .catch(err => console.error(err));
    };

    loadShipment();

    // Listen for socket events to keep current state in sync
    socket.on('SHIPMENT_DELIVERED', (data: { shipmentId: string }) => {
      if (assignedShipment && data.shipmentId === assignedShipment.id) {
        setAssignedShipment(null);
        setIsSimulating(false);
      }
    });

    return () => {
      if (socket) {
        socket.off('SHIPMENT_DELIVERED');
      }
    };
  }, [user, assignedShipment]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST' });
      dispatch(logoutUser());
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate location updates periodically
  useEffect(() => {
    if (!isSimulating || !assignedShipment) return;

    let pct = assignedShipment.progress;
    const interval = setInterval(() => {
      pct += 2;
      if (pct >= 100) {
        pct = 100;
        setIsSimulating(false);
        // Complete delivery
        socket.emit('DRIVER_TELEMETRY', {
          driverId: user?.driverId,
          latitude: assignedShipment.destinationWarehouse.latitude,
          longitude: assignedShipment.destinationWarehouse.longitude,
          shipmentId: assignedShipment.id,
          progress: 100
        });
        setAssignedShipment(null);
        clearInterval(interval);
      } else {
        // Linear interpolation for coordinate telemetry
        const origin = assignedShipment.originWarehouse;
        const dest = assignedShipment.destinationWarehouse;
        const currentLat = origin.latitude + (dest.latitude - origin.latitude) * (pct / 100);
        const currentLng = origin.longitude + (dest.longitude - origin.longitude) * (pct / 100);

        socket.emit('DRIVER_TELEMETRY', {
          driverId: user?.driverId,
          latitude: currentLat,
          longitude: currentLng,
          shipmentId: assignedShipment.id,
          progress: pct
        });

        setAssignedShipment((prev: any) => prev ? { ...prev, progress: pct } : null);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating, assignedShipment, user]);

  return (
    <div className="flex h-screen w-screen bg-bg-main text-slate-100 flex-col font-body p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">Driver Terminal</h1>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="py-2 px-4 rounded-lg bg-white/5 border border-border-color text-sm transition hover:bg-bg-surface-hover cursor-pointer">
          Logout
        </button>
      </header>

      {assignedShipment ? (
        <div className="bg-bg-surface border border-border-color rounded-xl p-6 shadow-md flex flex-col gap-4 max-w-md w-full mx-auto">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Shipment</span>
            <h2 className="text-lg font-bold font-display text-slate-100">{assignedShipment.trackingNumber}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500">From</span>
              <p className="font-semibold">{assignedShipment.originWarehouse.name}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">To</span>
              <p className="font-semibold">{assignedShipment.destinationWarehouse.name}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Transit Progress</span>
              <span className="font-semibold text-brand-primary">{assignedShipment.progress.toFixed(0)}%</span>
            </div>
            <div className="bg-white/5 h-1.5 rounded-sm overflow-hidden mb-2">
              <div 
                className="h-full bg-brand-primary transition-all duration-300"
                style={{ width: `${assignedShipment.progress}%` }}
              />
            </div>

            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition cursor-pointer ${
                isSimulating ? 'bg-status-danger text-white hover:bg-red-600' : 'bg-brand-primary text-white hover:bg-blue-600'
              }`}
            >
              {isSimulating ? "Stop Live Simulation" : "Start Live Simulation"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-color rounded-xl p-8 text-center text-slate-400 max-w-md w-full mx-auto">
          No active en-route shipments assigned. Standby for dispatch.
        </div>
      )}
    </div>
  );
}
