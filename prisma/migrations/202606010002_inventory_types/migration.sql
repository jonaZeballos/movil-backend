ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "tipo_inventario" VARCHAR(20) NOT NULL DEFAULT 'tienda';
ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "id_tecnico" VARCHAR(1000);

ALTER TABLE "categoria_producto" ADD COLUMN IF NOT EXISTS "tipo_inventario" VARCHAR(20) NOT NULL DEFAULT 'tienda';

DROP INDEX IF EXISTS "categoria_producto_id_negocio_nombre_key";
CREATE UNIQUE INDEX IF NOT EXISTS "categoria_producto_id_negocio_tipo_inventario_nombre_key"
  ON "categoria_producto"("id_negocio", "tipo_inventario", "nombre");

CREATE INDEX IF NOT EXISTS "producto_tipo_inventario_idx" ON "producto"("tipo_inventario");
CREATE INDEX IF NOT EXISTS "producto_id_tecnico_idx" ON "producto"("id_tecnico");
CREATE INDEX IF NOT EXISTS "categoria_producto_tipo_inventario_idx" ON "categoria_producto"("tipo_inventario");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'producto_id_tecnico_fkey'
  ) THEN
    ALTER TABLE "producto"
    ADD CONSTRAINT "producto_id_tecnico_fkey"
    FOREIGN KEY ("id_tecnico") REFERENCES "usuario"("id_usuario")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
