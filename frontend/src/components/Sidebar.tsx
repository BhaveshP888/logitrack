export default function Sidebar() {
  return (
    <aside className="w-[280px] bg-bg-sidebar border-r border-border-color flex flex-col p-8 z-10 gap-8">
      <div className="font-display text-2xl font-bold text-slate-100 flex items-center gap-3 tracking-tight">
        <div className="w-7 h-7 bg-gradient-to-br from-brand-primary to-brand-accent rounded-lg shadow-[0_4px_12px_rgba(59,130,246,0.25)]" />
        <span>LogiTrack</span>
      </div>
      <nav className="flex flex-col gap-2">
        <div className="p-3 px-4 rounded-lg text-brand-primary font-semibold text-sm cursor-pointer transition-all duration-150 flex items-center gap-3 bg-brand-primary/8 border-l-3 border-brand-primary rounded-l-none">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          Dashboard
        </div>
        <div className="p-3 px-4 rounded-lg text-slate-400 font-medium text-sm cursor-not-allowed opacity-40 flex items-center gap-3">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          Analytics
        </div>
        <div className="p-3 px-4 rounded-lg text-slate-400 font-medium text-sm cursor-not-allowed opacity-40 flex items-center gap-3">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Fleet Management
        </div>
      </nav>
    </aside>
  );
}
