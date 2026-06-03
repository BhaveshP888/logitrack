import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks.js';
import { fetchShipments } from './store/shipmentsSlice.js';
import { fetchDrivers } from './store/driversSlice.js';
import { fetchWarehouses } from './store/warehousesSlice.js';
import { checkSession, logoutUser } from './store/authSlice.js';

import Sidebar, { ViewMode } from './components/Sidebar.js';
import DashboardView from './components/DashboardView.js';
import AnalyticsView from './components/AnalyticsView.js';
import FleetView from './components/FleetView.js';
import TrackingView from './components/TrackingView.js';
import Login from './components/Login.js';
import Landing from './components/Landing.js';
import DriverPortal from './components/DriverPortal.js';

export default function App() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    dispatch(logoutUser());
  };

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
      <div className="flex h-screen w-screen items-center justify-center bg-bg-main text-zinc-500 font-body">
        Syncing logistics feed...
      </div>
    );
  }

  if (!user) {
    if (authView === 'landing') {
      return <Landing onLogin={() => setAuthView('login')} onRegister={() => setAuthView('register')} />;
    }
    return <Login initialIsRegister={authView === 'register'} onBack={() => setAuthView('landing')} />;
  }

  if (user.role === 'DRIVER') {
    return <DriverPortal />;
  }

  return (
    <div className="flex h-screen w-screen bg-transparent relative z-0">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-end px-8 pt-6 pb-0 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-zinc-500 hover:text-status-danger hover:bg-status-danger/8 border border-transparent hover:border-status-danger/15 transition-all duration-150 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
        <main className="flex-1 flex flex-col px-8 lg:px-10 pt-6 pb-8 gap-8 overflow-y-auto custom-scrollbar min-w-0">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'fleet' && <FleetView />}
          {activeView === 'tracking' && <TrackingView />}
        </main>
      </div>
    </div>
  );
}

