import { Shipment } from '../store/shipmentsSlice.js';

interface BillOfLadingModalProps {
  shipment: Shipment;
  onClose: () => void;
}

export default function BillOfLadingModal({ shipment, onClose }: BillOfLadingModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const totalWeight = shipment.items?.reduce((sum, item) => sum + item.weightKg, 0) || 0;
  const totalVolume = shipment.items?.reduce((sum, item) => sum + item.volumeCbm, 0) || 0;
  const totalPieces = shipment.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8 text-zinc-200 font-body print:bg-white print:text-black print:border-none print:shadow-none print:m-0 print:p-0">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Electronic Bill of Lading (e-BOL)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-950 bg-brand-primary hover:bg-brand-accent rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Document Printable Content */}
        <div className="p-8 space-y-6 print:p-6 print:space-y-4 print:text-black">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 print:border-black/20 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded bg-brand-primary flex items-center justify-center font-bold text-zinc-950 text-xs">LT</div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white print:text-black">LOGITRACK FREIGHT</h1>
              </div>
              <p className="text-xs text-zinc-400 print:text-zinc-600">Standard Master Bill of Lading & Transit Waybill</p>
            </div>

            <div className="text-left sm:text-right font-mono">
              <div className="text-lg font-bold text-brand-primary print:text-black">{shipment.trackingNumber}</div>
              <div className="text-[11px] text-zinc-500 print:text-zinc-600">Issued: {new Date(shipment.createdAt).toLocaleDateString()}</div>
              <div className="text-[11px] text-zinc-500 print:text-zinc-600">Status: <span className="font-semibold text-zinc-300 print:text-black">{shipment.status}</span></div>
            </div>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
            {/* Shipper / Origin */}
            <div className="border border-white/10 print:border-black/20 rounded-xl p-4 bg-white/[0.01] print:bg-transparent">
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-wider block mb-2">Shipper / Origin Facility</span>
              <h3 className="font-semibold text-sm text-zinc-100 print:text-black">{shipment.originWarehouse.name} ({shipment.originWarehouse.code || 'BOM-01'})</h3>
              <p className="text-xs text-zinc-400 print:text-zinc-700 mt-1">{shipment.originWarehouse.address || 'Logistics Freight Gateway'}</p>
              <p className="text-xs text-zinc-400 print:text-zinc-700">{shipment.originWarehouse.city || 'Navi Mumbai'}, {shipment.originWarehouse.state || 'Maharashtra'}</p>
              <div className="mt-3 text-[11px] text-zinc-500 font-mono">
                Target Departure: {new Date(shipment.targetDispatchDate).toLocaleString()}
              </div>
            </div>

            {/* Consignee / Destination */}
            <div className="border border-white/10 print:border-black/20 rounded-xl p-4 bg-white/[0.01] print:bg-transparent">
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-wider block mb-2">Consignee / Delivery Facility</span>
              <h3 className="font-semibold text-sm text-zinc-100 print:text-black">{shipment.destinationWarehouse.name} ({shipment.destinationWarehouse.code || 'NAG-01'})</h3>
              <p className="text-xs text-zinc-400 print:text-zinc-700 mt-1">{shipment.destinationWarehouse.address || 'Transshipment Terminal'}</p>
              <p className="text-xs text-zinc-400 print:text-zinc-700">{shipment.destinationWarehouse.city || 'Nagpur'}, {shipment.destinationWarehouse.state || 'Maharashtra'}</p>
              <div className="mt-3 text-[11px] text-zinc-500 font-mono">
                Est. Delivery: {shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleString() : 'En Route Calculation'}
              </div>
            </div>
          </div>

          {/* Carrier & Equipment Allocation */}
          <div className="border border-white/10 print:border-black/20 rounded-xl p-4 bg-white/[0.01] print:bg-transparent grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-wider block mb-1">Assigned Driver</span>
              <p className="font-semibold text-xs text-zinc-200 print:text-black">{shipment.driver?.name || 'Unallocated'}</p>
              <p className="text-[11px] text-zinc-400 print:text-zinc-600 font-mono">{shipment.driver?.phone || 'No phone'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-wider block mb-1">Transport Vehicle</span>
              <p className="font-semibold text-xs text-zinc-200 print:text-black">{shipment.vehicle?.licensePlate || 'Pending Truck'}</p>
              <p className="text-[11px] text-zinc-400 print:text-zinc-600">{shipment.vehicle?.modelName || shipment.vehicle?.vehicleType?.replace('_', ' ') || 'Line-Haul'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-wider block mb-1">Shipper Organization</span>
              <p className="font-semibold text-xs text-zinc-200 print:text-black">{shipment.customer?.companyName || shipment.customer?.name || 'Enterprise Account'}</p>
              <p className="text-[11px] text-zinc-400 print:text-zinc-600">{shipment.customer?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Cargo Manifest Itemized Table */}
          <div className="border border-white/10 print:border-black/20 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-white/[0.03] print:bg-zinc-100 border-b border-white/10 print:border-black/20 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 print:text-black">Itemized Cargo Manifest</span>
              <span className="text-[11px] font-mono text-zinc-400 print:text-zinc-600">Total: {totalPieces} Units | {totalWeight.toLocaleString()} kg | {totalVolume.toFixed(1)} m³</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 print:border-black/10 text-zinc-400 print:text-zinc-600 font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Description of Freight</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Weight (kg)</th>
                  <th className="py-2.5 px-4 text-right">Volume (m³)</th>
                  <th className="py-2.5 px-4 text-center">HazMat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-black/10 text-zinc-300 print:text-black">
                {(!shipment.items || shipment.items.length === 0) ? (
                  <tr>
                    <td className="py-3 px-4 font-mono text-zinc-500">1</td>
                    <td className="py-3 px-4 font-semibold">{shipment.contentDescription || 'General Palletized Consignment'}</td>
                    <td className="py-3 px-4 text-center font-mono">1</td>
                    <td className="py-3 px-4 text-right font-mono">1,000</td>
                    <td className="py-3 px-4 text-right font-mono">4.0</td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-500">NO</td>
                  </tr>
                ) : (
                  shipment.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 px-4 font-mono text-zinc-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold">{item.description}</td>
                      <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{item.weightKg.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono">{item.volumeCbm.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {item.isHazmat ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 print:text-red-700 font-bold text-[9px]">HAZMAT</span>
                        ) : (
                          <span className="text-zinc-500">NO</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Route Checkpoints Sequence */}
          {shipment.checkpoints && shipment.checkpoints.length > 0 && (
            <div className="border border-white/10 print:border-black/20 rounded-xl p-4 bg-white/[0.01] print:bg-transparent">
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase tracking-wider block mb-2">Declared Route Waypoints & Milestones</span>
              <div className="flex flex-wrap gap-2 text-xs">
                {shipment.checkpoints.map((cp) => (
                  <span
                    key={cp.id}
                    className={`px-2.5 py-1 rounded border font-mono text-[11px] ${
                      cp.reached
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 print:text-green-800'
                        : cp.isAbsent
                        ? 'bg-zinc-800/50 border-zinc-700 text-zinc-500 line-through'
                        : 'bg-white/5 border-white/10 text-zinc-300 print:text-black'
                    }`}
                  >
                    Stop #{cp.orderIndex}: {cp.name} {cp.reached ? '✓' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Execution Section */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10 print:border-black/20">
            <div className="border border-dashed border-white/20 print:border-black/40 rounded-xl p-4 h-28 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase">Carrier Dispatch Sign-off</span>
              <div className="border-b border-white/20 print:border-black/30 w-3/4"></div>
              <p className="text-[10px] text-zinc-500 print:text-zinc-600">Authorized Logistics Controller Signature</p>
            </div>

            <div className="border border-dashed border-white/20 print:border-black/40 rounded-xl p-4 h-28 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-500 print:text-zinc-600 uppercase">Consignee Receiving Signature / POD</span>
              {shipment.proofOfDelivery ? (
                <div className="text-xs text-emerald-400 print:text-green-800 font-mono">
                  <p className="font-bold">✓ Signed by: {shipment.proofOfDelivery.receivedBy}</p>
                  <p className="text-[10px] text-zinc-400 print:text-zinc-600">{new Date(shipment.proofOfDelivery.signedAt).toLocaleString()}</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-white/20 print:border-black/30 w-3/4"></div>
                  <p className="text-[10px] text-zinc-500 print:text-zinc-600">Receiver Name, Date & Signature</p>
                </>
              )}
            </div>
          </div>

          <div className="text-center text-[10px] text-zinc-500 print:text-zinc-600 font-mono pt-2">
            This Bill of Lading is governed by the standard logistics freight conditions. LogiTrack Transport Systems.
          </div>
        </div>
      </div>
    </div>
  );
}
