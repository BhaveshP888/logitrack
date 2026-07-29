
interface Checkpoint {
  id: string;
  name: string;
  reached: boolean;
  isAbsent?: boolean;
  orderIndex: number;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  originWarehouse: { name: string };
  destinationWarehouse: { name: string };
  checkpoints: Checkpoint[];
}

interface TrackingTimelineProps {
  shipment: Shipment;
}

export default function TrackingTimeline({ shipment }: TrackingTimelineProps) {
  // Construct a unified timeline including Origin and Destination
  const nodes = [
    {
      id: 'origin',
      name: shipment.originWarehouse.name.split(' ')[0] + ' (Origin)',
      isReached: shipment.status !== 'PENDING',
      isAbsent: false,
      isCurrent: shipment.status === 'PENDING'
    },
    ...(shipment.checkpoints || []).map((cp, idx) => {
      const isReached = cp.reached;
      const isAbsent = !!cp.isAbsent;
      let isCurrent = false;
      if (!isReached && !isAbsent && shipment.status !== 'PENDING' && shipment.status !== 'DELIVERED') {
        if (idx === 0) isCurrent = true;
        else {
          const prev = shipment.checkpoints[idx - 1];
          isCurrent = prev.reached || !!prev.isAbsent;
        }
      }
      return {
        id: cp.id,
        name: cp.name,
        isReached,
        isAbsent,
        isCurrent
      };
    }),
    {
      id: 'destination',
      name: shipment.destinationWarehouse.name.split(' ')[0] + ' (Dest)',
      isReached: shipment.status === 'DELIVERED',
      isAbsent: false,
      isCurrent: shipment.status !== 'DELIVERED' && shipment.status !== 'PENDING' && (shipment.checkpoints || []).every(cp => cp.reached || cp.isAbsent)
    }
  ];
  
  const total = nodes.length;
  
  let progressPercent = 0;
  if (total > 1) {
    if (shipment.status === 'DELIVERED') progressPercent = 100;
    else if (shipment.status === 'PENDING') progressPercent = 0;
    else {
      const currentIndex = nodes.findIndex(n => !n.isReached && !n.isAbsent);
      if (currentIndex === -1) {
        progressPercent = 100; // All nodes reached/absent but not delivered yet
      } else {
        // Offset slightly so it looks like it's between nodes
        progressPercent = ((currentIndex - 0.5) / (total - 1)) * 100;
        // Don't let it go below 0 or above 100
        progressPercent = Math.max(0, Math.min(100, progressPercent));
      }
    }
  }

  return (
    <div className="w-full relative py-8 font-body" aria-label={`Tracking progress for shipment ${shipment.trackingNumber}`}>
      {/* Background Track */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/[0.05] rounded-full -translate-y-1/2 z-0" aria-hidden="true"></div>
      
      {/* Animated Fill Track */}
      <div 
        className="absolute top-1/2 left-0 h-1 bg-brand-primary rounded-full -translate-y-1/2 z-0 transition-all duration-1000 ease-out"
        style={{ width: `${progressPercent}%` }}
        aria-hidden="true"
      ></div>

      {/* Semantic Checkpoints List */}
      <ol className="relative z-10 flex justify-between items-center w-full m-0 p-0 list-none">
        {nodes.map((node) => {
          return (
            <li 
              key={node.id} 
              className="flex flex-col items-center relative group"
              aria-current={node.isCurrent ? "step" : undefined}
            >
              <span className="sr-only">
                {node.isReached ? `Completed: ${node.name}` : node.isAbsent ? `Skipped: ${node.name}` : node.isCurrent ? `Current: ${node.name}` : `Pending: ${node.name}`}
              </span>
              
              {/* Checkpoint Node */}
              <div 
                aria-hidden="true"
                className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  node.isReached 
                    ? 'border-brand-primary bg-bg-surface' 
                    : node.isAbsent
                      ? 'border-status-danger/50 bg-bg-surface'
                      : node.isCurrent
                        ? 'border-brand-accent bg-bg-surface scale-125 shadow-lg shadow-brand-accent/20'
                        : 'border-white/[0.1] bg-bg-surface'
                }`}
              >
                {node.isReached && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {node.isAbsent && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-status-danger/50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                )}
                {node.isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                )}
              </div>

              {/* Label */}
              <div aria-hidden="true" className="absolute top-8 w-32 text-center -ml-16 left-1/2 mt-1">
                <span className={`text-[11px] font-medium transition-colors duration-500 ${
                  node.isReached || node.isCurrent ? 'text-zinc-200' : node.isAbsent ? 'text-status-danger/70 line-through' : 'text-zinc-500'
                }`}>
                  {node.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Truck Icon animating along the track */}
      {shipment.status !== 'DELIVERED' && total > 0 && (
        <div 
          className="absolute top-1/2 -translate-y-1/2 -mt-6 z-20 transition-all duration-1000 ease-out"
          style={{ left: `calc(${progressPercent}% - 12px)` }}
          aria-hidden="true"
        >
          <div className="bg-brand-primary p-1.5 rounded-lg shadow-lg shadow-brand-primary/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
