import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { ExpressPeerServer } from 'peer';

// Load environment variables
dotenv.config();

import { connectDatabase } from './config/database.js';
import { initMQTTBroker } from './config/mqtt.js';
import { JWT_SECRET } from './config/auth.js';
import { startStoryCleanupCron } from './utils/storyCleanup.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import storiesRoutes from './routes/stories.routes.js';
import conversationsRoutes from './routes/conversations.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import groupsRoutes from './routes/groups.routes.js';
import friendsRoutes from './routes/friends.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import callsRoutes from './routes/calls.routes.js';
import searchRoutes from './routes/search.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { auditService } from './services/audit.service.js';
import rateLimit from 'express-rate-limit';

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '5000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 0. Disable banner leakage
app.disable('x-powered-by');

// 1. Enterprise Security Headers Middleware (CMMC L2 / OWASP)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  next();
});

// 2. Gateway Threat & Bot Scanner Blocker (WAF rules)
app.use((req, res, next) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const blockedScanners = ['sqlmap', 'nikto', 'masscan', 'dirbuster', 'nmap', 'zgrab', 'gobuster', 'wpscan'];
  if (blockedScanners.some((tool) => userAgent.includes(tool))) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// 3. Global API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

// 4. Configure CORS
app.use(
  cors({
    origin: true, // Allow any incoming origin (including onrender.com and custom domains)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.options('*', cors());

// 5. Request body parsing with strict size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Static uploads serving with security headers
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use(
  '/uploads',
  express.static(uploadsPath, {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self' data:;");
    },
  })
);

// 7. Embedded PeerJS WebRTC Signaling Server
const peerServer = ExpressPeerServer(server, {
  path: '/',
  allow_discovery: true,
});
app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`[PeerJS] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`[PeerJS] Client disconnected: ${client.getId()}`);
});

// 8. Health & Audit Integrity Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Orbit API Server',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/audit', (req, res) => {
  const auditStatus = auditService.verifyIntegrity();
  res.json({
    status: 'ok',
    service: 'Orbit Cryptographic Audit Ledger',
    ledgerIntegrity: auditStatus.valid ? 'VERIFIED_TAMPER_FREE' : 'INTEGRITY_COMPROMISED',
    totalRecords: auditStatus.totalRecords,
    timestamp: new Date().toISOString(),
  });
});

// 7. Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

// 8. Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// 9. Start All Services
async function bootstrap() {
  try {
    // Fail-safe check for production JWT entropy
    if (process.env.NODE_ENV === 'production' && JWT_SECRET.includes('development')) {
      console.warn('⚠️ WARNING: Insecure default JWT_SECRET detected in production environment!');
    }

    // Connect SQLite Database
    await connectDatabase();

    // Start Embedded Aedes MQTT Broker (attached to HTTP server on /mqtt)
    initMQTTBroker(server);

    // Start Story Auto-Cleanup Cron
    startStoryCleanupCron();

    // Start HTTP Server (Express + PeerJS on Port 5000)
    server.listen(PORT, () => {
      console.log(`
  🚀 Orbit Backend Server Running! (Hardened Security Applied)
  =========================================
  📡 REST API:      http://localhost:${PORT}/api
  📞 PeerJS WebRTC: http://localhost:${PORT}/peerjs
  🌐 MQTT (WS):     ws://localhost:8883
  🔌 MQTT (TCP):    mqtt://localhost:1883
  📁 Uploads:       http://localhost:${PORT}/uploads
  🛡️ Security:      Rate Limiting, WAL Mode, MQTT Auth Hooks Active
  =========================================
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start Orbit server:', error);
    process.exit(1);
  }
}

bootstrap();

export { app, server };
