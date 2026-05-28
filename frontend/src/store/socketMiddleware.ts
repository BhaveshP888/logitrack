import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { updateShipmentCoords, shipmentDelivered } from './shipmentsSlice.js';
import { updateDriverCoords, driverStatusChange } from './driversSlice.js';

let socket: Socket;

export const socketMiddleware: Middleware = store => next => action => {
  const act = action as any;
  // Initialize connection on app boot or custom action
  if (act && act.type === 'socket/connect') {
    if (!socket) {
      socket = io('http://localhost:3001');

      socket.on('connect', () => {
        console.log("Connected to WebSocket backend server");
      });

      socket.on('SHIPMENT_UPDATE', (data: { id: string; progress: number; currentLatitude: number; currentLongitude: number }) => {
        store.dispatch(updateShipmentCoords(data));
      });

      socket.on('DRIVER_UPDATE', (data: { id: string; latitude: number; longitude: number }) => {
        store.dispatch(updateDriverCoords(data));
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
