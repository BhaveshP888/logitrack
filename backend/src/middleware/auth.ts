import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const secret = process.env.JWT_SECRET;
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error("FATAL: JWT_SECRET environment variable is required in production.");
}
export const JWT_SECRET = secret || 'dev-fallback-super-secret-key-12345';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'DRIVER';
    driverId: string | null;
  };
}

export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token;
  const refreshToken = req.cookies?.refreshToken;

  if (!token && !refreshToken) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        return next();
      } catch (err: any) {
        if (err.name !== 'TokenExpiredError') {
          res.status(401).json({ error: "Invalid token." });
          return;
        }
        // If it's expired, we fall through to the refresh logic
      }
    }

    // Silent Refresh Logic
    if (!refreshToken) {
      res.status(401).json({ error: "Access token expired and no refresh token provided." });
      return;
    }

    const storedRefresh = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedRefresh || storedRefresh.expiresAt < new Date()) {
      res.status(401).json({ error: "Invalid or expired refresh token." });
      return;
    }

    // Generate new short-lived access token
    const user = storedRefresh.user;
    const payload = { id: user.id, email: user.email, role: user.role, driverId: user.driverId };
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

    // Set new cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    req.user = payload as any;
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error during authentication." });
  }
}

export function requireRole(role: 'ADMIN' | 'DRIVER') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: `Forbidden. Requires ${role} role. (You have: ${req.user?.role})` });
      return;
    }
    next();
  };
}
