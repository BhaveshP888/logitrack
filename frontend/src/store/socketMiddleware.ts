import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { shipmentDelivered, shipmentDelayed, shipmentDispatched, checkpointReached } from './shipmentsSlice.js';
import { driverStatusChange } from './driversSlice.js';
import { WS_URL } from '../config.js';

let socket: Socket;

export const socketMiddleware: Middleware = store => next => action => {
  const act = action as any;
  // Initialize connection on app boot or custom action
  if (act && act.type === 'socket/connect') {
    if (!socket) {
      socket = io(WS_URL);

      socket.on('connect', () => {
        console.log("Connected to WebSocket backend server");
      });

      socket.on('SHIPMENT_DELAYED', (data: { shipmentId: string }) => {
        store.dispatch(shipmentDelayed(data));
      });

      socket.on('SHIPMENT_DISPATCHED', (data: { shipmentId: string; actualDispatchDate: string }) => {
        store.dispatch(shipmentDispatched(data));
      });

      socket.on('CHECKPOINT_REACHED', (data: { shipmentId: string; checkpointId: string; reachedAt: string }) => {
        store.dispatch(checkpointReached(data));
      });

      socket.on('SHIPMENT_DELIVERED', (data: { shipmentId: string; driverId: string | null }) => {
        store.dispatch(shipmentDelivered({ shipmentId: data.shipmentId }));
        if (data.driverId) {
          store.dispatch(driverStatusChange({ id: data.driverId, status: 'AVAILABLE' }));
        }
      });

      socket.on('DRIVER_STATUS_CHANGE', (data: { id: string; status: string }) => {
        store.dispatch(driverStatusChange(data));
      });
    }
  }

  return next(action);
};
