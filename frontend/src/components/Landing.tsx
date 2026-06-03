interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Landing({ onLogin, onRegister }: LandingProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-screen bg-bg-main overflow-hidden font-body text-zinc-100">
      
      {/* Background ambient */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-brand-primary/8 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6">
        
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-semibold uppercase tracking-[0.15em]">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
          System Active
        </div>

        {/* Hero */}
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
          Logistics<br/>
          <span className="text-brand-primary">Command Center</span>
        </h1>

        <p className="text-base text-zinc-500 mb-10 max-w-md leading-relaxed">
          Real-time tracking, intelligent fleet management, and supply chain operations in one unified platform.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={onLogin}
            className="px-8 py-3.5 rounded-xl bg-brand-primary text-zinc-950 font-semibold text-sm transition-all duration-200 hover:bg-brand-accent active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Sign In
          </button>
          
          <button 
            onClick={onRegister}
            className="px-8 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-semibold text-sm transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Register as Driver
          </button>
        </div>
      </div>
    </div>
  );
}
