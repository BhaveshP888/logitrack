import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/index.js';
import { selectShipment } from '../store/shipmentsSlice.js';

export default function LiveMap() {
  const dispatch = useDispatch();
  const warehouses = useSelector((state: RootState) => state.warehouses.items);
  const shipments = useSelector((state: RootState) => state.shipments.items);
  const selectedShipmentId = useSelector((state: RootState) => state.shipments.selectedId);
  
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Map latitude/longitude to SVG coordinate space (Width 800, Height 500)
  const mapCoords = (lat: number, lng: number) => {
    const minLng = -125;
    const maxLng = -70;
    const minLat = 25;
    const maxLat = 50;

    const x = ((lng - minLng) / (maxLng - minLng)) * 800;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 500;
    return { x, y };
  };

  const activeShipments = shipments.filter(s => s.status === 'EN_ROUTE' || s.status === 'DELAYED');

  const badgeClass = (status: string) => {
    const base = "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:inline-block";
    switch (status) {
      case 'PENDING':
        return `${base} bg-status-warning/8 text-status-warning border border-status-warning/15 before:bg-status-warning`;
      case 'EN_ROUTE':
        return `${base} bg-brand-primary/8 text-brand-primary border border-brand-primary/15 before:bg-brand-primary`;
      case 'DELIVERED':
        return `${base} bg-status-success/8 text-status-success border border-status-success/15 before:bg-status-success`;
      case 'DELAYED':
        return `${base} bg-status-danger/8 text-status-danger border border-status-danger/15 before:bg-status-danger`;
      default:
        return base;
    }
  };

  return (
    <div className="bg-bg-surface border border-border-color rounded-xl p-6 transition-all duration-250 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-bg-surface-hover hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex-1 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold font-display">Live Fleet Tracking Map</h3>
        <div className="flex gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-brand-accent" /> Warehouse
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-brand-primary" /> Transit
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-status-danger" /> Delayed
          </span>
        </div>
      </div>
      
      <div className="flex-1 bg-[#07080f] rounded-lg border border-border-color relative min-h-[350px]">
        <svg viewBox="0 0 800 500" className="w-100 h-100 block">
          {/* Background grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
            </pattern>
            {/* Glow filters */}
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Dotted paths connecting all warehouses */}
          {warehouses.map((wOrigin, idx) => 
            warehouses.slice(idx + 1).map(wDest => {
              const start = mapCoords(wOrigin.latitude, wOrigin.longitude);
              const end = mapCoords(wDest.latitude, wDest.longitude);
              return (
                <line 
                  key={`${wOrigin.id}-${wDest.id}`}
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  stroke="var(--color-border-color)"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                  opacity="0.5"
                />
              );
            })
          )}

          {/* Selected Shipment path route highlight */}
          {activeShipments.map(s => {
            if (s.id !== selectedShipmentId) return null;
            const start = mapCoords(s.originWarehouse.latitude, s.originWarehouse.longitude);
            const end = mapCoords(s.destinationWarehouse.latitude, s.destinationWarehouse.longitude);
            const strokeColor = s.status === 'DELAYED' ? 'var(--color-status-danger)' : 'var(--color-brand-primary)';
            return (
              <g key={`route-group-${s.id}`}>
                <line 
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  stroke={strokeColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.35"
                  filter={s.status === 'DELAYED' ? 'url(#glow-red)' : 'url(#glow-blue)'}
                />
                <line 
                  x1={start.x} y1={start.y}
                  x2={end.x} y2={end.y}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Warehouses (Nodes) */}
          {warehouses.map(w => {
            const { x, y } = mapCoords(w.latitude, w.longitude);
            const isHovered = hoveredNode === w.id;
            return (
              <g 
                key={w.id} 
                onMouseEnter={() => setHoveredNode(w.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isHovered ? 14 : 10} 
                  fill="var(--color-brand-accent)" 
                  fillOpacity={isHovered ? 0.25 : 0.1} 
                  stroke="var(--color-brand-accent)" 
                  strokeWidth="1" 
                  strokeOpacity="0.3" 
                  className="transition-all duration-150"
                />
                <circle cx={x} cy={y} r="4" fill="var(--color-brand-accent)" />
                <text 
                  x={x} 
                  y={y - 14} 
                  textAnchor="middle" 
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'} 
                  fontSize="10" 
                  fontWeight="600"
                  className="font-display transition-colors duration-150"
                >
                  {w.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Shipments/Trucks moving */}
          {activeShipments.map(s => {
            const { x, y } = mapCoords(s.currentLatitude, s.currentLongitude);
            const isSelected = s.id === selectedShipmentId;
            const markerColor = s.status === 'DELAYED' ? 'var(--color-status-danger)' : 'var(--color-brand-primary)';
            return (
              <g 
                key={s.id} 
                onClick={() => dispatch(selectShipment(isSelected ? null : s.id))}
                className="cursor-pointer"
              >
                <circle 
                  cx={x} cy={y} 
                  r={isSelected ? 18 : 12} 
                  fill="none" 
                  stroke={markerColor} 
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                >
                  <animate attributeName="r" values="8;20;8" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="1;0;1" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle 
                  cx={x} cy={y} 
                  r={isSelected ? 7 : 5} 
                  fill="#ffffff"
                  stroke={markerColor}
                  strokeWidth="2"
                  filter={s.status === 'DELAYED' ? 'url(#glow-red)' : 'url(#glow-blue)'}
                />
              </g>
            );
          })}
        </svg>

        {/* Selected details tooltip overlay */}
        {selectedShipmentId && (() => {
          const selected = shipments.find(s => s.id === selectedShipmentId);
          if (!selected) return null;
          return (
            <div className="absolute bottom-4 left-4 bg-bg-surface border border-border-color rounded-lg p-4 w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold font-display text-sm text-slate-100">{selected.trackingNumber}</span>
                <span className={badgeClass(selected.status)}>{selected.status}</span>
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-400">
                <p className="flex justify-between">
                  <span>Driver</span>
                  <strong className="text-slate-100">{selected.driver?.name || 'Unassigned'}</strong>
                </p>
                <p className="flex justify-between">
                  <span>From</span>
                  <strong className="text-slate-100">{selected.originWarehouse.name.split(' ')[0]}</strong>
                </p>
                <p className="flex justify-between">
                  <span>To</span>
                  <strong className="text-slate-100">{selected.destinationWarehouse.name.split(' ')[0]}</strong>
                </p>
              </div>
              <div className="mt-3.5">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                  <span>Progress</span>
                  <span className="font-mono">{selected.progress.toFixed(0)}%</span>
                </div>
                <div className="bg-white/5 h-1 rounded-sm overflow-hidden">
                  <div 
                    className="h-full rounded-sm transition-all duration-300" 
                    style={{ 
                      width: `${selected.progress}%`, 
                      backgroundColor: selected.status === 'DELAYED' ? 'var(--color-status-danger)' : 'var(--color-brand-primary)' 
                    }} 
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
