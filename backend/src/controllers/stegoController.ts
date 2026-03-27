import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { AuthRequest } from '../middleware/auth';
import { encodeMessage, decodeMessage, getMaxMessageBytes } from '../services/steganography';
import { analyzeImageContext } from '../services/llmService';
import { prisma } from '../config/database';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function encode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const { message, password } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const inputPath = req.file.path;
    const outputFilename = `encoded_${Date.now()}_${Math.random().toString(36).slice(2)}.png`;

    ensureDir(path.join(UPLOADS_DIR, 'encoded'));
    const outputPath = path.join(UPLOADS_DIR, 'encoded', outputFilename);

    const meta = await sharp(inputPath).metadata();
    const maxBytes = getMaxMessageBytes(meta.width!, meta.height!);
    if (message.length > maxBytes) {
      res.status(400).json({
        error: `Message too long. This image can hold up to ${maxBytes} characters.`,
      });
      return;
    }

    await encodeMessage(inputPath, message, outputPath, password || undefined);

    const outputBuffer = fs.readFileSync(outputPath);
    const base64 = outputBuffer.toString('base64');

    let promptId: string | null = null;

    if (req.user) {
      const prompt = await prisma.prompt.create({
        data: {
          userId: req.user.userId,
          type: 'encode',
          inputImage: path.relative(UPLOADS_DIR, inputPath),
          message,
          outputImage: path.join('encoded', outputFilename),
          hasPassword: !!password,
        },
      });
      promptId = prompt.id;
    }

    res.json({
      promptId,
      outputImage: `data:image/png;base64,${base64}`,
      outputFilename,
      saved: !!req.user,
    });
  } catch (err) {
    next(err);
  }
}

export async function decode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const { password, analyze } = req.body;
    const imagePath = req.file.path;

    let extractedMessage: string;
    try {
      extractedMessage = await decodeMessage(imagePath, password || undefined);
    } catch (err: unknown) {
      const error = err as Error;
      if (
        error.message.includes('No hidden message found') ||
        error.message.includes('bad decrypt') ||
        error.message.includes('wrong final block')
      ) {
        res.status(422).json({
          error: password
            ? 'Could not decode. The password may be incorrect, or this image has no hidden message.'
            : 'No hidden message found in this image.',
        });
        return;
      }
      throw err;
    }

    let promptId: string | null = null;

    if (req.user) {
      const prompt = await prisma.prompt.create({
        data: {
          userId: req.user.userId,
          type: 'decode',
          inputImage: path.relative(UPLOADS_DIR, imagePath),
          message: extractedMessage,
          hasPassword: !!password,
        },
      });
      promptId = prompt.id;
    }

    let analysis: string | null = null;
    if (analyze === 'true' || analyze === true) {
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        const b64 = imageBuffer.toString('base64');
        const ext = path.extname(imagePath).toLowerCase();
        const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';
        analysis = await analyzeImageContext(b64, mediaType, true);
      } catch {
        // LLM analysis is optional
      }
    }

    res.json({ promptId, message: extractedMessage, analysis, saved: !!req.user });
  } catch (err) {
    next(err);
  }
}

export async function analyzeImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(req.file.path).toLowerCase();
    const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

    const analysis = await analyzeImageContext(base64, mediaType, false);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
}
