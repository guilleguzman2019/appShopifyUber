/*
  Warnings:

  - You are about to drop the column `esPrincipal` on the `Sucursal` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sucursal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "direccion" TEXT NOT NULL,
    "latitud" REAL NOT NULL,
    "longitud" REAL NOT NULL,
    "ciudad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tiendaId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sucursal_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sucursal" ("ciudad", "codigoPostal", "createdAt", "direccion", "email", "estado", "id", "latitud", "longitud", "pais", "telefono", "tiendaId", "updatedAt") SELECT "ciudad", "codigoPostal", "createdAt", "direccion", "email", "estado", "id", "latitud", "longitud", "pais", "telefono", "tiendaId", "updatedAt" FROM "Sucursal";
DROP TABLE "Sucursal";
ALTER TABLE "new_Sucursal" RENAME TO "Sucursal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
