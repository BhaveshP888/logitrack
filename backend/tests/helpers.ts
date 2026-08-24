import { prisma } from '../src/db.js';
import bcrypt from 'bcryptjs';

export async function resetAndSeedDatabase() {
  // Clear old data in foreign key order
  await prisma.proofOfDelivery.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.shipmentEvent.deleteMany({});
  await prisma.shipmentItem.deleteMany({});
  await prisma.shipmentCheckpoint.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.warehouse.deleteMany({});

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('Adminlogin@1212', 10);
  const driverPasswordHash = await bcrypt.hash('Driver@123', 10);

  // Create warehouses
  const w1 = await prisma.warehouse.create({ data: { code: 'BOM-01', name: 'Mumbai Hub', city: 'Mumbai', state: 'Maharashtra', latitude: 18.95, longitude: 72.95 } });
  const w2 = await prisma.warehouse.create({ data: { code: 'PNQ-01', name: 'Pune Hub', city: 'Pune', state: 'Maharashtra', latitude: 18.76, longitude: 73.86 } });
  const w3 = await prisma.warehouse.create({ data: { code: 'NAG-01', name: 'Nagpur Hub', city: 'Nagpur', state: 'Maharashtra', latitude: 21.05, longitude: 79.03 } });
  const w4 = await prisma.warehouse.create({ data: { code: 'NSK-01', name: 'Nashik Hub', city: 'Nashik', state: 'Maharashtra', latitude: 19.93, longitude: 73.73 } });
  const w5 = await prisma.warehouse.create({ data: { code: 'BLR-01', name: 'Bengaluru Hub', city: 'Bengaluru', state: 'Karnataka', latitude: 13.07, longitude: 77.79 } });

  // Create vehicles
  await prisma.vehicle.create({
    data: {
      licensePlate: 'MH-04-GP-8812',
      modelName: 'Tata Prima 5530.S',
      vehicleType: 'SEMI_TRAILER_53FT',
      maxWeightKg: 28000,
      maxVolumeCbm: 110,
      currentWarehouseId: w1.id
    }
  });

  // Create admin user
  await prisma.user.create({
    data: { email: 'admin@logitrack.com', name: 'Admin', passwordHash: adminPasswordHash, role: 'ADMIN' }
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
