import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../config.js';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'DRIVER' | 'CUSTOMER';
  driverId: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null
};

export const checkSession = createAsyncThunk('auth/checkSession', async () => {
  const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error("No session");
  return (await res.json()) as { user: User };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    logoutUser: (state) => {
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSession.pending, (state) => { state.loading = true; })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(checkSession.rejected, (state) => {
        state.user = null;
        state.loading = false;
      });
  }
});

export const { setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
