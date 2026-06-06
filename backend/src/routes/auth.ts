import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db.js';
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

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
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

authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Find the first warehouse to assign the new driver to
    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      return res.status(500).json({ error: "No warehouse found to assign driver" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      // Create new driver record
      const driver = await tx.driver.create({
        data: {
          name,
          status: 'AVAILABLE',
          warehouseId: warehouse.id
        }
      });

      // Create new user account linked to the driver
      return tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'DRIVER',
          driverId: driver.id
        }
      });
    });

    const payload = { id: user.id, email: user.email, role: user.role, driverId: user.driverId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({ user: { id: user.id, email: user.email, role: user.role, driverId: user.driverId } });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true });
});
