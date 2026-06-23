-- AlterTable
ALTER TABLE "pedido" ADD COLUMN "numero_pedido" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pedido_numero_pedido_key" ON "pedido"("numero_pedido");
