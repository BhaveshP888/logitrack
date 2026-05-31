import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks.js';
import { fetchShipments } from './store/shipmentsSlice.js';
import { fetchDrivers } from './store/driversSlice.js';
import { fetchWarehouses } from './store/warehousesSlice.js';
import { checkSession } from './store/authSlice.js';

import Sidebar from './components/Sidebar.js';
import MetricsGrid from './components/MetricsGrid.js';
import LiveMap from './components/LiveMap.js';
import ShipmentsList from './components/ShipmentsList.js';
import ControlCenter from './components/ControlCenter.js';
import Login from './components/Login.js';
import DriverPortal from './components/DriverPortal.js';

export default function App() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      // Connect to Socket server
      dispatch({ type: 'socket/connect' });
      
      // Load initial lists
      dispatch(fetchShipments());
      dispatch(fetchDrivers());
      dispatch(fetchWarehouses());
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-main text-slate-400 font-body">
        Syncing logistics feed...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.role === 'DRIVER') {
    return <DriverPortal />;
  }

  return (
    <div className="flex h-screen w-screen bg-bg-main">
      <Sidebar />
      <main className="flex-1 flex flex-col p-8 gap-6 h-full overflow-hidden min-w-0">
        <header className="flex justify-between items-center">
          <h1 className="font-display text-3xl font-semibold text-slate-100 tracking-tight">Logistics Command Dashboard</h1>
        </header>
        
        <MetricsGrid />

        <div className="grid grid-cols-[1.8fr_1.2fr] gap-6 flex-1 min-h-0">
          <div className="flex flex-col gap-6 min-h-0">
            <LiveMap />
          </div>
          <div className="flex flex-col gap-6 min-h-0">
            <ControlCenter />
            <ShipmentsList />
          </div>
        </div>
      </main>
    </div>
  );
}

