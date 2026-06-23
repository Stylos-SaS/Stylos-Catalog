-- CreateTable
CREATE TABLE "configuracion_tienda" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "whatsapp_numero" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_tienda_pkey" PRIMARY KEY ("id")
);
