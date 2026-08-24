import { useState, useEffect } from 'react';
import { API_BASE } from '../config.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TrackingTimeline from './TrackingTimeline.js';
import BookShipmentModal from './BookShipmentModal.js';
import BillOfLadingModal from './BillOfLadingModal.js';
import Skeleton from './ui/Skeleton.js';
import EmptyState from './ui/EmptyState.js';
import { Shipment } from '../store/shipmentsSlice.js';

interface CustomerDashboardProps {
  onLogout: () => void;
}

interface Stats {
  totalSpend: number;
  totalShipments: number;
  activeShipments: number;
  spendChartData: { name: string; spend: number }[];
  recentShipments: Shipment[];
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  currency: string;
  status: string;
  issuedAt: string;
  paidAt?: string | null;
  shipment: {
    trackingNumber: string;
    originWarehouse: { name: string };
    destinationWarehouse: { name: string };
    actualDeliveryDate?: string | null;
  };
}

export default function CustomerDashboard({ onLogout }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTrackingShipment, setActiveTrackingShipment] = useState<Shipment | null>(null);
  const [activeBolShipment, setActiveBolShipment] = useState<Shipment | null>(null);

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

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/invoices`, { credentials: 'include' });
      if (res.ok) setInvoices(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInvoices(false);
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
    fetchInvoices();
    fetchWarehouses();
  }, []);

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    fetchStats();
    fetchAllShipments();
    fetchInvoices();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-200 overflow-y-auto font-body">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/10 bg-[#0e0e11] shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-zinc-950 text-sm">
            LT
          </div>
          <span className="font-display font-bold text-base text-zinc-100 tracking-tight">
            LOGITRACK <span className="text-zinc-500 font-medium">Shipper Portal</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'bg-brand-primary text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Shipments & Freight
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'invoices' ? 'bg-brand-primary text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Billing & Invoices ({invoices.length})
            </button>
          </div>

          <button
            onClick={onLogout}
            className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 flex flex-col gap-6">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-100">Enterprise Logistics Portal</h1>
            <p className="text-zinc-400 text-xs mt-1">Manage line-haul consignments, track live milestones, and download e-waybills.</p>
          </div>
          <button 
            onClick={() => setShowBookingModal(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-brand-primary/20 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Book New Consignment
          </button>
        </div>

        {/* Stats Row */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-[#0e0e11]">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Freight Spend</p>
              <h2 className="text-2xl font-bold text-zinc-100 font-mono">₹{stats.totalSpend.toLocaleString()}</h2>
            </div>
            <div className="p-5 rounded-2xl border border-white/10 bg-[#0e0e11]">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Consignments Booked</p>
              <h2 className="text-2xl font-bold text-zinc-100 font-mono">{stats.totalShipments}</h2>
            </div>
            <div className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5">
              <p className="text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-1">Active Line-Hauls In Transit</p>
              <h2 className="text-2xl font-bold text-sky-400 font-mono">{stats.activeShipments}</h2>
            </div>
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Spend Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-[#0e0e11] flex flex-col min-h-[300px]">
              <h3 className="font-display font-bold text-sm text-zinc-100 mb-4">Monthly Freight Spend (INR)</h3>
              <div className="flex-1 min-h-[260px]">
                {isLoadingStats ? (
                  <Skeleton className="h-[260px]" />
                ) : stats?.spendChartData && stats.spendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.spendChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        contentStyle={{ backgroundColor: '#141419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                      <Bar dataKey="spend" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState 
                    title="No Spend Data" 
                    description="Complete your first shipment to see spending analytics." 
                  />
                )}
              </div>
            </div>

            {/* Consignments List */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0e0e11] flex flex-col">
              <h3 className="font-display font-bold text-sm text-zinc-100 mb-4">Recent Consignments</h3>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-1 h-full">
                {isLoadingShipments ? (
                  <Skeleton count={4} className="h-[88px]" />
                ) : allShipments.length > 0 ? (
                  allShipments.map((s) => (
                    <div 
                      key={s.id} 
                      className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-mono font-bold text-brand-primary">{s.trackingNumber}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono uppercase font-bold ${
                          s.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' :
                          s.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-sky-500/10 text-sky-400'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-zinc-200">
                        {s.originWarehouse.name.split(' ')[0]} → {s.destinationWarehouse.name.split(' ')[0]}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="font-mono">₹{(s.price || s.rateAmount || 0).toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveBolShipment(s)}
                            className="text-[10px] font-semibold text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            e-BOL
                          </button>
                          <button
                            onClick={() => setActiveTrackingShipment(s)}
                            className="text-[10px] font-bold text-zinc-950 px-2 py-0.5 rounded bg-brand-primary hover:bg-brand-accent transition-colors cursor-pointer"
                          >
                            Track
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    title="No consignments found" 
                    description="Book a line-haul cargo shipment to begin tracking." 
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Billing & Invoices Ledger Tab */
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0e0e11] space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-100">Commercial Freight Invoices & Tax Receipts</h3>
              <p className="text-xs text-zinc-400">Download itemized billing receipts for completed line-haul logistics</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 font-body border-collapse">
                <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Consignment Reference</th>
                    <th className="px-4 py-3">Route Corridor</th>
                    <th className="px-4 py-3 text-right">Base Amount</th>
                    <th className="px-4 py-3 text-right">GST (18%)</th>
                    <th className="px-4 py-3 text-right">Total (INR)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoadingInvoices ? (
                    <tr>
                      <td colSpan={8} className="p-4">
                        <Skeleton count={3} className="h-10 my-1" />
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                        No issued invoices yet. Invoices are generated upon successful delivery verification.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-brand-primary">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3.5 font-mono text-zinc-200">{inv.shipment.trackingNumber}</td>
                        <td className="px-4 py-3.5 text-zinc-400">
                          {inv.shipment.originWarehouse.name.split(' ')[0]} → {inv.shipment.destinationWarehouse.name.split(' ')[0]}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-300">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-400">₹{inv.taxAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-zinc-100">
                          ₹{(inv.amount + inv.taxAmount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500 font-mono">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookShipmentModal 
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
          warehouses={warehouses}
        />
      )}

      {/* Tracking Modal */}
      {activeTrackingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl p-6 sm:p-8 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setActiveTrackingShipment(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <TrackingTimeline shipment={activeTrackingShipment as any} />
          </div>
        </div>
      )}

      {/* Bill of Lading Modal */}
      {activeBolShipment && (
        <BillOfLadingModal
          shipment={activeBolShipment}
          onClose={() => setActiveBolShipment(null)}
        />
      )}

    </div>
  );
}
