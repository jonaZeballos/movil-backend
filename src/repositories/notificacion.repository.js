const prisma = require('../utils/prismaClient');

const NOTIFICATION_SELECT = `
  SELECT
    "id_notificacion" AS "id",
    "tipo",
    "titulo",
    "mensaje",
    "leida",
    "referencia_id" AS "referenciaId",
    "referencia_tipo" AS "referenciaTipo",
    TO_CHAR("fecha_creacion", 'YYYY-MM-DD') AS "fechaCreacion",
    "fecha_hora_creacion" AS "fechaHoraCreacion",
    "id_negocio" AS "idNegocio"
  FROM "notificacion"
`;

function list({ leida, tipo, idNegocio } = {}) {
  return prisma.$queryRawUnsafe(
    `${NOTIFICATION_SELECT}
      WHERE ($1::varchar IS NULL OR "id_negocio" = $1)
        AND ($2::boolean IS NULL OR "leida" = $2)
        AND ($3::varchar IS NULL OR "tipo" = $3)
        AND LOWER("tipo") <> 'stock_bajo'
      ORDER BY COALESCE("fecha_hora_creacion", "fecha_creacion"::timestamp) DESC, "id_notificacion" DESC`,
    idNegocio || null,
    typeof leida === 'boolean' ? leida : null,
    tipo || null,
  );
}

async function findById(id, idNegocio) {
  const rows = await prisma.$queryRawUnsafe(
    `${NOTIFICATION_SELECT}
      WHERE "id_notificacion" = $1
        AND ($2::varchar IS NULL OR "id_negocio" = $2)
        AND LOWER("tipo") <> 'stock_bajo'
      LIMIT 1`,
    id,
    idNegocio || null,
  );

  return rows[0] || null;
}

async function create(data) {
  const rows = await prisma.$queryRawUnsafe(
    `INSERT INTO "notificacion" (
      "id_notificacion", "tipo", "titulo", "mensaje", "leida",
      "referencia_id", "referencia_tipo", "fecha_creacion", "fecha_hora_creacion", "id_negocio"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      ($8::timestamptz AT TIME ZONE 'America/La_Paz')::date,
      $8::timestamptz,
      $9
    )
    RETURNING
      "id_notificacion" AS "id",
      "tipo",
      "titulo",
      "mensaje",
      "leida",
      "referencia_id" AS "referenciaId",
      "referencia_tipo" AS "referenciaTipo",
      TO_CHAR("fecha_creacion", 'YYYY-MM-DD') AS "fechaCreacion",
      "fecha_hora_creacion" AS "fechaHoraCreacion",
      "id_negocio" AS "idNegocio"`,
    data.id,
    data.tipo,
    data.titulo,
    data.mensaje,
    data.leida,
    data.referenciaId,
    data.referenciaTipo,
    data.fechaCreacion,
    data.idNegocio,
  );

  return rows[0];
}

async function markAsRead(id) {
  const rows = await prisma.$queryRawUnsafe(
    `UPDATE "notificacion"
      SET "leida" = TRUE
      WHERE "id_notificacion" = $1
      RETURNING
        "id_notificacion" AS "id",
        "tipo",
        "titulo",
        "mensaje",
        "leida",
        "referencia_id" AS "referenciaId",
        "referencia_tipo" AS "referenciaTipo",
        TO_CHAR("fecha_creacion", 'YYYY-MM-DD') AS "fechaCreacion",
        "fecha_hora_creacion" AS "fechaHoraCreacion",
        "id_negocio" AS "idNegocio"`,
    id,
  );

  return rows[0];
}

function markAllAsRead(idNegocio) {
  return prisma.$executeRawUnsafe(
    `UPDATE "notificacion"
      SET "leida" = TRUE
      WHERE ($1::varchar IS NULL OR "id_negocio" = $1)
        AND "leida" = FALSE
        AND LOWER("tipo") <> 'stock_bajo'`,
    idNegocio || null,
  ).then((count) => ({ count }));
}

function markManyAsRead(ids = []) {
  if (!ids.length) {
    return Promise.resolve({ count: 0 });
  }

  return prisma.$executeRawUnsafe(
    `UPDATE "notificacion"
      SET "leida" = TRUE
      WHERE "id_notificacion" = ANY($1::varchar[])`,
    ids,
  ).then((count) => ({ count }));
}

function remove(id) {
  return prisma.$executeRawUnsafe(
    'DELETE FROM "notificacion" WHERE "id_notificacion" = $1',
    id,
  );
}

module.exports = {
  list,
  findById,
  create,
  markAsRead,
  markAllAsRead,
  markManyAsRead,
  remove,
};

