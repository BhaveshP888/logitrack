
interface Checkpoint {
  id: string;
  name: string;
  reached: boolean;
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
  const checkpoints = shipment.checkpoints || [];
  
  // Calculate progress percentage
  const total = checkpoints.length;
  const reachedCount = checkpoints.filter(cp => cp.reached).length;
  
  let progressPercent = 0;
  if (total > 0) {
    if (shipment.status === 'DELIVERED') progressPercent = 100;
    else if (reachedCount === 0) progressPercent = 5; // just started
    else progressPercent = (reachedCount / total) * 100;
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
        {checkpoints.map((cp, idx) => {
          const isReached = cp.reached;
          const isCurrent = !isReached && (idx === 0 || checkpoints[idx - 1].reached);
          
          return (
            <li 
              key={cp.id} 
              className="flex flex-col items-center relative group"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="sr-only">
                {isReached ? `Completed: ${cp.name}` : isCurrent ? `Current: ${cp.name}` : `Pending: ${cp.name}`}
              </span>
              
              {/* Checkpoint Node */}
              <div 
                aria-hidden="true"
                className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  isReached 
                    ? 'border-brand-primary bg-bg-surface' 
                    : isCurrent
                      ? 'border-brand-accent bg-bg-surface scale-125 shadow-lg shadow-brand-accent/20'
                      : 'border-white/[0.1] bg-bg-surface'
                }`}
              >
                {isReached && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
                )}
              </div>

              {/* Label */}
              <div aria-hidden="true" className="absolute top-8 w-32 text-center -ml-16 left-1/2 mt-1">
                <span className={`text-[11px] font-medium transition-colors duration-500 ${
                  isReached || isCurrent ? 'text-zinc-200' : 'text-zinc-500'
                }`}>
                  {cp.name}
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
