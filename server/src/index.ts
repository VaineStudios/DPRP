import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import authRoutes from './routes/auth.js';
import shelterRoutes from './routes/shelters.js';

const app = express();
const server = http.createServer(app);

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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DPRP API running on port ${PORT}`);
});
