-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ajustes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tiendaId" INTEGER NOT NULL,
    "apiKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "modo" TEXT NOT NULL DEFAULT 'Testing',
    "titulo" TEXT NOT NULL DEFAULT 'Uber Delivery',
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "montoMin" INTEGER NOT NULL DEFAULT 0,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "customer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ajustes_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ajustes" ("apiKey", "createdAt", "customer", "id", "idioma", "modo", "secretKey", "tiendaId", "titulo", "updatedAt") SELECT "apiKey", "createdAt", "customer", "id", "idioma", "modo", "secretKey", "tiendaId", "titulo", "updatedAt" FROM "Ajustes";
DROP TABLE "Ajustes";
ALTER TABLE "new_Ajustes" RENAME TO "Ajustes";
CREATE UNIQUE INDEX "Ajustes_tiendaId_key" ON "Ajustes"("tiendaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
