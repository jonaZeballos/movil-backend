ALTER TABLE "cotizacion"
  ALTER COLUMN "fecha_creacion" TYPE TIMESTAMP(6) USING "fecha_creacion"::timestamp,
  ALTER COLUMN "fecha_creacion" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "venta"
  ALTER COLUMN "fecha_creacion" TYPE TIMESTAMP(6) USING "fecha_creacion"::timestamp,
  ALTER COLUMN "fecha_creacion" SET DEFAULT CURRENT_TIMESTAMP;
