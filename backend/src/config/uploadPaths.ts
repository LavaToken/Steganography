import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Writable upload directory. Vercel serverless only allows writes under /tmp.
 */
const isVercel = process.env.VERCEL === '1';

export const uploadRoot = isVercel
  ? path.join(os.tmpdir(), 'stego-uploads')
  : path.join(__dirname, '../../uploads');

export const rawUploadDir = path.join(uploadRoot, 'raw');
export const tempEncodeDir = path.join(uploadRoot, 'tmp');

export function ensureUploadDirs(): void {
  for (const dir of [uploadRoot, rawUploadDir, tempEncodeDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}
