import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS (Production readiness for Vercel & custom origins)
const corsOrigins = (process.env.FRONTEND_URL || env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check configured origins or Vercel preview deployments (*.vercel.app)
      const isAllowed =
        corsOrigins.includes(origin) ||
        corsOrigins.includes('*') ||
        /\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// 3. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 4. NoSQL injection prevention (Handled strictly by Zod schemas instead of express-mongo-sanitize due to Express 5 compatibility)

// 5. Global rate limit
const globalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use('/api', globalLimiter);

import { apiRouter } from './routes';

// 6. Routes
app.use('/api/v1', apiRouter);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend API is running',
    health: '/health',
    api: '/api/v1'
  });
});

app.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'READY' });
  } else {
    res.status(503).json({ status: 'NOT_READY' });
  }
});

// 7. Central error handler (always last)
app.use(errorHandler);
