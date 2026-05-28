import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Warehouse } from './shipmentsSlice.js';

interface WarehousesState {
  items: Warehouse[];
  loading: boolean;
  error: string | null;
}

const initialState: WarehousesState = {
  items: [],
  loading: false,
  error: null
};

export const fetchWarehouses = createAsyncThunk('warehouses/fetchWarehouses', async () => {
  const res = await fetch('http://localhost:3001/api/warehouses');
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return (await res.json()) as Warehouse[];
});

const warehousesSlice = createSlice({
  name: 'warehouses',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => { state.loading = true; })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load warehouses";
      });
  }
});

export default warehousesSlice.reducer;
