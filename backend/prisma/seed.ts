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
  // Check if database is already seeded
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded. Skipping seeding.");
    return;
  }

  // Clear old data
  await prisma.user.deleteMany({});
  await prisma.shipmentCheckpoint.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.warehouse.deleteMany({});

  // Hash passwords
  const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL || 'admin@logitrack.com';
  const adminPasswordHash = await bcrypt.hash('Adminlogin@1212', 10);
  const driverPasswordHash = await bcrypt.hash('Driver@123', 10);

  // Create warehouses
  const w1 = await prisma.warehouse.create({ data: { name: 'Mumbai Hub' } });
  const w2 = await prisma.warehouse.create({ data: { name: 'Pune Hub' } });
  const w3 = await prisma.warehouse.create({ data: { name: 'Nagpur Hub' } });
  const w4 = await prisma.warehouse.create({ data: { name: 'Nashik Hub' } });
  const w5 = await prisma.warehouse.create({ data: { name: 'Aurangabad Hub' } });

  // Create admin user
  await prisma.user.create({
    data: { email: adminEmail, passwordHash: adminPasswordHash, role: 'ADMIN' }
  });

  // Create customer user
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);
  const customerUser = await prisma.user.create({
    data: { email: 'customer@logitrack.com', passwordHash: customerPasswordHash, role: 'CUSTOMER' }
  });

  // Create a driver user
  const d1 = await prisma.driver.create({
    data: { name: 'Rajesh Kumar', status: 'AVAILABLE', warehouseId: w1.id }
  });
  await prisma.user.create({
    data: { email: 'driver1@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d1.id }
  });

  const now = new Date();

  // Create a few past shipments for the customer to show in the "Spend this month" chart
  for (let i = 1; i <= 5; i++) {
    const pastDate = new Date(now.getTime() - i * 5 * 24 * 60 * 60 * 1000); // Past days
    await prisma.shipment.create({
      data: {
        trackingNumber: `TRK-PAST-00${i}`,
        status: 'DELIVERED',
        originWarehouseId: w1.id,
        destinationWarehouseId: w2.id,
        driverId: d1.id,
        customerId: customerUser.id,
        price: 1500 + (Math.random() * 1000), // Random price around 2000 INR
        contentDescription: `Electronics Batch ${i}`,
        targetDispatchDate: pastDate,
        actualDispatchDate: pastDate,
        createdAt: pastDate,
        updatedAt: new Date(pastDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });
  }

  // Seed sample active shipment with checkpoints
  const futureDispatch = new Date(now.getTime() + 1000 * 60 * 60 * 2); // +2 hours

  await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-SEED-001',
      status: 'PENDING',
      originWarehouseId: w1.id,
      destinationWarehouseId: w3.id,
      driverId: null,
      customerId: customerUser.id,
      price: 3500.0,
      contentDescription: 'Medical Supplies',
      targetDispatchDate: futureDispatch,
      checkpoints: {
        create: [
          { name: 'Thane Sorting Center', orderIndex: 1 },
          { name: 'Kalyan Toll Plaza', orderIndex: 2 },
          { name: 'Igatpuri Checkpost', orderIndex: 3 }
        ]
      }
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
