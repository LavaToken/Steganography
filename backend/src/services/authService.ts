import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { signToken } from '../utils/jwt';

const SALT_ROUNDS = 12;

export async function registerUser(email: string, password: string, username?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, password: hashed, username: username || null },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });

  const token = signToken({ userId: user.id, email: user.email });
  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
}
