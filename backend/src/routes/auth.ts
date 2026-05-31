import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-12345';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const payload = { id: user.id, email: user.email, role: user.role, driverId: user.driverId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({ user: { id: user.id, email: user.email, role: user.role, driverId: user.driverId } });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

authRouter.get('/me', verifyToken, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true });
});
