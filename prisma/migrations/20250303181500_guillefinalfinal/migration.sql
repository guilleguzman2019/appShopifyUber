/*
  Warnings:

  - Added the required column `CantidadEnvios` to the `Tienda` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan` to the `Tienda` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tienda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "horarios" TEXT,
    "sucursalPrincipalId" TEXT,
    "plan" TEXT NOT NULL,
    "CantidadEnvios" INTEGER NOT NULL
);
INSERT INTO "new_Tienda" ("horarios", "id", "nombre", "sucursalPrincipalId") SELECT "horarios", "id", "nombre", "sucursalPrincipalId" FROM "Tienda";
DROP TABLE "Tienda";
ALTER TABLE "new_Tienda" RENAME TO "Tienda";
CREATE UNIQUE INDEX "Tienda_nombre_key" ON "Tienda"("nombre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
