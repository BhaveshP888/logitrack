import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TrackingTimeline from './TrackingTimeline.js';
import BookShipmentModal from './BookShipmentModal.js';
import Skeleton from './ui/Skeleton.js';
import EmptyState from './ui/EmptyState.js';

interface CustomerDashboardProps {
  onLogout: () => void;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  price: number;
  contentDescription: string;
  targetDispatchDate: string;
  originWarehouse: { name: string };
  destinationWarehouse: { name: string };
  checkpoints: { id: string; name: string; reached: boolean; orderIndex: number }[];
  createdAt: string;
}

interface Stats {
  totalSpend: number;
  totalShipments: number;
  activeShipments: number;
  spendChartData: { name: string; spend: number }[];
  recentShipments: Shipment[];
}

export default function CustomerDashboard({ onLogout }: CustomerDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTrackingShipment, setActiveTrackingShipment] = useState<Shipment | null>(null);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/stats`, { credentials: 'include' });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchAllShipments = async () => {
    setIsLoadingShipments(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/shipments`, { credentials: 'include' });
      if (res.ok) setAllShipments(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/warehouses`, { credentials: 'include' });
      if (res.ok) setWarehouses(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAllShipments();
    fetchWarehouses();
  }, []);

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    fetchStats();
    fetchAllShipments();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-main overflow-y-auto font-body">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
          <span className="font-display font-bold text-lg text-zinc-100 tracking-tight">
            LogiTrack <span className="text-zinc-500 font-medium">Customer Portal</span>
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Sign Out
        </button>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-10 flex flex-col gap-8">
        
        {/* Header Actions */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-100 mb-2">Welcome Back</h1>
            <p className="text-zinc-500 text-sm">Here is your shipping activity overview.</p>
          </div>
          <button 
            onClick={() => setShowBookingModal(true)}
            className="glass-button px-6 py-2.5 flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Book Shipment
          </button>
        </div>

        {/* Stats Row */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card border border-white/[0.06] bg-white/[0.01] p-6">
              <p className="text-zinc-500 text-xs font-medium mb-1">Total Spend</p>
              <h2 className="text-2xl font-bold text-zinc-100 font-display">₹{stats.totalSpend.toLocaleString()}</h2>
            </div>
            <div className="card border border-white/[0.06] bg-white/[0.01] p-6">
              <p className="text-zinc-500 text-xs font-medium mb-1">Total Shipments</p>
              <h2 className="text-2xl font-bold text-zinc-100 font-display">{stats.totalShipments}</h2>
            </div>
            <div className="card border border-white/[0.06] bg-white/[0.01] p-6">
              <p className="text-zinc-500 text-xs font-medium mb-1">Active Shipments</p>
              <h2 className="text-2xl font-bold text-brand-primary font-display">{stats.activeShipments}</h2>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 card border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col min-h-[300px]">
            <h3 className="font-display font-bold text-zinc-100 mb-6">Spend Over Time</h3>
            <div className="flex-1 min-h-[300px]">
              {isLoadingStats ? (
                <Skeleton className="h-[300px]" />
              ) : stats?.spendChartData && stats.spendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.spendChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="spend" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  title="No Spend Data" 
                  description="You haven't completed any shipments yet." 
                />
              )}
            </div>
          </div>

          {/* Recent Shipments List */}
          <div className="card border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col">
            <h3 className="font-display font-bold text-zinc-100 mb-4">Your Shipments</h3>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2 h-full">
              {isLoadingShipments ? (
                <Skeleton count={4} className="h-[88px]" />
              ) : allShipments.length > 0 ? (
                allShipments.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setActiveTrackingShipment(s)}
                    className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors flex flex-col gap-2 text-left outline-none focus:ring-2 focus:ring-brand-primary/50"
                    aria-label={`View details for shipment ${s.trackingNumber}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-mono text-zinc-400">{s.trackingNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        s.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' :
                        s.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-brand-primary/10 text-brand-primary'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-zinc-200">
                      {s.originWarehouse.name} → {s.destinationWarehouse.name}
                    </div>
                    <div className="text-xs text-zinc-500 flex justify-between w-full">
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      <span>₹{s.price}</span>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState 
                  title="No shipments found" 
                  description="Book your first shipment to see tracking details here." 
                />
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Extracted Booking Modal */}
      {showBookingModal && (
        <BookShipmentModal 
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
          warehouses={warehouses}
        />
      )}

      {/* Tracking Timeline Modal */}
      {activeTrackingShipment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-title"
        >
          <div className="w-full max-w-4xl card border border-white/[0.08] bg-bg-surface p-6 md:p-10 flex flex-col relative shadow-2xl">
            <button 
              onClick={() => setActiveTrackingShipment(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-zinc-500 hover:text-zinc-200 transition-colors"
              aria-label="Close tracking view"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            
            <div className="mb-8 md:mb-12 pr-8">
              <h2 id="tracking-title" className="font-display text-2xl font-bold text-zinc-100">Tracking Detail</h2>
              <p className="text-zinc-400 font-mono text-sm mt-1" aria-label="Tracking Number">{activeTrackingShipment.trackingNumber}</p>
            </div>

            <TrackingTimeline shipment={activeTrackingShipment} />
            
          </div>
        </div>
      )}

    </div>
  );
}
