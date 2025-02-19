-- CreateTable
CREATE TABLE "Propina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "valor" REAL,
    "habilitada" BOOLEAN NOT NULL,
    "tiendaId" INTEGER NOT NULL,
    CONSTRAINT "Propina_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Propina_tiendaId_key" ON "Propina"("tiendaId");
