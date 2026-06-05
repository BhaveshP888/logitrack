import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { authRouter } from './routes/auth.js';
import { startSimulation } from './simulation.js';


const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
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
