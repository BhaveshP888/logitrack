import { useState } from 'react';

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
  onTrack?: (trackingNumber: string) => void;
}

export default function Landing({ onLogin, onRegister, onTrack }: LandingProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'driver' | 'customer'>('admin');
  const [heroTrackingInput, setHeroTrackingInput] = useState('TRK-2026-8801');

  const handleHeroTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroTrackingInput.trim() && onTrack) {
      onTrack(heroTrackingInput.trim());
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-y-auto overflow-x-hidden w-full bg-[#0a0a0c] font-body text-zinc-100 selection:bg-brand-primary/30">
      
      {/* Structural Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#0a0a0c]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-brand-primary flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className="font-display font-bold text-base tracking-tight text-zinc-100">LogiTrack</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#dashboard-preview" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors duration-200">System Overview</a>
          <a href="#capabilities" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors duration-200">Capabilities</a>
          <a href="#workflows" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors duration-200">Workflows</a>
          <a href="#api" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors duration-200">API Reference</a>
        </nav>
        
        <div>
          <button 
            onClick={onLogin}
            className="bg-brand-primary hover:bg-brand-accent text-zinc-950 text-xs md:text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer shadow-[0_2px_8px_rgba(45,212,191,0.15)]"
          >
            Sign In / Register
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 gap-20">
        
        {/* Hero Section - Left Aligned, Professional & Meticulously Minimal */}
        <section className="flex flex-col gap-6 items-start border-b border-white/[0.05] pb-16 max-w-4xl">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.05] max-w-3xl">
            Logistics infrastructure for modern supply chains.
          </h1>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-2xl font-light">
            Coordinate vehicle routing, dispatch flows, and checkpoint milestones through a structured database. Connect telemetry feeds over secure WebSockets.
          </p>

          {/* Quick Tracking Search in Hero */}
          <form onSubmit={handleHeroTrack} className="w-full max-w-md flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-white/10 shadow-lg mt-2">
            <input 
              type="text" 
              placeholder="Track consignment # (e.g. TRK-2026-8801)" 
              value={heroTrackingInput} 
              onChange={e => setHeroTrackingInput(e.target.value)} 
              className="flex-1 bg-transparent px-3 py-2 text-xs font-mono uppercase text-zinc-100 placeholder:normal-case placeholder:text-zinc-500 focus:outline-none" 
            />
            <button type="submit" className="bg-brand-primary hover:bg-brand-accent text-zinc-950 text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0">
              Track Freight
            </button>
          </form>

          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              onClick={onRegister}
              className="bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer"
            >
              Initialize Terminal
            </button>
            <a 
              href="#dashboard-preview"
              className="border border-white/10 hover:border-white/20 text-zinc-300 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-200 text-center"
            >
              View System Preview
            </a>
          </div>
        </section>

        {/* Section: System Preview Dashboard Mockup */}
        <section id="dashboard-preview" className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Operational Interface</h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              An overview of active dispatch streams, routing checkpoints, and event logs inside the LogiTrack console.
            </p>
          </div>

          <div className="border border-white/[0.06] bg-[#0c0c0f] rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span>
                <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">Active Dispatch Streams</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">System Status: Nominal</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Shipment Queue */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Pending & Active manifests</span>
                
                <div className="flex flex-col gap-2">
                  <div className="border border-white/[0.04] bg-white/[0.01] p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-200">TRK-SEED-001</span>
                      <span className="text-zinc-500 text-[10px]">Mumbai Hub → Nagpur Hub</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-semibold text-[10px] uppercase">Pending Dispatch</span>
                  </div>

                  <div className="border border-white/[0.04] bg-white/[0.01] p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-200">TRK-PAST-001</span>
                      <span className="text-zinc-500 text-[10px]">Mumbai Hub → Pune Hub</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] uppercase">Delivered</span>
                  </div>

                  <div className="border border-white/[0.04] bg-white/[0.01] p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-zinc-200">TRK-ACTIVE-89</span>
                      <span className="text-zinc-500 text-[10px]">Pune Depot → Nashik Hub</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 font-semibold text-[10px] uppercase">En Route</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Event Stream */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Live System Logs</span>
                
                <div className="bg-[#08080a] border border-white/[0.04] rounded-xl p-4 h-[170px] overflow-y-auto flex flex-col gap-2.5 font-mono text-[10px] text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="text-brand-primary font-semibold">14:02:41</span>
                    <span className="text-zinc-300">Shipment seed initialization requested</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-primary font-semibold">14:02:43</span>
                    <span className="text-zinc-300">Driver Rajesh Kumar assigned to TRK-SEED-001</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-primary font-semibold">14:03:01</span>
                    <span className="text-zinc-500">Prisma database transaction completed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-primary font-semibold">14:04:12</span>
                    <span className="text-zinc-500">Telemetry listener connected to port 3001</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Capabilities */}
        <section id="capabilities" className="flex flex-col gap-8">
          <div>
            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.2em] block mb-2">Capabilities</span>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Designed for operational precision</h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              A highly functional logistics module built with a flat, clean interface for administrators, drivers, and clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border border-white/[0.05] bg-white/[0.01] p-6 rounded-xl flex flex-col gap-3">
              <span className="font-display font-semibold text-zinc-100 text-sm">Dynamic Dispatch Routing</span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Assign drivers to shipments, create scheduled departure matrices, and define regional checkpoint lists.
              </p>
            </div>
            
            <div className="border border-white/[0.05] bg-white/[0.01] p-6 rounded-xl flex flex-col gap-3">
              <span className="font-display font-semibold text-zinc-100 text-sm">Live Telemetry Sync</span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Stream GPS coordinates and update manifest milestones dynamically using raw WebSocket connections.
              </p>
            </div>

            <div className="border border-white/[0.05] bg-white/[0.01] p-6 rounded-xl flex flex-col gap-3">
              <span className="font-display font-semibold text-zinc-100 text-sm">Role-Based Workflows</span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Enforced workflows partitioning tools between control center administrators, dispatch drivers, and clients.
              </p>
            </div>

            <div className="border border-white/[0.05] bg-white/[0.01] p-6 rounded-xl flex flex-col gap-3">
              <span className="font-display font-semibold text-zinc-100 text-sm">Restructured History Logs</span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Chronological ledger logs showing arrival dates, transit delays, and completed cargo checkpoints.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Workflows Tour */}
        <section id="workflows" className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.2em] block mb-2">Workflows</span>
              <h2 className="font-display text-2xl font-bold text-white">Three workspaces, synchronized state</h2>
            </div>

            {/* Flat switcher tab */}
            <div className="flex border border-white/[0.06] bg-white/[0.02] rounded-lg p-1 self-start">
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer ${activeTab === 'admin' ? 'bg-brand-primary text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Administrator
              </button>
              <button 
                onClick={() => setActiveTab('driver')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer ${activeTab === 'driver' ? 'bg-brand-primary text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Driver
              </button>
              <button 
                onClick={() => setActiveTab('customer')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer ${activeTab === 'customer' ? 'bg-brand-primary text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                Customer
              </button>
            </div>
          </div>

          <div className="border border-white/[0.05] bg-[#0c0c0f] rounded-2xl p-8 min-h-[220px] flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
            <div className="flex flex-col gap-3 max-w-xl">
              <span className="text-[10px] font-mono text-brand-primary uppercase tracking-widest font-bold">
                {activeTab === 'admin' ? 'Control center console' : activeTab === 'driver' ? 'Driver terminal portal' : 'Timeline search interface'}
              </span>
              
              {activeTab === 'admin' && (
                <>
                  <h3 className="font-display text-xl font-bold text-white">Assign routes, monitor telemetry</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Administrators allocate drivers to active containers, schedule dispatch target dates, mark checkpoints reached, and track active statuses from the dashboard.
                  </p>
                </>
              )}

              {activeTab === 'driver' && (
                <>
                  <h3 className="font-display text-xl font-bold text-white">Live coordinate tracking manifest</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Drivers login to view assigned manifests. Toggling the live tracker updates coordinates, marks milestones reached/absent, and processes delivery.
                  </p>
                </>
              )}

              {activeTab === 'customer' && (
                <>
                  <h3 className="font-display text-xl font-bold text-white">Check progress milestones</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Customers search active tracking codes to see milestone timelines, check regional depot locations, and book new freight shipments directly.
                  </p>
                </>
              )}
            </div>

            <div className="w-full md:w-auto shrink-0 bg-[#08080a] border border-white/[0.04] p-5 rounded-xl flex flex-col gap-2 min-w-[260px] font-mono text-xs text-zinc-400">
              <span className="text-[10px] text-zinc-500 uppercase">Context Info</span>
              {activeTab === 'admin' && (
                <>
                  <div className="flex justify-between"><span>User Role</span><span className="text-white font-semibold">ADMIN</span></div>
                  <div className="flex justify-between"><span>Allowed Actions</span><span className="text-zinc-200">All Operations</span></div>
                  <div className="flex justify-between"><span>Dashboard Mode</span><span className="text-zinc-200">Management</span></div>
                </>
              )}
              {activeTab === 'driver' && (
                <>
                  <div className="flex justify-between"><span>User Role</span><span className="text-white font-semibold">DRIVER</span></div>
                  <div className="flex justify-between"><span>Assigned Container</span><span className="text-zinc-200">TRK-SEED-001</span></div>
                  <div className="flex justify-between"><span>Tracker Status</span><span className="text-emerald-400 font-medium">Ready</span></div>
                </>
              )}
              {activeTab === 'customer' && (
                <>
                  <div className="flex justify-between"><span>User Role</span><span className="text-white font-semibold">CUSTOMER</span></div>
                  <div className="flex justify-between"><span>Booking Action</span><span className="text-zinc-200">Allowed</span></div>
                  <div className="flex justify-between"><span>Search Index</span><span className="text-zinc-200">Active manifests</span></div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Section: Developer Integration API */}
        <section id="api" className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/[0.05] pt-16">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-[0.2em] block">Developer Integration</span>
            <h2 className="font-display text-2xl font-bold text-white">Full API capabilities</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Integrate LogiTrack directly with other ERP networks. Fetch metrics, post shipments, update dispatch logs, and retrieve timeline checkpoints programmatically.
            </p>
          </div>
          
          <div className="lg:col-span-7 bg-[#08080a] border border-white/[0.05] rounded-xl p-5 font-mono text-[11px] text-zinc-300 relative overflow-hidden">
            <div className="absolute top-2 right-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
            </div>
            
            <div className="border-b border-white/[0.04] pb-2 mb-3 text-[10px] text-zinc-500 font-bold tracking-wider uppercase">
              POST /api/shipments
            </div>
            
            <pre className="overflow-x-auto leading-relaxed select-all">
{`Authorization: Bearer <jwt_access_token>
Content-Type: application/json

{
  "originId": "mumbai_hub_01",
  "destinationId": "nagpur_hub_03",
  "driverId": "drv_rajesh_kumar",
  "targetDispatchDate": "2026-06-30T16:00:00.000Z"
}`}
            </pre>
          </div>
        </section>

      </main>

      {/* Structural Footer */}
      <footer className="border-t border-white/[0.05] bg-[#08080a]/90 px-6 py-8 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4 mt-16">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="font-semibold text-zinc-400 font-display">LogiTrack Platform</span>
        </div>
        
        <span className="font-medium text-zinc-600">© {new Date().getFullYear()} LogiTrack. All systems operational.</span>
        
        <div className="flex gap-6 uppercase font-bold tracking-wider text-[10px] text-zinc-500">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-brand-primary transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Status
          </a>
        </div>
      </footer>
    </div>
  );
}
