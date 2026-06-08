interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Landing({ onLogin, onRegister }: LandingProps) {
  return (
    <div className="relative flex flex-col min-h-screen w-screen bg-bg-main overflow-hidden font-body text-zinc-100">
      
      {/* Background ambient */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 w-full">
        <div className="flex items-center gap-3">
          {/* Logo Mark */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.2)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111113" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">LogiTrack</span>
        </div>
        
        <nav className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">About us</a>
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">Solutions</a>
            <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">Pricing</a>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 pl-4 md:pl-8 md:border-l border-white/10">
            <button 
              onClick={onLogin}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] active:scale-95 transition-all"
            >
              Login
            </button>
            <button 
              onClick={onRegister}
              className="px-6 py-2.5 rounded-xl bg-brand-primary text-zinc-950 text-sm font-semibold hover:bg-brand-accent active:scale-95 transition-all shadow-[0_0_15px_rgba(45,212,191,0.25)]"
            >
              Register
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div className="mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-bold uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(45,212,191,0.1)] backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
          Global Infrastructure Active
        </div>

        {/* Hero Typography */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.05] max-w-5xl">
          Logistics<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
            Command Center
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-16 font-light">
          Orchestrate complex supply chains, monitor real-time telemetrics, and optimize routing across your global fleet with military-grade precision.
        </p>

        {/* Abstract Visual Element (Replacing buttons) */}
        <div className="relative w-full max-w-4xl aspect-[4/1] flex items-center justify-center opacity-80 mix-blend-screen">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.08)_0%,transparent_70%)]"></div>
          
          <div className="relative flex items-center justify-center w-full h-full">
             {/* Core Node */}
             <div className="absolute w-32 h-32 border border-brand-primary/20 rounded-full flex items-center justify-center animate-[spin_12s_linear_infinite]">
               <div className="w-full h-full border-t-2 border-brand-primary rounded-full"></div>
             </div>
             <div className="absolute w-20 h-20 border border-brand-accent/20 rounded-full flex items-center justify-center animate-[spin_8s_linear_infinite_reverse]">
                <div className="w-full h-full border-b-2 border-brand-accent rounded-full"></div>
             </div>
             
             {/* Center Pulse */}
             <div className="relative">
               <div className="w-4 h-4 bg-brand-primary rounded-full shadow-[0_0_20px_rgba(45,212,191,1)] relative z-10"></div>
               <div className="absolute inset-0 bg-brand-primary rounded-full animate-ping opacity-75"></div>
             </div>
             
             {/* Holographic connection lines */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" viewBox="0 0 1000 250">
               <path d="M500,125 L250,60 L300,190 Z" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
               <path d="M500,125 L750,90 L680,200 Z" fill="none" stroke="var(--color-brand-accent)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
               <path d="M250,60 L100,125 L300,190" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1" strokeDasharray="2 8" opacity="0.3" />
               <path d="M750,90 L900,150 L680,200" fill="none" stroke="var(--color-brand-accent)" strokeWidth="1" strokeDasharray="2 8" opacity="0.3" />
               
               {/* Satellite nodes */}
               <circle cx="250" cy="60" r="3" fill="var(--color-brand-primary)" />
               <circle cx="300" cy="190" r="2" fill="var(--color-brand-accent)" />
               <circle cx="750" cy="90" r="3" fill="var(--color-brand-primary)" />
               <circle cx="680" cy="200" r="2" fill="var(--color-brand-accent)" />
               <circle cx="100" cy="125" r="2" fill="var(--color-brand-primary)" opacity="0.5" />
               <circle cx="900" cy="150" r="2" fill="var(--color-brand-accent)" opacity="0.5" />
             </svg>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-8 mt-auto border-t border-white/[0.04] bg-bg-main/50 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4 md:mb-0 opacity-60">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="font-display font-semibold text-xs uppercase tracking-widest text-zinc-400">LogiTrack</span>
        </div>
        
        <p className="text-zinc-600 text-xs mb-4 md:mb-0">
          © {new Date().getFullYear()} LogiTrack Infrastructure. All rights reserved.
        </p>
        
        <div className="flex gap-8 text-xs font-medium text-zinc-500">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-brand-primary transition-colors flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
            System Status
          </a>
        </div>
      </footer>
    </div>
  );
}
