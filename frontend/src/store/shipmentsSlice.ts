import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Warehouse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Driver {
  id: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  originWarehouseId: string;
  originWarehouse: Warehouse;
  destinationWarehouseId: string;
  destinationWarehouse: Warehouse;
  driverId: string | null;
  driver: Driver | null;
  currentLatitude: number;
  currentLongitude: number;
  progress: number;
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
  const res = await fetch('http://localhost:3001/api/shipments');
  if (!res.ok) throw new Error("Failed to fetch shipments");
  return (await res.json()) as Shipment[];
});

const shipmentsSlice = createSlice({
  name: 'shipments',
  initialState,
  reducers: {
    updateShipmentCoords: (state, action: PayloadAction<{ id: string; progress: number; currentLatitude: number; currentLongitude: number }>) => {
      const shipment = state.items.find(item => item.id === action.payload.id);
      if (shipment) {
        shipment.progress = action.payload.progress;
        shipment.currentLatitude = action.payload.currentLatitude;
        shipment.currentLongitude = action.payload.currentLongitude;
      }
    },
    shipmentDelivered: (state, action: PayloadAction<{ shipmentId: string }>) => {
      const shipment = state.items.find(item => item.id === action.payload.shipmentId);
      if (shipment) {
        shipment.progress = 100;
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

export const { updateShipmentCoords, shipmentDelivered, addShipment, selectShipment } = shipmentsSlice.actions;
export default shipmentsSlice.reducer;
