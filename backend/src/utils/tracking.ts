import crypto from 'crypto';
import { prisma } from '../db.js';

/**
 * Generates a collision-resistant unique tracking number.
 * Format: TRK-YYYYMMDD-XXXXXX (where X is upper alphanumeric hex)
 */
export async function generateUniqueTrackingNumber(maxAttempts = 5): Promise<string> {
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
    const candidate = `TRK-${datePrefix}-${randomBytes}`;

    const existing = await prisma.shipment.findUnique({
      where: { trackingNumber: candidate },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }
  }

  // Fallback with high-entropy timestamp + random
  return `TRK-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}
