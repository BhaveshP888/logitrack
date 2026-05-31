import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.js';
import { selectShipment } from '../store/shipmentsSlice.js';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';

export default function LiveMap() {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((state) => state.warehouses.items);
  const shipments = useAppSelector((state) => state.shipments.items);
  const selectedShipmentId = useAppSelector((state) => state.shipments.selectedId);
  
  const [hoveredWarehouseId, setHoveredWarehouseId] = useState<string | null>(null);

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

  // Custom icon generator for warehouses
  const getWarehouseIcon = (isHovered: boolean) => {
    return L.divIcon({
      className: 'custom-warehouse-icon-wrapper',
      html: `
        <div class="relative flex flex-col items-center justify-center">
          <div class="w-7 h-7 flex items-center justify-center rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.35)] transition-all duration-150 ${isHovered ? 'scale-125 bg-[rgba(139,92,246,0.25)] border-[rgba(139,92,246,0.55)]' : ''}">
            <div class="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_#8b5cf6]"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // Custom icon generator for shipments
  const getShipmentIcon = (status: string, isSelected: boolean) => {
    const colorHex = status === 'DELAYED' ? '#ef4444' : '#3b82f6';
    const glowColor = status === 'DELAYED' ? 'rgba(239,68,68,0.8)' : 'rgba(59,130,246,0.8)';
    const size = isSelected ? 'w-8 h-8' : 'w-6 h-6';
    const innerDotSize = isSelected ? 'w-3 h-3' : 'w-2 h-2';
    const staticRingClass = isSelected ? 'inset-1 border-2' : 'inset-1 border';

    return L.divIcon({
      className: 'custom-shipment-icon-wrapper',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer ${size}">
          <!-- Pulsing outer ring -->
          <div class="absolute inset-0 rounded-full border border-current opacity-70 animate-ping" style="animation-duration: 2s; color: ${colorHex};"></div>
          <!-- Static outer ring -->
          <div class="absolute ${staticRingClass} rounded-full border-current opacity-45" style="color: ${colorHex};"></div>
          <!-- Inner glowing dot -->
          <div class="${innerDotSize} rounded-full bg-white border-2 border-current shadow-[0_0_8px_${glowColor}]" style="color: ${colorHex};"></div>
        </div>
      `,
      iconSize: isSelected ? [32, 32] : [24, 24],
      iconAnchor: isSelected ? [16, 16] : [12, 12],
    });
  };

  // Memoize icons to prevent re-creation on every render where possible
  const warehouseIcons = useMemo(() => {
    const icons: Record<string, { hovered: L.DivIcon; default: L.DivIcon }> = {};
    warehouses.forEach(w => {
      icons[w.id] = {
        hovered: getWarehouseIcon(true),
        default: getWarehouseIcon(false)
      };
    });
    return icons;
  }, [warehouses]);

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
      
      <div className="flex-1 bg-[#07080f] rounded-lg border border-border-color relative min-h-[400px] overflow-hidden">
        <MapContainer 
          center={[19.75, 75.72]} 
          zoom={7} 
          className="w-full h-full dark-map"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Dotted paths connecting all warehouses */}
          {warehouses.map((wOrigin, idx) => 
            warehouses.slice(idx + 1).map(wDest => (
              <Polyline
                key={`${wOrigin.id}-${wDest.id}`}
                positions={[
                  [wOrigin.latitude, wOrigin.longitude],
                  [wDest.latitude, wDest.longitude]
                ]}
                pathOptions={{
                  color: '#1e2230',
                  weight: 1,
                  dashArray: '5, 5',
                  opacity: 0.5,
                  interactive: false
                }}
              />
            ))
          )}

          {/* Selected Shipment path route highlight */}
          {activeShipments.map(s => {
            if (s.id !== selectedShipmentId) return null;
            const positions: [number, number][] = [
              [s.originWarehouse.latitude, s.originWarehouse.longitude],
              [s.destinationWarehouse.latitude, s.destinationWarehouse.longitude]
            ];
            const isDelayed = s.status === 'DELAYED';
            return (
              <React.Fragment key={`route-group-${s.id}`}>
                {/* Glowing polyline (thick base) */}
                <Polyline 
                  positions={positions} 
                  pathOptions={{
                    color: isDelayed ? '#ef4444' : '#3b82f6',
                    weight: 6,
                    opacity: 0.35,
                    className: isDelayed ? 'glow-red' : 'glow-blue',
                    interactive: false
                  }}
                />
                {/* Core dashed line */}
                <Polyline 
                  positions={positions} 
                  pathOptions={{
                    color: isDelayed ? '#ef4444' : '#3b82f6',
                    weight: 1.5,
                    dashArray: '4, 4',
                    opacity: 0.8,
                    interactive: false
                  }}
                />
              </React.Fragment>
            );
          })}

          {/* Warehouses (Nodes) */}
          {warehouses.map(w => {
            const isHovered = hoveredWarehouseId === w.id;
            const icon = warehouseIcons[w.id]?.[isHovered ? 'hovered' : 'default'] || getWarehouseIcon(isHovered);
            return (
              <Marker
                key={w.id}
                position={[w.latitude, w.longitude]}
                icon={icon}
                eventHandlers={{
                  mouseover: () => setHoveredWarehouseId(w.id),
                  mouseout: () => setHoveredWarehouseId(null),
                }}
              >
                <Tooltip 
                  permanent 
                  direction="top" 
                  className="custom-tooltip" 
                  offset={[0, -12]}
                >
                  {w.name.split(' ')[0]}
                </Tooltip>
              </Marker>
            );
          })}

          {/* Shipments/Trucks moving */}
          {activeShipments.map(s => {
            const isSelected = s.id === selectedShipmentId;
            const icon = getShipmentIcon(s.status, isSelected);
            return (
              <Marker
                key={s.id}
                position={[s.currentLatitude, s.currentLongitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    dispatch(selectShipment(isSelected ? null : s.id));
                  }
                }}
              />
            );
          })}
        </MapContainer>

        {/* Selected details tooltip overlay */}
        {selectedShipmentId && (() => {
          const selected = shipments.find(s => s.id === selectedShipmentId);
          if (!selected) return null;
          return (
            <div className="absolute bottom-4 left-4 bg-bg-surface/95 backdrop-blur-md border border-border-color rounded-lg p-4 w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[1000] pointer-events-auto">
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
