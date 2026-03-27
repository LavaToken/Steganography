import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/auth';
import stegoRoutes from './routes/stego';
import promptRoutes from './routes/prompts';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads (served for thumbnails)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', stegoRoutes);
app.use('/api/prompts', promptRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`CORS origin: ${env.CORS_ORIGIN}`);
});

export default app;
