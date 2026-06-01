CREATE TABLE IF NOT EXISTS "categoria_producto" (
  "id_categoria" VARCHAR(1000) NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "descripcion" VARCHAR(300),
  "activa" BOOLEAN NOT NULL DEFAULT true,
  "fecha_creacion" DATE NOT NULL DEFAULT CURRENT_DATE,
  "id_negocio" VARCHAR(1000) NOT NULL,

  CONSTRAINT "categoria_producto_pkey" PRIMARY KEY ("id_categoria"),
  CONSTRAINT "categoria_producto_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "categoria_producto_id_negocio_nombre_key" ON "categoria_producto"("id_negocio", "nombre");
CREATE INDEX IF NOT EXISTS "categoria_producto_id_negocio_idx" ON "categoria_producto"("id_negocio");

ALTER TABLE "producto" ADD COLUMN IF NOT EXISTS "id_categoria" VARCHAR(1000);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'producto_id_categoria_fkey'
  ) THEN
    ALTER TABLE "producto"
    ADD CONSTRAINT "producto_id_categoria_fkey"
    FOREIGN KEY ("id_categoria") REFERENCES "categoria_producto"("id_categoria")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "producto_id_categoria_idx" ON "producto"("id_categoria");
