-- CreateTable
CREATE TABLE "AjustesPickupDrop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tiendaId" INTEGER NOT NULL,
    "firmaPickup" BOOLEAN NOT NULL DEFAULT false,
    "nombreFirmaPickup" BOOLEAN NOT NULL DEFAULT false,
    "relacionFirmaPickup" BOOLEAN NOT NULL DEFAULT false,
    "fotoPickup" BOOLEAN NOT NULL DEFAULT false,
    "firmaDrop" BOOLEAN NOT NULL DEFAULT false,
    "nombreFirmaDrop" BOOLEAN NOT NULL DEFAULT false,
    "relacionFirmaDrop" BOOLEAN NOT NULL DEFAULT false,
    "fotoDrop" BOOLEAN NOT NULL DEFAULT false,
    "edadMinimaDrop" INTEGER,
    "pincodeDrop" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AjustesPickupDrop_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AjustesPickupDrop_tiendaId_key" ON "AjustesPickupDrop"("tiendaId");
