import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API_BASE } from '../config.js';

export interface Warehouse {
  id: string;
  code?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  capacityCbm?: number;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  modelName: string;
  vehicleType: string;
  maxWeightKg: number;
  maxVolumeCbm: number;
}

export interface ShipmentItem {
  id: string;
  description: string;
  quantity: number;
  weightKg: number;
  volumeCbm: number;
  isHazmat: boolean;
}

export interface ShipmentCheckpoint {
  id: string;
  name: string;
  orderIndex: number;
  latitude?: number | null;
  longitude?: number | null;
  reached: boolean;
  reachedAt: string | null;
  isAbsent: boolean;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber?: string;
  phone?: string;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE';
  latitude?: number;
  longitude?: number;
  warehouseId?: string;
}

export interface ShipmentEvent {
  id: string;
  status: string;
  description: string;
  location?: string | null;
  createdAt: string;
}

export interface ProofOfDelivery {
  id: string;
  receivedBy: string;
  signatureData?: string | null;
  photoUrl?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  notes?: string | null;
  signedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  currency: string;
  status: 'UNPAID' | 'PAID' | 'VOID';
  issuedAt: string;
  paidAt?: string | null;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: 'PENDING' | 'BOOKED' | 'ASSIGNED' | 'DISPATCHED' | 'EN_ROUTE' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'EXCEPTION' | 'CANCELLED';
  originWarehouse: Warehouse;
  destinationWarehouse: Warehouse;
  driver: Driver | null;
  driverId?: string | null;
  vehicle?: Vehicle | null;
  vehicleId?: string | null;
  customer?: { id: string; name?: string; email: string; companyName?: string } | null;
  price?: number;
  rateAmount?: number;
  currency?: string;
  contentDescription?: string;
  targetDispatchDate: string;
  actualDispatchDate: string | null;
  estimatedDeliveryDate?: string | null;
  actualDeliveryDate?: string | null;
  items?: ShipmentItem[];
  checkpoints: ShipmentCheckpoint[];
  events?: ShipmentEvent[];
  proofOfDelivery?: ProofOfDelivery | null;
  invoice?: Invoice | null;
  createdAt: string;
  updatedAt: string;
}

interface ShipmentsState {
  items: Shipment[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

const initialState: ShipmentsState = {
  items: [],
  loading: false,
  error: null,
  selectedId: null
};

export const fetchShipments = createAsyncThunk('shipments/fetchShipments', async () => {
  const res = await fetch(`${API_BASE}/api/shipments`, { credentials: 'include' });
  if (!res.ok) throw new Error("Failed to fetch shipments");
  return (await res.json()) as Shipment[];
});

const shipmentsSlice = createSlice({
  name: 'shipments',
  initialState,
  reducers: {
    shipmentDelayed: (state, action: PayloadAction<{ shipmentId: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        shipment.status = 'DELAYED';
      }
    },
    shipmentDispatched: (state, action: PayloadAction<{ shipmentId: string, actualDispatchDate: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        shipment.status = 'EN_ROUTE';
        shipment.actualDispatchDate = action.payload.actualDispatchDate;
      }
    },
    checkpointReached: (state, action: PayloadAction<{ shipmentId: string; checkpointId: string; reachedAt: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        const cp = shipment.checkpoints.find(c => c.id === action.payload.checkpointId);
        if (cp) {
          cp.reached = true;
          cp.reachedAt = action.payload.reachedAt;
        }
      }
    },
    checkpointAbsent: (state, action: PayloadAction<{ shipmentId: string; checkpointId: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        const cp = shipment.checkpoints.find(c => c.id === action.payload.checkpointId);
        if (cp) {
          cp.isAbsent = true;
        }
      }
    },
    shipmentDelivered: (state, action: PayloadAction<{ shipmentId: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        shipment.status = 'DELIVERED';
      }
    },
    addShipment: (state, action: PayloadAction<Shipment>) => {
      state.items.unshift(action.payload);
    },
    updateShipment: (state, action: PayloadAction<Shipment>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    selectShipment: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipments.pending, (state) => { state.loading = true; })
      .addCase(fetchShipments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchShipments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load shipments";
      });
  }
});

export const { shipmentDelayed, shipmentDispatched, checkpointReached, checkpointAbsent, shipmentDelivered, addShipment, updateShipment, selectShipment } = shipmentsSlice.actions;
export default shipmentsSlice.reducer;
