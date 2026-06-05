DELETE FROM "categoria_producto" c
WHERE c."tipo_inventario" = 'tienda'
  AND c."nombre" IN (
    'EQUIPOS',
    'MOUSE',
    'TECLADOS',
    'ACCESORIOS',
    'REDES Y CONECTIVIDAD',
    'MEMORIAS Y ALMACENAMIENTO',
    'REPUESTOS',
    'LIMPIEZA Y MANTENIMIENTO'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "producto" p WHERE p."id_categoria" = c."id_categoria"
  );

UPDATE "categoria_producto"
SET "activa" = false
WHERE "tipo_inventario" = 'tienda'
  AND "nombre" IN (
    'EQUIPOS',
    'MOUSE',
    'TECLADOS',
    'ACCESORIOS',
    'REDES Y CONECTIVIDAD',
    'MEMORIAS Y ALMACENAMIENTO',
    'REPUESTOS',
    'LIMPIEZA Y MANTENIMIENTO'
  );

DELETE FROM "categoria_producto" c
WHERE c."tipo_inventario" = 'tecnico'
  AND c."nombre" IN (
    'HERRAMIENTAS',
    'CONSUMIBLES TECNICOS',
    'REPUESTOS INTERNOS',
    'LIMPIEZA TECNICA',
    'SOLDADURA Y REPARACION',
    'DIAGNOSTICO',
    'REPUESTOS',
    'CONSUMIBLES',
    'COMPONENTES ELECTRONICOS',
    'TORNILLERIA Y FIJACIONES',
    'CABLES INTERNOS'
  )
  AND NOT EXISTS (
    SELECT 1 FROM "producto" p WHERE p."id_categoria" = c."id_categoria"
  );

UPDATE "categoria_producto"
SET "activa" = false
WHERE "tipo_inventario" = 'tecnico'
  AND "nombre" IN (
    'HERRAMIENTAS',
    'CONSUMIBLES TECNICOS',
    'REPUESTOS INTERNOS',
    'LIMPIEZA TECNICA',
    'SOLDADURA Y REPARACION',
    'DIAGNOSTICO',
    'REPUESTOS',
    'CONSUMIBLES',
    'COMPONENTES ELECTRONICOS',
    'TORNILLERIA Y FIJACIONES',
    'CABLES INTERNOS'
  );