import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { encode, decode, analyzeImage } from '../controllers/stegoController';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const RAW_DIR = path.join(UPLOADS_DIR, 'raw');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RAW_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// encode and decode work for both guests and authenticated users
router.post('/encode', optionalAuthenticate, upload.single('image'), encode);
router.post('/decode', optionalAuthenticate, upload.single('image'), decode);

// image analysis requires auth (uses paid LLM API)
router.post('/analyze-image', authenticate, upload.single('image'), analyzeImage);

export default router;
