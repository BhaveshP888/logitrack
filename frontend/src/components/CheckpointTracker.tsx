import { useAppSelector } from '../store/hooks.js';
import { Shipment } from '../store/shipmentsSlice.js';

export default function CheckpointTracker() {
  const selectedShipmentId = useAppSelector((state) => state.shipments.selectedId);
  const shipments = useAppSelector((state) => state.shipments.items);
  
  const shipment = shipments.find(s => s.id === selectedShipmentId) as Shipment | undefined;

  if (!shipment) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-surface border border-border-color rounded-xl h-full shadow-inner font-body">
        <div className="text-zinc-500 font-semibold flex flex-col items-center gap-3">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          Select a shipment to track
        </div>
      </div>
    );
  }

  // Determine current active node index for styling
  // Origin is index 0. Checkpoints are 1 to N. Destination is N + 1.
  let activeIndex = 0;
  if (shipment.status === 'EN_ROUTE' || shipment.status === 'DELAYED' || shipment.status === 'DELIVERED') {
    activeIndex = 1; // start at first checkpoint
    for (const cp of shipment.checkpoints) {
      if (cp.reached) {
        activeIndex++;
      } else {
        break;
      }
    }
  }

  const isDelayed = shipment.status === 'DELAYED';

  // Helper to build the nodes list: Origin -> Checkpoints -> Destination
  const nodes = [
    { name: shipment.originWarehouse.name, isReached: activeIndex > 0, isActive: activeIndex === 0, type: 'origin' },
    ...shipment.checkpoints.map((cp, idx) => ({
      name: cp.name,
      isReached: cp.reached,
      isActive: activeIndex === idx + 1,
      type: 'checkpoint'
    })),
    { name: shipment.destinationWarehouse.name, isReached: shipment.status === 'DELIVERED', isActive: activeIndex === shipment.checkpoints.length + 1 && shipment.status !== 'DELIVERED', type: 'destination' }
  ];

  return (
    <div className="flex-1 glass-panel overflow-hidden flex flex-col relative h-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent pointer-events-none z-0"></div>
      
      <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl z-10 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-[0.2em] block mb-1">Live Telemetry</span>
          <h2 className="text-2xl font-display font-black text-white tracking-wide">{shipment.trackingNumber}</h2>
        </div>
        <div className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
          shipment.status === 'DELAYED' ? 'bg-status-danger/10 text-status-danger border border-status-danger/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse' :
          shipment.status === 'EN_ROUTE' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/30 shadow-[0_0_15px_rgba(14,165,233,0.3)]' :
          shipment.status === 'DELIVERED' ? 'bg-status-success/10 text-status-success border border-status-success/30' :
          'bg-zinc-800/50 text-zinc-400 border border-zinc-700'
        }`}>
          {shipment.status}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-start justify-start z-10 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col relative w-full mt-2">
          {nodes.map((node, idx) => {
            const isLast = idx === nodes.length - 1;
            
            // Visual styles based on state
            let dotColor = 'bg-zinc-900 border-zinc-700';
            let textColor = 'text-zinc-500';
            let lineClass = 'bg-zinc-800';

            if (node.isReached) {
              dotColor = 'bg-brand-accent border-brand-accent';
              textColor = 'text-brand-accent';
              lineClass = 'bg-brand-accent/80';
            } else if (node.isActive) {
              if (isDelayed) {
                dotColor = 'bg-status-danger border-status-danger animate-pulse';
                textColor = 'text-status-danger';
              } else {
                dotColor = 'bg-zinc-900 border-brand-accent';
                textColor = 'text-brand-accent font-semibold';
              }
            }

            return (
              <div key={idx} className="flex flex-row items-stretch relative">
                <div className="w-12 flex flex-col items-center relative">
                  {/* The Node Dot */}
                  <div className={`w-3 h-3 rounded-full border-[2px] z-10 relative transition-all duration-300 ${dotColor}`}>
                    {node.isActive && !isDelayed && (
                      <div className="absolute inset-0 bg-brand-accent rounded-full animate-ping opacity-40"></div>
                    )}
                  </div>
                  
                  {/* The Connecting Line */}
                  {!isLast && (
                    <div className={`w-[2px] flex-1 my-1 rounded-full transition-all duration-300 ${lineClass}`}></div>
                  )}
                </div>
                
                {/* Node Label */}
                <div className={`pb-8 pl-2 flex-1 ${textColor} transition-colors duration-300`}>
                  <div className="text-[10px] uppercase tracking-[0.1em] opacity-60 font-semibold mb-0.5">
                    {node.type}
                  </div>
                  <div className={`text-base ${node.isActive ? 'text-white font-semibold' : ''}`}>
                    {node.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
