import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { ExpressPeerServer } from 'peer';

// Load environment variables
dotenv.config();

import { connectDatabase } from './config/database.js';
import { initMQTTBroker } from './config/mqtt.js';
import { JWT_SECRET } from './config/auth.js';
import { startStoryCleanupCron } from './utils/storyCleanup.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { sanitizeInput } from './middleware/sanitize.middleware.js';

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
import deviceRoutes from './routes/device.routes.js';
import searchRoutes from './routes/search.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { usersService } from './services/users.service.js';

import { auditService } from './services/audit.service.js';

import rateLimit from 'express-rate-limit';

// ── CORS Allowlist ─────────────────────────────────────────────────────────────
// Add your Render front-end URL and any custom domains here
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://orbit-web-6z3b.onrender.com',
  // Allow any *.onrender.com subdomain (for preview deploys)
  /^https:\/\/[\w-]+\.onrender\.com$/,
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];


const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '5000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 0. Disable banner leakage
app.disable('x-powered-by');

// 1. Request tracing — inject unique request ID for log correlation
app.use((req, res, next) => {
  const requestId = uuidv4();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});

// 2. Enterprise Security Headers (CMMC L2 / OWASP / Zero-Trust)
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME sniffing — critical for upload endpoints
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Legacy XSS filter (browsers that still honor it)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer — only send origin on cross-site
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS — enforce HTTPS for 1 year including subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Restrict browser feature access — camera/mic for calls only
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  // Cross-Origin policies (Zero-Trust network isolation)
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  // Content Security Policy — allow self + WebSocket + CDN assets
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",                        // Tailwind inline styles
      "img-src 'self' data: https: blob:",                       // Avatars, uploads, external images
      "media-src 'self' blob:",                                  // WebRTC streams
      "connect-src 'self' wss: https:",                          // API + MQTT WebSocket + Render
      "font-src 'self' data:",
      "frame-ancestors 'none'",                                  // Reinforces X-Frame-Options
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  );
  next();
});

// 3. Gateway Threat & Bot Scanner Blocker (WAF rules)
app.use((req, res, next) => {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const blockedScanners = ['sqlmap', 'nikto', 'masscan', 'dirbuster', 'nmap', 'zgrab', 'gobuster', 'wpscan'];
  if (blockedScanners.some((tool) => userAgent.includes(tool))) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// 4. Global API Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

// 5. Configure CORS — allowlisted origins only (Zero-Trust network access control)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and health checks
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((pattern) =>
        typeof pattern === 'string' ? pattern === origin : pattern.test(origin)
      );
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  })
);
app.options('*', cors());

// 6. Request body parsing with strict size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Input sanitization — strip HTML from all body fields (stored XSS prevention)
app.use(sanitizeInput);


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
// Middleware to authenticate PeerJS handshake (token passed in URL query if possible)
app.use('/peerjs', (req, res, next) => {
  // If we can't do full JWT verification because PeerJS client doesn't send token in query natively by default,
  // we at least ensure basic security headers, but a proper solution requires modifying the client to pass token.
  // We'll proceed to the peer server for now, but disable discovery.
  next();
});

const peerServer = ExpressPeerServer(server, {
  path: '/',
  allow_discovery: false, // PREVENT ENUMERATION
});
app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
  console.log(`[PeerJS] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`[PeerJS] Client disconnected: ${client.getId()}`);
});

// 8. Health & Audit Integrity Check
app.get(['/health', '/api/health'], (req, res) => {
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
app.use('/api/device', deviceRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

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



    // Start Real-Time Presence Sweeper (Clears stale ghost sessions every 15s)
    setInterval(() => {
      usersService.sweepStalePresence();
    }, 15 * 1000);

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
