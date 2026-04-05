import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import authRoutes from './routes/auth';
import stegoRoutes from './routes/stego';
import promptRoutes from './routes/prompts';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Vercel rewrites send arbitrary paths (e.g. /favicon.ico) to this function — answer instantly
app.get('/favicon.ico', (_req, res) => res.status(204).end());
app.get('/robots.txt', (_req, res) => res.type('text/plain').send('User-agent: *\nDisallow: /\n'));

function parseCorsOrigins(): string | string[] | boolean {
  const raw = env.CORS_ORIGIN?.trim();
  if (!raw) return true;
  if (raw === '*') return true;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return true;
  if (list.length === 1) return list[0];
  return list;
}

const devOrigins = [
  ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin:
      env.NODE_ENV === 'development'
        ? devOrigins
        : env.CORS_ORIGIN
          ? parseCorsOrigins()
          : true,
    credentials: true,
  })
);

const bodyLimit = process.env.VERCEL === '1' ? '4mb' : '10mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Local static uploads (empty on Vercel — images live on Cloudinary)
const uploadsPath = path.join(__dirname, '../uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// Root — Vercel visitors often open the deployment URL without /api (would otherwise be "Cannot GET /")
app.get('/', (_req, res) => {
  res.json({
    service: 'steganography-api',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth/*',
      encode: 'POST /api/encode',
      decode: 'POST /api/decode',
      prompts: '/api/prompts',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', stegoRoutes);
app.use('/api/prompts', promptRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

export default app;
