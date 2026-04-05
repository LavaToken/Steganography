import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { AuthRequest } from '../middleware/auth';
import { encodeMessage, decodeMessage, getMaxMessageBytes } from '../services/steganography';
import { analyzeImageContext } from '../services/llmService';
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
} from '../services/cloudinaryService';
import { prisma } from '../config/database';
import { tempEncodeDir, ensureUploadDirs } from '../config/uploadPaths';

ensureUploadDirs();

function cleanupFile(filePath: string) {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* best-effort */ }
}

export async function encode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const inputPath = req.file?.path ?? null;

  try {
    if (!inputPath) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const { message, password } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Capacity check
    const meta = await sharp(inputPath).metadata();
    const maxBytes = getMaxMessageBytes(meta.width!, meta.height!);
    if (message.length > maxBytes) {
      res.status(400).json({
        error: `Message too long. This image can hold up to ${maxBytes} characters.`,
      });
      return;
    }

    // LSB encode to a temp file
    const tempFilename = `enc_${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
    const tempOutputPath = path.join(tempEncodeDir, tempFilename);
    await encodeMessage(inputPath, message, tempOutputPath, password || undefined);

    const outputBuffer = fs.readFileSync(tempOutputPath);
    cleanupFile(tempOutputPath);

    // If Cloudinary is configured, upload; otherwise fall back to base64
    let outputImage: string;
    let publicId: string | null = null;

    if (isCloudinaryConfigured()) {
      const cloudResult = await uploadToCloudinary(
        outputBuffer,
        `encoded_${Date.now()}`,
        'stego/encoded'
      );
      outputImage = cloudResult.url;
      publicId = cloudResult.publicId;
    } else {
      // Fallback: base64 data URL (no Cloudinary credentials set)
      outputImage = `data:image/png;base64,${outputBuffer.toString('base64')}`;
    }

    let promptId: string | null = null;
    if (req.user) {
      const prompt = await prisma.prompt.create({
        data: {
          userId: req.user.userId,
          type: 'encode',
          message,
          outputImage,
          publicId,
          hasPassword: !!password,
        },
      });
      promptId = prompt.id;
    }

    res.json({
      promptId,
      outputImage,
      outputFilename: `stego_encoded_${Date.now()}.png`,
      saved: !!req.user,
    });
  } catch (err) {
    next(err);
  } finally {
    // Always clean up the uploaded input file
    if (inputPath) cleanupFile(inputPath);
  }
}

export async function decode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const imagePath = req.file?.path ?? null;

  try {
    if (!imagePath) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const { password, analyze } = req.body;

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
        // LLM analysis is optional — never fail the request for this
      }
    }

    res.json({ promptId, message: extractedMessage, analysis, saved: !!req.user });
  } catch (err) {
    next(err);
  } finally {
    if (imagePath) cleanupFile(imagePath);
  }
}

export async function analyzeImage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const imagePath = req.file?.path ?? null;
  try {
    if (!imagePath) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

    const analysis = await analyzeImageContext(base64, mediaType, false);
    res.json({ analysis });
  } catch (err) {
    next(err);
  } finally {
    if (imagePath) cleanupFile(imagePath);
  }
}
