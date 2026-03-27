import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { deleteFromCloudinary } from '../services/cloudinaryService';

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

    // Clean up Cloudinary asset if present
    if (prompt.publicId) {
      try { await deleteFromCloudinary(prompt.publicId); } catch { /* best-effort */ }
    }

    await prisma.prompt.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
}
