-- CreateTable
CREATE TABLE "AjustesProducto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tiendaId" INTEGER NOT NULL,
    "peso" REAL NOT NULL,
    "largo" REAL NOT NULL,
    "alto" REAL NOT NULL,
    "ancho" REAL NOT NULL,
    "tiempoPreparacion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AjustesProducto_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AjustesProducto_tiendaId_key" ON "AjustesProducto"("tiendaId");
