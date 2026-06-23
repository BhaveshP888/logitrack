import { prisma } from '../src/db.js';
import bcrypt from 'bcryptjs';

export async function resetAndSeedDatabase() {
  // Clear old data
  await prisma.user.deleteMany({});
  await prisma.shipmentCheckpoint.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.warehouse.deleteMany({});

  // Hash passwords
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
    data: { email: 'admin@logitrack.com', passwordHash: adminPasswordHash, role: 'ADMIN' }
  });

  // Create drivers
  const d1 = await prisma.driver.create({ data: { name: 'Rajesh Kumar', status: 'AVAILABLE', warehouseId: w1.id } });
  const d2 = await prisma.driver.create({ data: { name: 'Amit Patil', status: 'AVAILABLE', warehouseId: w2.id } });
  const d3 = await prisma.driver.create({ data: { name: 'John Doe', status: 'AVAILABLE', warehouseId: w3.id } });

  // Create driver users
  await prisma.user.create({
    data: { email: 'driver1@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d1.id }
  });
  await prisma.user.create({
    data: { email: 'driver2@logitrack.com', passwordHash: driverPasswordHash, role: 'DRIVER', driverId: d2.id }
  });
}
