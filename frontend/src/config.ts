// API base URL for REST calls.
// In production with Vercel proxy rewrites, this should be '' (empty) so
// fetch('/api/...') goes through Vercel's same-origin rewrite → no CORS/cookie issues.
// Set VITE_API_BASE_URL only if you need to bypass the proxy (e.g., direct to Render).
// API calls use relative paths in production — Vercel proxy rewrites /api/* → Render.
// Do NOT set VITE_API_BASE_URL in production. Only needed for local dev.
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');

// WebSocket must point directly to the backend (Vercel can't proxy WS).
// Set VITE_WS_URL in Vercel env vars → https://logitrack-rs2z.onrender.com
export const WS_URL: string = import.meta.env.VITE_WS_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');

if (!import.meta.env.DEV && !import.meta.env.VITE_WS_URL) {
  console.error(
    '[config] VITE_WS_URL is not set. WebSocket connections will fail in production. ' +
    'Set it to your backend URL (e.g., https://your-app.onrender.com) in Vercel environment variables.'
  );
}
