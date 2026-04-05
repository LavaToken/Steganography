import 'dotenv/config';
import app from './app';
import { env } from './config/env';

// Local development only — Vercel invokes the app via api/index.ts (no listen)
if (process.env.VERCEL !== '1') {
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}`);
  });
}
