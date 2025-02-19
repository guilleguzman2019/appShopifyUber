/*
  Warnings:

  - Added the required column `email` to the `Sucursal` table without a default value. This is not possible if the table is not empty.

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
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sucursal_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sucursal" ("ciudad", "codigoPostal", "createdAt", "direccion", "esPrincipal", "estado", "id", "latitud", "longitud", "pais", "telefono", "tiendaId", "updatedAt") SELECT "ciudad", "codigoPostal", "createdAt", "direccion", "esPrincipal", "estado", "id", "latitud", "longitud", "pais", "telefono", "tiendaId", "updatedAt" FROM "Sucursal";
DROP TABLE "Sucursal";
ALTER TABLE "new_Sucursal" RENAME TO "Sucursal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
