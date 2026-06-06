import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API_BASE } from '../config.js';

export interface Warehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface ShipmentCheckpoint {
  id: string;
  name: string;
  orderIndex: number;
  reached: boolean;
  reachedAt: string | null;
}

export interface Driver {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE';
  latitude: number;
  longitude: number;
  warehouseId: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: 'PENDING' | 'EN_ROUTE' | 'DELIVERED' | 'DELAYED';
  originWarehouse: Warehouse;
  destinationWarehouse: Warehouse;
  driver: Driver | null;
  driverId?: string | null;
  targetDispatchDate: string;
  actualDispatchDate: string | null;
  checkpoints: ShipmentCheckpoint[];
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
  const res = await fetch(`${API_BASE}/api/shipments`);
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
    shipmentDelivered: (state, action: PayloadAction<{ shipmentId: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        shipment.status = 'DELIVERED';
      }
    },
    addShipment: (state, action: PayloadAction<Shipment>) => {
      state.items.push(action.payload);
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

export const { shipmentDelayed, shipmentDispatched, checkpointReached, shipmentDelivered, addShipment, selectShipment } = shipmentsSlice.actions;
export default shipmentsSlice.reducer;
