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
  const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_MAIL || 'admin@email.com';
  const adminPass = process.env.ADMIN_PASS || 'adminlogin1212';
  const adminPasswordHash = await bcrypt.hash(adminPass, 10);

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

  // Seed sample shipment with checkpoints
  const now = new Date();
  const futureDispatch = new Date(now.getTime() + 1000 * 60 * 60 * 2); // +2 hours

  await prisma.shipment.create({
    data: {
      trackingNumber: 'TRK-SEED-001',
      status: 'PENDING',
      originWarehouseId: w1.id,
      destinationWarehouseId: w3.id,
      driverId: null,
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
