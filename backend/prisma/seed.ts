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
  await prisma.shipment.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.warehouse.deleteMany({});

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const newAdminPasswordHash = await bcrypt.hash('adminlogin1212', 10);
  const driverPasswordHash = await bcrypt.hash('driver123', 10);

  // Create warehouses
  const w1 = await prisma.warehouse.create({ data: { name: 'Mumbai Hub' } });
  const w2 = await prisma.warehouse.create({ data: { name: 'Pune Hub' } });
  const w3 = await prisma.warehouse.create({ data: { name: 'Nagpur Hub' } });
  const w4 = await prisma.warehouse.create({ data: { name: 'Nashik Hub' } });
  const w5 = await prisma.warehouse.create({ data: { name: 'Aurangabad Hub' } });

  // Create drivers and link to users
  const d1 = await prisma.driver.create({ data: { name: 'Rajesh Kumar', status: 'AVAILABLE', warehouseId: w1.id } });
  const d2 = await prisma.driver.create({ data: { name: 'Amit Patil', status: 'AVAILABLE', warehouseId: w2.id } });

  await prisma.user.create({
    data: { email: 'admin@logitrack.com', passwordHash: adminPasswordHash, role: 'ADMIN' }
  });

  await prisma.user.create({
    data: { email: 'admin@email.com', passwordHash: newAdminPasswordHash, role: 'ADMIN' }
  });

  await prisma.user.create({
    data: { email: 'driver1@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d1.id }
  });

  await prisma.user.create({
    data: { email: 'driver2@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d2.id }
  });

  // Seed sample shipment with checkpoints
  const now = new Date();
  const futureDispatch = new Date(now.getTime() + 1000 * 60 * 60 * 2); // +2 hours

  await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-SEED-001',
      status: 'PENDING',
      originWarehouseId: w1.id,
      destinationWarehouseId: w3.id,
      driverId: d1.id,
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
