import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { verifyToken, AuthRequest, JWT_SECRET } from '../middleware/auth.js';
import { prisma } from '../db.js';

export const authRouter = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per `window`
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password validation (min 8 chars, uppercase, lowercase, number, special char)
const isValidPassword = (password: string) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const,
  };

  res.cookie('token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

authRouter.post('/login', authLimiter, async (req, res) => {
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
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    
    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt
      }
    });

    setAuthCookies(res, accessToken, refreshTokenString);

    return res.json({ user: { id: user.id, email: user.email, role: user.role, driverId: user.driverId } });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

authRouter.get('/me', verifyToken, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

authRouter.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, role = 'DRIVER' } = req.body;
  
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  
  if (!isValidPassword(password)) {
    return res.status(400).json({ 
      error: "Password must be at least 8 characters long, and include an uppercase letter, a lowercase letter, a number, and a special character." 
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (role === 'CUSTOMER') {
      // Create new customer account
      await prisma.user.create({
        data: {
          email: trimmedEmail,
          passwordHash,
          role: 'CUSTOMER',
        }
      });
    } else {
      // Find the first warehouse to assign the new driver to
      const warehouse = await prisma.warehouse.findFirst();
      if (!warehouse) {
        return res.status(500).json({ error: "No warehouse found to assign driver" });
      }

      // Create new driver record
      const driver = await prisma.driver.create({
        data: {
          name: trimmedName,
          status: 'AVAILABLE',
          warehouseId: warehouse.id
        }
      });

      // Create new user account linked to the driver
      await prisma.user.create({
        data: {
          email: trimmedEmail,
          passwordHash,
          role: 'DRIVER',
          driverId: driver.id
        }
      });
    }

    return res.json({ success: true, message: "Registration successful. Please sign in." });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error during registration" });
  }
});

authRouter.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (refreshToken) {
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    } catch (err) {
      console.error("Error deleting refresh token during logout", err);
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' as const : 'lax' as const
  };

  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  
  return res.json({ success: true });
});
