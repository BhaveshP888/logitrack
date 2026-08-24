import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks.js';
import { fetchShipments } from './store/shipmentsSlice.js';
import { fetchDrivers } from './store/driversSlice.js';
import { fetchWarehouses } from './store/warehousesSlice.js';
import { fetchVehicles } from './store/vehiclesSlice.js';
import { checkSession } from './store/authSlice.js';

import Sidebar, { ViewMode } from './components/Sidebar.js';
import DashboardView from './components/DashboardView.js';
import AnalyticsView from './components/AnalyticsView.js';
import FleetView from './components/FleetView.js';
import TrackingView from './components/TrackingView.js';
import Login from './components/Login.js';
import Landing from './components/Landing.js';

export default function App() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      // Connect to Socket server
      dispatch({ type: 'socket/connect' });

      // Load initial lists
      dispatch(fetchShipments());
      dispatch(fetchDrivers());
      dispatch(fetchWarehouses());
      dispatch(fetchVehicles());
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-zinc-500 font-body">
        Syncing logistics feed...
      </div>
    );
  }

  // Unauthenticated: Landing & Login
  if (!user) {
    if (authView === 'landing') {
      return (
        <Landing
          onLogin={() => setAuthView('login')}
          onRegister={() => setAuthView('register')}
        />
      );
    }
    return <Login initialIsRegister={authView === 'register'} onBack={() => setAuthView('landing')} />;
  }

  // Single Unified Logistics Command Console
  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-200 relative z-0 font-body">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex-1 flex flex-col h-full min-w-0">
        <main className="flex-1 flex flex-col px-6 lg:px-8 pt-6 pb-6 gap-6 overflow-y-auto custom-scrollbar min-w-0">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'fleet' && <FleetView />}
          {activeView === 'tracking' && <TrackingView />}
        </main>
      </div>
    </div>
  );
}
