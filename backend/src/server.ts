import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { authRouter } from './routes/auth.js';
import { startSimulation } from './simulation.js';

dotenv.config();

// Support comma-separated origins for Vercel preview deployments
// e.g. FRONTEND_URL=https://logitrack-beta.vercel.app,https://logitrack-git-*.vercel.app
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function checkOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(null, false);
  }
}

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({ origin: checkOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.set('io', io);

app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

startSimulation(io);

const PORT = process.env.VITEST ? 3002 : (process.env.PORT || 3001);
// TODO(security): Listen on localhost only for safety during dev/test
if (!process.env.VITEST) {
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export { app, server };
