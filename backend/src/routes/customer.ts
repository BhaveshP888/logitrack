import { Router, Response } from 'express';
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { generateUniqueTrackingNumber } from '../utils/tracking.js';
import { logShipmentEvent, broadcastMetrics } from '../simulation.js';

export const customerRouter = Router();

customerRouter.use(verifyToken);
customerRouter.use(requireRole('CUSTOMER'));

function calculateDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return Math.round(R * c);
}

// Commercial Freight Rate: Base (2500 INR) + Distance Rate (18 INR/km) + Weight Surcharge
const BASE_RATE = 2500;
const RATE_PER_KM = 18;
const RATE_PER_KG = 2.0;

// Customer Stats
customerRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  try {
    const shipments = await prisma.shipment.findMany({
      where: { customerId: userId },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        items: true,
        proofOfDelivery: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalSpend = shipments.reduce((sum, s) => sum + (s.price || s.rateAmount || 0), 0);
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
        monthlySpend[monthName] += (s.price || s.rateAmount || 0);
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

// Customer Shipments
customerRouter.get('/shipments', async (req: AuthRequest, res: Response) => {
  try {
    const page = req.query.page ? Math.max(1, parseInt(req.query.page as string) || 1) : undefined;
    const limit = req.query.limit ? Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50)) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const shipments = await prisma.shipment.findMany({
      where: { customerId: req.user?.id },
      skip,
      take: limit,
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        driver: { select: { name: true, phone: true } },
        vehicle: { select: { licensePlate: true, modelName: true, vehicleType: true } },
        items: true,
        checkpoints: {
          orderBy: { orderIndex: 'asc' }
        },
        events: {
          orderBy: { createdAt: 'desc' }
        },
        proofOfDelivery: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

// Customer Invoices
customerRouter.get('/invoices', async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        shipment: {
          customerId: req.user?.id
        }
      },
      include: {
        shipment: {
          select: {
            trackingNumber: true,
            originWarehouse: { select: { name: true } },
            destinationWarehouse: { select: { name: true } },
            actualDeliveryDate: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Customer Book Shipment
customerRouter.post('/book', async (req: AuthRequest, res: Response) => {
  const {
    originWarehouseId,
    destinationWarehouseId,
    contentDescription,
    targetDispatchDate,
    items
  } = req.body;

  if (!originWarehouseId || !destinationWarehouseId || !targetDispatchDate) {
    return res.status(400).json({ error: 'Missing required shipment booking fields' });
  }

  try {
    const origin = await prisma.warehouse.findUnique({ where: { id: originWarehouseId } });
    const destination = await prisma.warehouse.findUnique({ where: { id: destinationWarehouseId } });

    if (!origin || !destination) {
      return res.status(404).json({ error: 'Origin or Destination Warehouse not found' });
    }

    // Calculate real distance
    const distanceKm = calculateDistanceKM(origin.latitude, origin.longitude, destination.latitude, destination.longitude);

    // Calculate cargo weight and HazMat surcharges
    let totalWeightKg = 0;
    let hasHazmat = false;

    const parsedItems = (items && items.length > 0) ? items.map((it: any) => {
      const weight = parseFloat(it.weightKg) || 250.0;
      totalWeightKg += weight;
      if (it.isHazmat) hasHazmat = true;
      return {
        description: it.description || 'Commercial Freight Cargo',
        quantity: parseInt(it.quantity) || 1,
        weightKg: weight,
        volumeCbm: parseFloat(it.volumeCbm) || 1.5,
        isHazmat: !!it.isHazmat,
      };
    }) : [
      {
        description: contentDescription || 'Industrial Palletized Consignment',
        quantity: 1,
        weightKg: 500.0,
        volumeCbm: 2.5,
        isHazmat: false
      }
    ];

    if (totalWeightKg === 0) totalWeightKg = 500.0;

    // Rate Calculation
    const calculatedRate = Math.round(
      BASE_RATE + (distanceKm * RATE_PER_KM) + (totalWeightKg * RATE_PER_KG) + (hasHazmat ? 3500 : 0)
    );

    const trackingNumber = await generateUniqueTrackingNumber();
    const dispatchDate = new Date(targetDispatchDate);
    // Estimated delivery = dispatchDate + (distance / 45 km/h driving speed)
    const transitHours = Math.max(4, Math.round(distanceKm / 45));
    const estimatedDelivery = new Date(dispatchDate.getTime() + transitHours * 3600000);

    // Create 3-4 intermediate checkpoints along linear line
    const intermediateCount = 3;
    const generatedCheckpoints = [];
    for (let i = 1; i <= intermediateCount; i++) {
      const frac = i / (intermediateCount + 1);
      const cpLat = origin.latitude + (destination.latitude - origin.latitude) * frac;
      const cpLng = origin.longitude + (destination.longitude - origin.longitude) * frac;
      generatedCheckpoints.push({
        name: `Transit Corridor Waypoint #${i} (${origin.city} → ${destination.city})`,
        orderIndex: i,
        latitude: parseFloat(cpLat.toFixed(4)),
        longitude: parseFloat(cpLng.toFixed(4)),
        reached: false,
      });
    }

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber,
        status: 'PENDING',
        originWarehouseId,
        destinationWarehouseId,
        customerId: req.user?.id,
        price: calculatedRate,
        rateAmount: calculatedRate,
        currency: 'INR',
        contentDescription: contentDescription || parsedItems[0].description,
        targetDispatchDate: dispatchDate,
        estimatedDeliveryDate: estimatedDelivery,
        items: {
          create: parsedItems
        },
        checkpoints: {
          create: generatedCheckpoints
        },
        events: {
          create: [
            {
              status: 'BOOKED',
              description: `Consignment booked by ${req.user?.email}. Estimated distance: ${distanceKm} km. Rate: ₹${calculatedRate.toLocaleString()}`,
              location: origin.city
            }
          ]
        }
      },
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        items: true,
        checkpoints: { orderBy: { orderIndex: 'asc' } },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('SHIPMENT_CREATED', shipment);
      await broadcastMetrics(io);
    }

    res.json({ success: true, shipment, distanceKm, rate: calculatedRate });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ error: 'Failed to book shipment' });
  }
});
