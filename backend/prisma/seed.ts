import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear old data
  await prisma.user.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.warehouse.deleteMany({});

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const driverPasswordHash = await bcrypt.hash('driver123', 10);

  // Create warehouses
  const w1 = await prisma.warehouse.create({ data: { name: 'Mumbai Hub', latitude: 19.0760, longitude: 72.8777 } });
  const w2 = await prisma.warehouse.create({ data: { name: 'Pune Hub', latitude: 18.5204, longitude: 73.8567 } });
  const w3 = await prisma.warehouse.create({ data: { name: 'Nagpur Hub', latitude: 21.1458, longitude: 79.0882 } });
  const w4 = await prisma.warehouse.create({ data: { name: 'Nashik Hub', latitude: 19.9975, longitude: 73.7898 } });
  const w5 = await prisma.warehouse.create({ data: { name: 'Aurangabad Hub', latitude: 19.8762, longitude: 75.3433 } });

  // Create drivers and link to users
  const d1 = await prisma.driver.create({ data: { name: 'Rajesh Kumar', status: 'AVAILABLE', latitude: 19.0760, longitude: 72.8777, warehouseId: w1.id } });
  const d2 = await prisma.driver.create({ data: { name: 'Amit Patil', status: 'AVAILABLE', latitude: 18.5204, longitude: 73.8567, warehouseId: w2.id } });

  await prisma.user.create({
    data: { email: 'admin@logitrack.com', passwordHash: adminPasswordHash, role: 'ADMIN' }
  });

  await prisma.user.create({
    data: { email: 'driver1@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d1.id }
  });

  await prisma.user.create({
    data: { email: 'driver2@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d2.id }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
