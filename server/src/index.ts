import 'dotenv/config';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import shelterRoutes from './routes/shelters.js';
import { createUpdateRouter } from './routes/updates.js';
import recommendRoutes from './routes/recommend.js';
import disasterRoutes from './routes/disasters.js';
import { createAiRouter } from './routes/ai.js';
import { createBroadcastRouter } from './routes/broadcasts.js';
import { initializeSocket } from './services/socket.js';

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
initializeSocket(io);

// Middleware
app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/updates', createUpdateRouter(io));
app.use('/api/recommend', recommendRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/ai', createAiRouter(io));
app.use('/api/broadcasts', createBroadcastRouter(io));

// Serve client static files (built PWAs copied into server/public/ at deploy time)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, '..', 'public');

app.use('/shelter', express.static(path.join(clientDir, 'client-shelter')));
app.use('/resident', express.static(path.join(clientDir, 'client-resident')));
app.use(express.static(path.join(clientDir, 'client-admin')));

// SPA fallback — serve index.html for client-side routing
app.get('/shelter/*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'client-shelter', 'index.html'));
});
app.get('/resident/*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'client-resident', 'index.html'));
});
app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api/') || _req.path.startsWith('/socket.io/')) return next();
  res.sendFile(path.join(clientDir, 'client-admin', 'index.html'));
});

// Global error handler — catches anything that slips through route-level try/catch
const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
};
app.use(globalErrorHandler);

// Catch unhandled rejections and uncaught exceptions so the process doesn't crash
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DPRP API running on port ${PORT}`);
});
