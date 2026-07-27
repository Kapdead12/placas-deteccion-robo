-- CreateTable
CREATE TABLE "detecciones" (
    "id" TEXT NOT NULL,
    "placa" TEXT,
    "confianza_deteccion" DOUBLE PRECISION NOT NULL,
    "confianza_ocr" DOUBLE PRECISION NOT NULL,
    "bbox_x1" INTEGER,
    "bbox_y1" INTEGER,
    "bbox_x2" INTEGER,
    "bbox_y2" INTEGER,
    "reportada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placas_reportadas" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "motivo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_reporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placas_reportadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "placas_reportadas_placa_key" ON "placas_reportadas"("placa");
