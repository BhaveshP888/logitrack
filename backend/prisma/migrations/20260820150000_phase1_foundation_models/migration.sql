-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BOX_TRUCK_24FT', 'SEMI_TRAILER_53FT', 'FLATBED', 'REFRIGERATED_VAN');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DISPATCHER';

-- AlterTable Warehouse
ALTER TABLE "Warehouse" 
ADD COLUMN IF NOT EXISTS "code" TEXT NOT NULL DEFAULT 'WH-01',
ADD COLUMN IF NOT EXISTS "address" TEXT NOT NULL DEFAULT 'Hub Logistics Terminal',
ADD COLUMN IF NOT EXISTS "city" TEXT NOT NULL DEFAULT 'Mumbai',
ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT 'Maharashtra',
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION NOT NULL DEFAULT 19.0760,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION NOT NULL DEFAULT 72.8777,
ADD COLUMN IF NOT EXISTS "capacityCbm" DOUBLE PRECISION NOT NULL DEFAULT 5000.0;

UPDATE "Warehouse" SET "code" = 'WH-' || substr(id, 1, 8);
CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_code_key" ON "Warehouse"("code");

-- CreateTable Vehicle
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'Tata Prima 5530.S',
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'SEMI_TRAILER_53FT',
    "maxWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 28000.0,
    "maxVolumeCbm" DOUBLE PRECISION NOT NULL DEFAULT 110.0,
    "currentWarehouseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");

-- AlterTable Driver
ALTER TABLE "Driver" 
ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT NOT NULL DEFAULT 'MH-04-2022-887192',
ADD COLUMN IF NOT EXISTS "phone" TEXT NOT NULL DEFAULT '+91 98201 55432',
ADD COLUMN IF NOT EXISTS "currentLatitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "currentLongitude" DOUBLE PRECISION;

-- AlterTable User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "name" TEXT DEFAULT 'User',
ADD COLUMN IF NOT EXISTS "companyName" TEXT;

-- AlterTable Shipment
ALTER TABLE "Shipment" 
ADD COLUMN IF NOT EXISTS "vehicleId" TEXT,
ADD COLUMN IF NOT EXISTS "rateAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS "estimatedDeliveryDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "actualDeliveryDate" TIMESTAMP(3);

-- CreateTable ShipmentItem
CREATE TABLE IF NOT EXISTS "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "volumeCbm" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isHazmat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- AlterTable ShipmentCheckpoint
ALTER TABLE "ShipmentCheckpoint"
ADD COLUMN IF NOT EXISTS "warehouseId" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- CreateTable ProofOfDelivery
CREATE TABLE IF NOT EXISTS "ProofOfDelivery" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "signatureData" TEXT,
    "photoUrl" TEXT,
    "deliveryLat" DOUBLE PRECISION,
    "deliveryLng" DOUBLE PRECISION,
    "notes" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofOfDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProofOfDelivery_shipmentId_key" ON "ProofOfDelivery"("shipmentId");

-- CreateTable ShipmentEvent
CREATE TABLE IF NOT EXISTS "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");

-- CreateTable Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_shipmentId_key" ON "Invoice"("shipmentId");

-- AddForeignKeys
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_currentWarehouseId_fkey" FOREIGN KEY ("currentWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentCheckpoint" ADD CONSTRAINT "ShipmentCheckpoint_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProofOfDelivery" ADD CONSTRAINT "ProofOfDelivery_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
