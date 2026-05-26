const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const notificacionRepository = require('../repositories/notificacion.repository');

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function normalizeText(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`El campo ${fieldName} es obligatorio`, 400);
  }

  return value.trim();
}

function parseBoolean(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;

  throw new AppError('El campo leida debe ser booleano', 400);
}

function mapNotificacion(notificacion) {
  return {
    id: notificacion.id,
    tipo: notificacion.tipo,
    titulo: notificacion.titulo,
    mensaje: notificacion.mensaje,
    leida: notificacion.leida,
    referenciaId: notificacion.referenciaId,
    referenciaTipo: notificacion.referenciaTipo,
    idNegocio: notificacion.idNegocio || null,
    fechaCreacion: notificacion.fechaCreacion,
  };
}

async function listNotificaciones(query = {}, auth) {
  const leida = parseBoolean(query.leida);
  const tipo = optionalText(query.tipo);
  const notificaciones = await notificacionRepository.list({ leida, tipo, idNegocio: getAuthBusinessId(auth) });

  return notificaciones.map(mapNotificacion);
}

async function createNotificacion(payload, auth) {
  const tipo = normalizeText(payload.tipo, 'tipo');
  const titulo = normalizeText(payload.titulo, 'titulo');
  const mensaje = normalizeText(payload.mensaje, 'mensaje');
  const idNegocio = getAuthBusinessId(auth);

  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  const notificacion = await notificacionRepository.create({
    id: randomUUID(),
    tipo,
    titulo,
    mensaje,
    leida: false,
    referenciaId: optionalText(payload.referenciaId),
    referenciaTipo: optionalText(payload.referenciaTipo),
    idNegocio,
    fechaCreacion: new Date(),
  });

  return mapNotificacion(notificacion);
}

async function markNotificacionAsRead(id, auth) {
  const existing = await notificacionRepository.findById(id, getAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Notificacion no encontrada', 404);
  }

  const notificacion = await notificacionRepository.markAsRead(id);
  return mapNotificacion(notificacion);
}

async function notifySystem(payload) {
  try {
    if (!payload.idNegocio) return null;
    return await createNotificacion(payload, { idNegocio: payload.idNegocio });
  } catch (error) {
    return null;
  }
}

module.exports = {
  listNotificaciones,
  createNotificacion,
  markNotificacionAsRead,
  notifySystem,
  mapNotificacion,
};
