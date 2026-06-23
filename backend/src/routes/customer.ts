import { Router, Response } from 'express';
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db.js';

export const customerRouter = Router();

customerRouter.use(verifyToken);
customerRouter.use(requireRole('CUSTOMER'));

// Hub Coordinates for Distance Calculation
const HUB_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Mumbai Hub': { lat: 19.0760, lon: 72.8777 },
  'Pune Hub': { lat: 18.5204, lon: 73.8567 },
  'Nagpur Hub': { lat: 21.1458, lon: 79.0882 },
  'Nashik Hub': { lat: 19.9975, lon: 73.7898 },
  'Aurangabad Hub': { lat: 19.8762, lon: 75.3433 },
};

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c; 
  return distance;
}

// RATE = 15 Rupees per KM
const RATE_PER_KM = 15;

customerRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    const shipments = await prisma.shipment.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const totalSpend = shipments.reduce((sum, s) => sum + (s.price || 0), 0);
    const activeShipments = shipments.filter(s => s.status !== 'DELIVERED').length;

    // Aggregate monthly spend for charts (last 6 months)
    const monthlySpend: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      monthlySpend[monthName] = 0;
    }

    shipments.forEach(s => {
      const d = new Date(s.createdAt);
      const monthName = d.toLocaleString('default', { month: 'short' });
      if (monthlySpend[monthName] !== undefined) {
        monthlySpend[monthName] += (s.price || 0);
      }
    });

    const spendChartData = Object.keys(monthlySpend).map(month => ({
      name: month,
      spend: monthlySpend[month]
    }));

    res.json({
      totalSpend,
      totalShipments: shipments.length,
      activeShipments,
      spendChartData,
      recentShipments: shipments.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer stats' });
  }
});

customerRouter.get('/shipments', async (req: AuthRequest, res: Response) => {
  try {
    const shipments = await prisma.shipment.findMany({
      where: { customerId: req.user?.id },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        checkpoints: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

customerRouter.post('/book', async (req: AuthRequest, res: Response) => {
  const { originWarehouseId, destinationWarehouseId, contentDescription, targetDispatchDate } = req.body;

  if (!originWarehouseId || !destinationWarehouseId || !contentDescription || !targetDispatchDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const origin = await prisma.warehouse.findUnique({ where: { id: originWarehouseId } });
    const destination = await prisma.warehouse.findUnique({ where: { id: destinationWarehouseId } });

    if (!origin || !destination) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Calculate Price based on distance
    let price = 500; // Base price
    const originCoords = HUB_COORDINATES[origin.name];
    const destCoords = HUB_COORDINATES[destination.name];

    if (originCoords && destCoords) {
      const distance = calculateDistanceKM(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
      price = Math.max(500, Math.round(distance * RATE_PER_KM)); // Base 500 or Distance * Rate
    }

    const trackingNumber = `TRK-${Date.now().toString().slice(-6)}`;

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber,
        status: 'PENDING',
        originWarehouseId,
        destinationWarehouseId,
        customerId: req.user?.id,
        price,
        contentDescription,
        targetDispatchDate: new Date(targetDispatchDate),
        checkpoints: {
          create: [
            { name: 'Dispatched from Origin', orderIndex: 1 },
            { name: 'In Transit', orderIndex: 2 },
            { name: 'Arrived at Destination Hub', orderIndex: 3 },
            { name: 'Out for Delivery', orderIndex: 4 }
          ]
        }
      }
    });

    res.json({ success: true, shipment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book shipment' });
  }
});
