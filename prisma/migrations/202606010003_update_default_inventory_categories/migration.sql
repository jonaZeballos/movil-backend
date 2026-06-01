DELETE FROM "categoria_producto" c
WHERE c."tipo_inventario" = 'tienda'
  AND c."nombre" IN ('EQUIPOS', 'ACCESORIOS')
  AND NOT EXISTS (
    SELECT 1 FROM "producto" p WHERE p."id_categoria" = c."id_categoria"
  );

DELETE FROM "categoria_producto" c
WHERE c."tipo_inventario" = 'tecnico'
  AND c."nombre" IN ('REPUESTOS', 'HERRAMIENTAS', 'CONSUMIBLES')
  AND NOT EXISTS (
    SELECT 1 FROM "producto" p WHERE p."id_categoria" = c."id_categoria"
  );
