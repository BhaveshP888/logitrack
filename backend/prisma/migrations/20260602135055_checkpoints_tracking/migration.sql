/*
  Warnings:

  - You are about to drop the column `latitude` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `currentLatitude` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `currentLongitude` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Warehouse` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Warehouse` table. All the data in the column will be lost.
  - Added the required column `targetDispatchDate` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "currentLatitude",
DROP COLUMN "currentLongitude",
DROP COLUMN "progress",
ADD COLUMN     "actualDispatchDate" TIMESTAMP(3),
ADD COLUMN     "targetDispatchDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- CreateTable
CREATE TABLE "ShipmentCheckpoint" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "reached" BOOLEAN NOT NULL DEFAULT false,
    "reachedAt" TIMESTAMP(3),

    CONSTRAINT "ShipmentCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentCheckpoint_shipmentId_idx" ON "ShipmentCheckpoint"("shipmentId");

-- AddForeignKey
ALTER TABLE "ShipmentCheckpoint" ADD CONSTRAINT "ShipmentCheckpoint_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
