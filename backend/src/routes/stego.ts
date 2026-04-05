import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { encode, decode, analyzeImage } from '../controllers/stegoController';
import { rawUploadDir, ensureUploadDirs } from '../config/uploadPaths';

ensureUploadDirs();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, rawUploadDir),
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

const maxBytes = process.env.VERCEL === '1' ? 4 * 1024 * 1024 : 10 * 1024 * 1024;
const upload = multer({ storage, fileFilter, limits: { fileSize: maxBytes } });

const router = Router();

router.post('/encode', optionalAuthenticate, upload.single('image'), encode);
router.post('/decode', optionalAuthenticate, upload.single('image'), decode);
router.post('/analyze-image', authenticate, upload.single('image'), analyzeImage);

export default router;
