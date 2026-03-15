import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import shelterRoutes from './routes/shelters.js';
import { createUpdateRouter } from './routes/updates.js';
import recommendRoutes from './routes/recommend.js';
import disasterRoutes from './routes/disasters.js';
import { createAiRouter } from './routes/ai.js';
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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DPRP API running on port ${PORT}`);
});
