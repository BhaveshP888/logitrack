import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean data
  await prisma.shipment.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create 4 Warehouses at custom coordinates
  const w1 = await prisma.warehouse.create({
    data: { name: "Seattle Hub (W1)", latitude: 47.6062, longitude: -122.3321 }
  });
  const w2 = await prisma.warehouse.create({
    data: { name: "Los Angeles Hub (W2)", latitude: 34.0522, longitude: -118.2437 }
  });
  const w3 = await prisma.warehouse.create({
    data: { name: "Chicago Hub (W3)", latitude: 41.8781, longitude: -87.6298 }
  });
  const w4 = await prisma.warehouse.create({
    data: { name: "New York Hub (W4)", latitude: 40.7128, longitude: -74.0060 }
  });

  console.log("Warehouses seeded");

  // Create Drivers
  const d1 = await prisma.driver.create({
    data: { name: "John Doe", status: "AVAILABLE", latitude: w1.latitude, longitude: w1.longitude, warehouseId: w1.id }
  });
  const d2 = await prisma.driver.create({
    data: { name: "Alice Smith", status: "AVAILABLE", latitude: w2.latitude, longitude: w2.longitude, warehouseId: w2.id }
  });
  const d3 = await prisma.driver.create({
    data: { name: "Bob Johnson", status: "AVAILABLE", latitude: w3.latitude, longitude: w3.longitude, warehouseId: w3.id }
  });

  console.log("Drivers seeded");

  // Create a default Shipment
  await prisma.shipment.create({
    data: {
      trackingNumber: "TRK-1001",
      status: "PENDING",
      originWarehouseId: w1.id,
      destinationWarehouseId: w3.id,
      currentLatitude: w1.latitude,
      currentLongitude: w1.longitude,
      progress: 0.0
    }
  });

  console.log("Shipments seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
