import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token." });
  }
}

export function requireRole(role: 'ADMIN' | 'DRIVER') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden. Requires ${role} role. (You have: ${req.user?.role})` });
    }
    next();
  };
}
