import { useEffect, useState } from 'react';

interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Landing({ onLogin, onRegister }: LandingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const transitionConfig = "transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]";
  const entryAnimation = mounted ? "translate-y-0 opacity-100 blur-0" : "translate-y-16 opacity-0 blur-md";

  return (
    <div className="relative flex flex-col h-[100dvh] w-screen bg-[#050505] overflow-y-auto overflow-x-hidden font-body text-zinc-100 selection:bg-brand-primary/30">
      
      {/* Vibe Texture: Ethereal Mesh Gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-[0.03] pointer-events-none z-50"></div>

      {/* The "Fluid Island" Nav */}
      <header className={`relative z-50 mt-4 md:mt-6 mx-auto w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] max-w-5xl rounded-full border border-white/10 bg-white/5 backdrop-blur-2xl px-3 py-3 md:px-6 md:py-4 flex items-center justify-between ${transitionConfig} ${mounted ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"}`}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className="font-display font-semibold text-base md:text-lg tracking-tight text-zinc-100">LogiTrack</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300">Platform</a>
          <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300">Solutions</a>
          <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300">Pricing</a>
        </nav>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={onLogin}
            className="hidden md:flex px-4 py-2 rounded-full text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300"
          >
            Sign In
          </button>
          <button 
            onClick={onRegister}
            className="group py-1 pl-3 pr-1 md:pl-4 rounded-full bg-brand-primary text-zinc-950 text-sm font-semibold hover:bg-brand-accent active:scale-[0.98] transition-all duration-300 flex items-center gap-1.5 md:gap-2 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
          >
            <span>Register</span>
            <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px] group-hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-32 md:py-40">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-5xl">
          {/* Eyebrow Tag */}
          <div className={`mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-[10px] uppercase tracking-[0.2em] font-medium backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.15)] delay-100 ${transitionConfig} ${entryAnimation}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
            Global Infrastructure Ready
          </div>

          <h1 className={`font-display text-5xl md:text-7xl lg:text-[7rem] font-bold tracking-tighter leading-[0.95] mb-8 delay-200 ${transitionConfig} ${entryAnimation}`}>
            Next-Gen<br/>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-primary via-white to-brand-accent pr-2 pb-2">
              Logistics Platform
            </span>
          </h1>

          <p className={`text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-12 font-light delay-300 ${transitionConfig} ${entryAnimation}`}>
            Book shipments instantly, track your cargo in real-time, and let our intelligent command center orchestrate the perfect route across your global fleet.
          </p>

          {/* Nested CTA "Button-in-Button" */}
          <button 
            onClick={onRegister}
            className={`group flex items-center gap-4 bg-zinc-100 text-[#050505] pl-8 pr-2 py-2 rounded-full text-lg font-bold active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white shadow-[0_0_30px_rgba(255,255,255,0.1)] delay-400 ${transitionConfig} ${entryAnimation}`}
          >
            Start Shipping
            <div className="w-12 h-12 rounded-full bg-[#050505]/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          </button>
        </div>

        {/* The Asymmetrical Bento Grid */}
        <div className={`w-full mt-32 md:mt-48 grid grid-cols-1 md:grid-cols-12 gap-6 delay-500 ${transitionConfig} ${entryAnimation}`}>
          
          {/* Card 1: Large Feature (Double-Bezel) */}
          <div className="md:col-span-8 group p-2 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01]">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#0A0A0B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] h-[400px] w-full p-8 md:p-12 relative overflow-hidden flex flex-col justify-end">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 blur-[120px] pointer-events-none group-hover:opacity-100 opacity-40 transition-opacity duration-700"></div>
              
              {/* Complex Radar Graphic */}
              <div className="absolute top-[-10%] right-[-5%] w-[350px] h-[350px] pointer-events-none flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <div className="absolute inset-0 border border-brand-primary/10 rounded-full"></div>
                <div className="absolute inset-8 border border-brand-primary/20 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                  <div className="w-full h-full border-t-2 border-brand-primary/50 rounded-full"></div>
                </div>
                <div className="absolute inset-16 border border-brand-accent/20 rounded-full flex items-center justify-center animate-[spin_12s_linear_infinite_reverse]">
                  <div className="w-full h-full border-b-2 border-brand-accent/40 rounded-full"></div>
                </div>
                <div className="absolute inset-24 border border-brand-primary/10 rounded-full"></div>
                {/* Center Node */}
                <div className="relative">
                  <div className="w-3 h-3 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(45,212,191,1)] z-10 relative"></div>
                  <div className="absolute inset-0 bg-brand-primary rounded-full animate-ping opacity-60"></div>
                </div>
              </div>
              
              <div className="relative z-10 max-w-md mt-auto">
                <div className="mb-4 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 backdrop-blur-md">
                  Core Engine
                </div>
                <h3 className="font-display text-3xl font-bold mb-3 text-zinc-100">Real-Time Orchestration</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Monitor fleet telemetrics and reroute shipments dynamically. Our engine computes the optimal path instantly, ensuring your cargo arrives exactly when expected.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Tall Vertical */}
          <div className="md:col-span-4 group p-2 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01]">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#0A0A0B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] h-[400px] w-full p-8 md:p-10 relative overflow-hidden flex flex-col">
              <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-brand-accent/10 blur-[90px] pointer-events-none group-hover:opacity-100 opacity-40 transition-opacity duration-700"></div>
              
              <div className="flex-1 flex items-center justify-center relative mt-4">
                 <div className="relative w-32 h-32">
                   <div className="absolute inset-0 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.01]"></div>
                   <div className="absolute inset-4 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_0_30px_rgba(94,234,212,0.05)]">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(94,234,212,0.5)]">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="3.29 7 12 12 20.71 7"></polyline>
                        <line x1="12" y1="22" x2="12" y2="12"></line>
                      </svg>
                   </div>
                 </div>
              </div>

              <div className="relative z-10 mt-auto">
                <div className="mb-4 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 backdrop-blur-md">
                  Network
                </div>
                <h3 className="font-display text-2xl font-bold mb-3 text-zinc-100">Global Coverage</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Seamlessly dispatch across international borders with localized compliance built right in.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* High-End Footer */}
      <footer className="relative z-20 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-10 border-t border-white/5 bg-[#0A0A0B]/80 backdrop-blur-3xl mt-24">
        <div className="flex items-center gap-3 mb-6 md:mb-0 opacity-80">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="font-display font-bold text-sm uppercase tracking-[0.15em] text-zinc-300">LogiTrack Base</span>
        </div>
        
        <p className="text-zinc-600 text-xs mb-6 md:mb-0 font-medium">
          © {new Date().getFullYear()} LogiTrack Infrastructure. All systems nominal.
        </p>
        
        <div className="flex gap-8 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-brand-primary transition-colors flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            System Status
          </a>
        </div>
      </footer>
    </div>
  );
}
