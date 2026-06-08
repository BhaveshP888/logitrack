export const API_BASE = typeof import.meta.env.VITE_API_BASE_URL === 'string'
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:3001' : '');

export const WS_URL = typeof import.meta.env.VITE_WS_URL === 'string'
  ? import.meta.env.VITE_WS_URL
  : (import.meta.env.DEV ? 'http://localhost:3001' : 'https://logitrack-rs2z.onrender.com');


