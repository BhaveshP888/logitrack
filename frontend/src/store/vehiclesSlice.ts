import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../config.js';
import { Warehouse } from './shipmentsSlice.js';

export interface Vehicle {
  id: string;
  licensePlate: string;
  modelName: string;
  vehicleType: 'BOX_TRUCK_24FT' | 'SEMI_TRAILER_53FT' | 'FLATBED' | 'REFRIGERATED_VAN';
  maxWeightKg: number;
  maxVolumeCbm: number;
  currentWarehouseId: string | null;
  currentWarehouse?: Warehouse | null;
  createdAt: string;
}

interface VehiclesState {
  items: Vehicle[];
  loading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  items: [],
  loading: false,
  error: null
};

export const fetchVehicles = createAsyncThunk('vehicles/fetchVehicles', async () => {
  const res = await fetch(`${API_BASE}/api/vehicles`, { credentials: 'include' });
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return (await res.json()) as Vehicle[];
});

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => { state.loading = true; })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load vehicles";
      });
  }
});

export default vehiclesSlice.reducer;
