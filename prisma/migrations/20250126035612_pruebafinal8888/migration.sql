/*
  Warnings:

  - Added the required column `depth` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `length` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "preparationTime" INTEGER NOT NULL,
    "length" REAL NOT NULL,
    "height" REAL NOT NULL,
    "depth" REAL NOT NULL,
    "tiendaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Producto_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Producto" ("createdAt", "id", "image", "preparationTime", "tiendaId", "title", "updatedAt") SELECT "createdAt", "id", "image", "preparationTime", "tiendaId", "title", "updatedAt" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
