ALTER TABLE "cotizacion"
  ADD COLUMN IF NOT EXISTS "anticipo" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pago_final" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "saldo_pendiente" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "metodo_pago_anticipo" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "metodo_pago_saldo" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "estado_pago" VARCHAR(50) NOT NULL DEFAULT 'Sin pago',
  ADD COLUMN IF NOT EXISTS "fecha_anticipo" TIMESTAMP(6),
  ADD COLUMN IF NOT EXISTS "fecha_pago_final" TIMESTAMP(6);

UPDATE "cotizacion"
SET "saldo_pendiente" = GREATEST("total" - "anticipo" - "pago_final", 0)
WHERE "saldo_pendiente" = 0;
