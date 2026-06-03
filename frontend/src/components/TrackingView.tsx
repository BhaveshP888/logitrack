import CheckpointTracker from './CheckpointTracker.js';
import ShipmentsList from './ShipmentsList.js';

export default function TrackingView() {
  return (
    <div className="flex flex-col h-full gap-4">
      <header className="flex justify-between items-center shrink-0">
        <h1 className="font-display text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">Active Tracking</h1>
      </header>
      
      <div className="grid grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr] gap-6 flex-1 min-h-0">
        <div className="flex flex-col min-h-0 relative h-full">
          <ShipmentsList />
        </div>
        <div className="flex flex-col min-h-0 relative h-full">
          <CheckpointTracker />
        </div>
      </div>
    </div>
  );
}
