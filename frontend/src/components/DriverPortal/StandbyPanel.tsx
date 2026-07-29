export default function StandbyPanel() {
  return (
    <div className="w-full flex flex-col gap-6" aria-label="Standby Dashboard">
      
      {/* Top Status Banner */}
      <div className="glass-panel w-full p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-1">Status: Available</h2>
          <p className="text-sm text-zinc-400">You are currently on standby awaiting dispatch.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-300">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <p className="text-xs text-zinc-500 mt-1">{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Main Structural Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Schedule/Manifest Placeholder */}
        <div className="card p-6 min-h-[300px] flex flex-col">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Today's Schedule</h3>
          <div className="flex-1 border border-dashed border-border-color rounded-xl flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-sm font-medium text-zinc-400 mb-1">No Active Assignments</p>
              <p className="text-xs text-zinc-500">New routes will appear here automatically.</p>
            </div>
          </div>
        </div>

        {/* Dispatch Notes Placeholder */}
        <div className="card p-6 min-h-[300px] flex flex-col">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Dispatch Notes</h3>
          <div className="flex-1 border border-border-color bg-black/10 rounded-xl p-4">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Weather Advisory</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Expect light rain on outbound routes heading north today. Drive safely.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">Vehicle Maintenance</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Fleet inspections completed. Ensure pre-trip checks are logged.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
