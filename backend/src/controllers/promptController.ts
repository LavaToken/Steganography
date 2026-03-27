import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export async function getPrompts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          inputImage: true,
          message: true,
          outputImage: true,
          hasPassword: true,
          createdAt: true,
        },
      }),
      prisma.prompt.count({ where: { userId: req.user!.userId } }),
    ]);

    res.json({
      prompts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePrompt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const prompt = await prisma.prompt.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    // Clean up files
    const filesToDelete = [prompt.inputImage, prompt.outputImage].filter(Boolean);
    for (const filePath of filesToDelete) {
      const fullPath = path.join(UPLOADS_DIR, filePath!);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await prisma.prompt.delete({ where: { id: id as string } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getPromptImage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const type = req.query['type'] as string | undefined;

    const prompt = await prisma.prompt.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }

    const imagePath = type === 'output' ? prompt.outputImage : prompt.inputImage;
    if (!imagePath) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    const fullPath = path.join(UPLOADS_DIR, imagePath);
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Image file not found' });
      return;
    }

    res.sendFile(fullPath);
  } catch (err) {
    next(err);
  }
}
