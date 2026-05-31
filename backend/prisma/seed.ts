import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean data
  await prisma.shipment.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create 5 Warehouses in Maharashtra at real coordinates
  const w1 = await prisma.warehouse.create({
    data: { name: "Mumbai Hub (W1)", latitude: 19.0760, longitude: 72.8777 }
  });
  const w2 = await prisma.warehouse.create({
    data: { name: "Pune Hub (W2)", latitude: 18.5204, longitude: 73.8567 }
  });
  const w3 = await prisma.warehouse.create({
    data: { name: "Nagpur Hub (W3)", latitude: 21.1458, longitude: 79.0882 }
  });
  const w4 = await prisma.warehouse.create({
    data: { name: "Nashik Hub (W4)", latitude: 19.9975, longitude: 73.7898 }
  });
  const w5 = await prisma.warehouse.create({
    data: { name: "Aurangabad Hub (W5)", latitude: 19.8762, longitude: 75.3433 }
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
      destinationWarehouseId: w2.id,
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
