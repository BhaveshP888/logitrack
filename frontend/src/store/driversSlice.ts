import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Driver } from './shipmentsSlice.js';
import { API_BASE } from '../config.js';

interface DriversState {
  items: Driver[];
  loading: boolean;
  error: string | null;
}

const initialState: DriversState = {
  items: [],
  loading: false,
  error: null
};

export const fetchDrivers = createAsyncThunk('drivers/fetchDrivers', async () => {
  const res = await fetch(`${API_BASE}/api/drivers`);
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return (await res.json()) as Driver[];
});

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    driverStatusChange: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const driver = state.items.find(d => d.id === action.payload.id);
      if (driver) {
        driver.status = action.payload.status as Driver['status'];
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => { state.loading = true; })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load drivers";
      });
  }
});

export const { driverStatusChange } = driversSlice.actions;
export default driversSlice.reducer;
