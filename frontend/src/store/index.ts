import { configureStore } from '@reduxjs/toolkit';
import shipmentsReducer from './shipmentsSlice.js';
import driversReducer from './driversSlice.js';
import warehousesReducer from './warehousesSlice.js';
import { socketMiddleware } from './socketMiddleware.js';

export const store = configureStore({
  reducer: {
    shipments: shipmentsReducer,
    drivers: driversReducer,
    warehouses: warehousesReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(socketMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
