import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, loginUser } from '../services/authService';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').optional().trim().isLength({ min: 2, max: 30 }),
];

export const signinValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return;
  }

  try {
    const { email, password, username } = req.body;
    const result = await registerUser(email, password, username);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function signin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Invalid email or password' });
    return;
  }

  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, username: true, avatar: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
