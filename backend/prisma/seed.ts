import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚚 Seeding LogiTrack Enterprise TMS Database...");

  // Clean old records
  await prisma.proofOfDelivery.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipmentCheckpoint.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.warehouse.deleteMany();

  // 1. Warehouses (Major Logistics Hubs)
  const wMumbai = await prisma.warehouse.create({
    data: {
      code: 'BOM-01',
      name: 'Mumbai Central Gateway Hub',
      address: 'Plot 14, JNPT Logistics Park, Nhava Sheva',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      latitude: 18.9500,
      longitude: 72.9500,
      capacityCbm: 12000.0,
    }
  });

  const wPune = await prisma.warehouse.create({
    data: {
      code: 'PNQ-01',
      name: 'Pune Industrial Freight Depot',
      address: 'Sector 7, Chakan Industrial Area Phase II',
      city: 'Pune',
      state: 'Maharashtra',
      latitude: 18.7606,
      longitude: 73.8636,
      capacityCbm: 8500.0,
    }
  });

  const wNagpur = await prisma.warehouse.create({
    data: {
      code: 'NAG-01',
      name: 'Nagpur Transshipment Terminal',
      address: 'MIHAN Multi-modal Cargo Hub, Wardha Road',
      city: 'Nagpur',
      state: 'Maharashtra',
      latitude: 21.0500,
      longitude: 79.0300,
      capacityCbm: 15000.0,
    }
  });

  const wNashik = await prisma.warehouse.create({
    data: {
      code: 'NSK-01',
      name: 'Nashik Agro-Industrial Depot',
      address: 'MIDC Ambad Freight Corridor',
      city: 'Nashik',
      state: 'Maharashtra',
      latitude: 19.9372,
      longitude: 73.7314,
      capacityCbm: 6000.0,
    }
  });

  const wBengaluru = await prisma.warehouse.create({
    data: {
      code: 'BLR-01',
      name: 'Bengaluru Tech Corridor Depot',
      address: 'Hosakote Logistics & Freight Park',
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 13.0700,
      longitude: 77.7900,
      capacityCbm: 10000.0,
    }
  });

  // 2. Commercial Vehicles (Fleet)
  const v1 = await prisma.vehicle.create({
    data: {
      licensePlate: 'MH-04-GP-8812',
      modelName: 'Tata Prima 5530.S',
      vehicleType: 'SEMI_TRAILER_53FT',
      maxWeightKg: 28000.0,
      maxVolumeCbm: 110.0,
      currentWarehouseId: wMumbai.id,
    }
  });

  const v2 = await prisma.vehicle.create({
    data: {
      licensePlate: 'MH-12-QX-4409',
      modelName: 'BharatBenz 2823R',
      vehicleType: 'BOX_TRUCK_24FT',
      maxWeightKg: 16000.0,
      maxVolumeCbm: 65.0,
      currentWarehouseId: wPune.id,
    }
  });

  const v3 = await prisma.vehicle.create({
    data: {
      licensePlate: 'MH-31-TR-9120',
      modelName: 'Eicher Pro 6028',
      vehicleType: 'REFRIGERATED_VAN',
      maxWeightKg: 14000.0,
      maxVolumeCbm: 55.0,
      currentWarehouseId: wNagpur.id,
    }
  });

  // 3. Drivers
  const d1 = await prisma.driver.create({
    data: {
      name: 'Rajesh Kumar',
      licenseNumber: 'MH-04-2018-009182',
      phone: '+91 98201 11223',
      status: 'AVAILABLE',
      warehouseId: wMumbai.id,
      currentLatitude: 18.9500,
      currentLongitude: 72.9500,
    }
  });

  const d2 = await prisma.driver.create({
    data: {
      name: 'Amit Patil',
      licenseNumber: 'MH-12-2020-004512',
      phone: '+91 98202 33445',
      status: 'AVAILABLE',
      warehouseId: wPune.id,
      currentLatitude: 18.7606,
      currentLongitude: 73.8636,
    }
  });

  // 4. Users (Authentication & Roles)
  const adminPasswordHash = await bcrypt.hash('Adminlogin@1212', 10);
  const driverPasswordHash = await bcrypt.hash('Driver@123', 10);
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

  // Admin User
  await prisma.user.create({
    data: {
      email: 'admin@logitrack.com',
      name: 'Operations Director',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      companyName: 'LogiTrack Global Operations',
    }
  });

  // Dispatcher User
  await prisma.user.create({
    data: {
      email: 'dispatcher@logitrack.com',
      name: 'Central Dispatch Controller',
      passwordHash: adminPasswordHash,
      role: 'DISPATCHER',
      companyName: 'LogiTrack Freight Division',
    }
  });

  // Driver Users
  await prisma.user.create({
    data: {
      email: 'driver1@logitrack.com',
      name: 'Rajesh Kumar',
      passwordHash: driverPasswordHash,
      role: 'DRIVER',
      driverId: d1.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'driver2@logitrack.com',
      name: 'Amit Patil',
      passwordHash: driverPasswordHash,
      role: 'DRIVER',
      driverId: d2.id,
    }
  });

  // Enterprise Shipper Users
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@logitrack.com',
      name: 'Vikram Mehta',
      companyName: 'Apex Industrial Logistics Ltd',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
    }
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'shipper@tatasteel.com',
      name: 'Supply Chain Operations',
      companyName: 'Tata Precision Logistics',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
    }
  });

  const now = new Date();

  // 5. Active In-Transit Shipment (TRK-2026-8801)
  const futureArrival = new Date(now.getTime() + 1000 * 60 * 60 * 8); // +8h
  const activeShipment = await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-2026-8801',
      status: 'EN_ROUTE',
      originWarehouseId: wMumbai.id,
      destinationWarehouseId: wNagpur.id,
      driverId: d1.id,
      vehicleId: v1.id,
      customerId: customer1.id,
      price: 24500.0,
      rateAmount: 24500.0,
      currency: 'INR',
      contentDescription: 'High-Precision Automotive Engine Assemblies (12 Pallets)',
      targetDispatchDate: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3h ago
      actualDispatchDate: new Date(now.getTime() - 1000 * 60 * 60 * 3),
      estimatedDeliveryDate: futureArrival,
      items: {
        create: [
          { description: 'Engine Block Components (Euro-6)', quantity: 8, weightKg: 8400.0, volumeCbm: 18.5, isHazmat: false },
          { description: 'Transmission Gearboxes', quantity: 4, weightKg: 3600.0, volumeCbm: 10.2, isHazmat: false },
        ]
      },
      checkpoints: {
        create: [
          { name: 'Thane North Freight Plaza', orderIndex: 1, reached: true, reachedAt: new Date(now.getTime() - 1000 * 60 * 120), latitude: 19.2183, longitude: 72.9781 },
          { name: 'Igatpuri Mountain Checkpost', orderIndex: 2, reached: true, reachedAt: new Date(now.getTime() - 1000 * 60 * 45), latitude: 19.6967, longitude: 73.5622 },
          { name: 'Jalna Agro Transshipment Point', orderIndex: 3, reached: false, latitude: 19.8410, longitude: 75.8867 },
          { name: 'Wardha Valley Expressway Gate', orderIndex: 4, reached: false, latitude: 20.7453, longitude: 78.6022 },
        ]
      },
      events: {
        create: [
          { status: 'BOOKED', description: 'Consignment booked by Apex Industrial Logistics Ltd', location: 'Navi Mumbai Hub' },
          { status: 'ASSIGNED', description: 'Driver Rajesh Kumar and Vehicle MH-04-GP-8812 allocated', location: 'Navi Mumbai Hub' },
          { status: 'DISPATCHED', description: 'Cargo departed Mumbai Central Gateway Hub', location: 'Navi Mumbai Hub' },
          { status: 'IN_TRANSIT', description: 'Cleared Igatpuri Mountain Checkpost', location: 'Igatpuri Checkpost' },
        ]
      }
    }
  });

  // Mark Driver 1 as ON_DELIVERY
  await prisma.driver.update({
    where: { id: d1.id },
    data: { status: 'ON_DELIVERY' }
  });

  // 6. Pending Booking (TRK-2026-9902)
  await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-2026-9902',
      status: 'PENDING',
      originWarehouseId: wPune.id,
      destinationWarehouseId: wBengaluru.id,
      driverId: null,
      vehicleId: null,
      customerId: customer1.id,
      price: 18200.0,
      rateAmount: 18200.0,
      currency: 'INR',
      contentDescription: 'Pharmaceutical Cold-Chain Vaccines & Medical Syringes',
      targetDispatchDate: new Date(now.getTime() + 1000 * 60 * 60 * 4), // +4h
      estimatedDeliveryDate: new Date(now.getTime() + 1000 * 60 * 60 * 22),
      items: {
        create: [
          { description: 'Temperature-Controlled Vaccine Insulated Boxes', quantity: 24, weightKg: 2800.0, volumeCbm: 14.0, isHazmat: false },
        ]
      },
      checkpoints: {
        create: [
          { name: 'Satara Highway Weigh Station', orderIndex: 1, reached: false, latitude: 17.6805, longitude: 74.0183 },
          { name: 'Kolhapur Transit Hub', orderIndex: 2, reached: false, latitude: 16.7050, longitude: 74.2433 },
          { name: 'Hubballi Freight Bypass', orderIndex: 3, reached: false, latitude: 15.3647, longitude: 75.1240 },
          { name: 'Tumakuru Toll Plaza', orderIndex: 4, reached: false, latitude: 13.3409, longitude: 77.1010 },
        ]
      },
      events: {
        create: [
          { status: 'BOOKED', description: 'Cold chain shipment booked. Awaiting dispatcher vehicle assignment', location: 'Pune Depot' },
        ]
      }
    }
  });

  // 7. Completed Shipments with Proof of Delivery & Invoices
  for (let i = 1; i <= 5; i++) {
    const pastDate = new Date(now.getTime() - i * 4 * 24 * 60 * 60 * 1000);
    const delivDate = new Date(pastDate.getTime() + 26 * 60 * 60 * 1000);
    const amount = 14500 + i * 2200;

    const completedShipment = await prisma.shipment.create({
      data: {
        trackingNumber: `TRK-2026-00${i}0`,
        status: 'DELIVERED',
        originWarehouseId: wMumbai.id,
        destinationWarehouseId: wPune.id,
        driverId: d2.id,
        vehicleId: v2.id,
        customerId: i % 2 === 0 ? customer1.id : customer2.id,
        price: amount,
        rateAmount: amount,
        currency: 'INR',
        contentDescription: `Industrial Fasteners & Sheet Metal Crates (Batch ${i})`,
        targetDispatchDate: pastDate,
        actualDispatchDate: pastDate,
        estimatedDeliveryDate: delivDate,
        actualDeliveryDate: delivDate,
        createdAt: pastDate,
        updatedAt: delivDate,
        items: {
          create: [
            { description: 'High-Tensile Steel Fasteners', quantity: 10, weightKg: 4500.0, volumeCbm: 8.0, isHazmat: false }
          ]
        },
        checkpoints: {
          create: [
            { name: 'Navi Mumbai Toll Plaza', orderIndex: 1, reached: true, reachedAt: new Date(pastDate.getTime() + 3 * 3600000) },
            { name: 'Lonavala Ghat Waypoint', orderIndex: 2, reached: true, reachedAt: new Date(pastDate.getTime() + 8 * 3600000) },
            { name: 'Talegaon Industrial Gate', orderIndex: 3, reached: true, reachedAt: new Date(pastDate.getTime() + 18 * 3600000) },
          ]
        },
        events: {
          create: [
            { status: 'BOOKED', description: 'Consignment confirmed and paid', location: 'Navi Mumbai', createdAt: pastDate },
            { status: 'DISPATCHED', description: 'Dispatched from Mumbai Central Gateway', location: 'Navi Mumbai', createdAt: pastDate },
            { status: 'DELIVERED', description: 'Delivered at Pune Industrial Depot. Signed by Receiving Supervisor', location: 'Pune Depot', createdAt: delivDate },
          ]
        }
      }
    });

    // Create Proof of Delivery
    await prisma.proofOfDelivery.create({
      data: {
        shipmentId: completedShipment.id,
        receivedBy: `K. S. Sharma (Warehouse Manager)`,
        signatureData: 'SIG_VERIFIED_DIGITAL_OK',
        deliveryLat: 18.7606,
        deliveryLng: 73.8636,
        notes: 'Cargo inspected and verified with zero damage. All 10 crates intact.',
        signedAt: delivDate,
      }
    });

    // Create Invoice
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-00${i}8`,
        shipmentId: completedShipment.id,
        amount: amount,
        taxAmount: amount * 0.18,
        currency: 'INR',
        status: 'PAID',
        issuedAt: pastDate,
        paidAt: delivDate,
      }
    });
  }

  console.log("✅ Seed completed successfully with Enterprise Hubs, Fleets, Consignments, Events, and Invoices!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
