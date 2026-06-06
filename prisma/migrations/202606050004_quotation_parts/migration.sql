CREATE TABLE IF NOT EXISTS "cotizacion_repuesto" (
  "id_cotizacion_repuesto" VARCHAR(1000) PRIMARY KEY,
  "origen" VARCHAR(20) NOT NULL DEFAULT 'externo',
  "nombre" VARCHAR(200) NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "precio_unitario" DECIMAL(10, 2) NOT NULL,
  "subtotal" DECIMAL(10, 2) NOT NULL,
  "id_cotizacion" VARCHAR(1000) NOT NULL,
  "id_producto" VARCHAR(1000),
  CONSTRAINT "cotizacion_repuesto_id_cotizacion_fkey"
    FOREIGN KEY ("id_cotizacion") REFERENCES "cotizacion"("id_cotizacion") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cotizacion_repuesto_id_producto_fkey"
    FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "cotizacion_repuesto_id_cotizacion_idx" ON "cotizacion_repuesto"("id_cotizacion");
CREATE INDEX IF NOT EXISTS "cotizacion_repuesto_id_producto_idx" ON "cotizacion_repuesto"("id_producto");