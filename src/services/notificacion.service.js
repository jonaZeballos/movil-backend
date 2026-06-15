const { randomUUID } = require('crypto');
const AppError = require('../utils/appError');
const notificacionRepository = require('../repositories/notificacion.repository');

function optionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getAuthBusinessId(auth) {
  return auth?.idNegocio || auth?.negocioId || null;
}

function requireAuthBusinessId(auth) {
  const idNegocio = getAuthBusinessId(auth);
  if (!idNegocio) {
    throw new AppError('No se pudo identificar el negocio del usuario autenticado', 401);
  }

  return idNegocio;
}

function getAuthRole(auth) {
  return String(auth?.rol || auth?.tipoUsuario || auth?.role || '').toLowerCase();
}

function isNotificationVisibleForRole(notificacion, role) {
  if (role === 'admin') return true;

  const tipo = String(notificacion.tipo || '').toLowerCase();

  if (role === 'tecnico') {
    return ['orden', 'orden_estado', 'cotizacion', 'sistema', 'system'].includes(tipo);
  }

  if (role === 'ventas') {
    return ['venta', 'sistema', 'system'].includes(tipo);
  }

  return false;
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
    fechaCreacion: notificacion.fechaHoraCreacion || notificacion.fechaCreacion,
    fechaHoraCreacion: notificacion.fechaHoraCreacion || null,
  };
}

async function listNotificaciones(query = {}, auth) {
  const leida = parseBoolean(query.leida);
  const tipo = optionalText(query.tipo);
  const notificaciones = await notificacionRepository.list({ leida, tipo, idNegocio: requireAuthBusinessId(auth) });
  const role = getAuthRole(auth);

  return notificaciones
    .filter((notificacion) => isNotificationVisibleForRole(notificacion, role))
    .filter((notificacion) => String(notificacion.tipo || '').toLowerCase() !== 'stock_bajo')
    .map(mapNotificacion);
}

async function createNotificacion(payload, auth) {
  const tipo = normalizeText(payload.tipo, 'tipo').toLowerCase();
  const titulo = normalizeText(payload.titulo, 'titulo');
  const mensaje = normalizeText(payload.mensaje, 'mensaje');
  const idNegocio = requireAuthBusinessId(auth);

  if (tipo === 'stock_bajo') {
    throw new AppError('Las alertas de stock bajo no se guardan como notificaciones', 400);
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
  const existing = await notificacionRepository.findById(id, requireAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Notificacion no encontrada', 404);
  }

  if (!isNotificationVisibleForRole(existing, getAuthRole(auth))) {
    throw new AppError('Notificacion no encontrada', 404);
  }

  const notificacion = await notificacionRepository.markAsRead(id);
  return mapNotificacion(notificacion);
}

async function markAllNotificacionesAsRead(auth) {
  const idNegocio = requireAuthBusinessId(auth);

  const notificaciones = await notificacionRepository.list({ leida: false, idNegocio });
  const visibles = notificaciones.filter((notificacion) => isNotificationVisibleForRole(notificacion, getAuthRole(auth)));
  const result = await notificacionRepository.markManyAsRead(visibles.map((notificacion) => notificacion.id));

  return {
    actualizadas: result.count,
  };
}

async function deleteNotificacion(id, auth) {
  const existing = await notificacionRepository.findById(id, requireAuthBusinessId(auth));
  if (!existing) {
    throw new AppError('Notificacion no encontrada', 404);
  }

  if (!isNotificationVisibleForRole(existing, getAuthRole(auth))) {
    throw new AppError('Notificacion no encontrada', 404);
  }

  await notificacionRepository.remove(id);
}

async function notifySystem(payload) {
  if (!payload.idNegocio) {
    throw new AppError('No se pudo identificar el negocio para registrar la notificacion', 500);
  }

  if (String(payload.tipo || '').toLowerCase() === 'stock_bajo') return null;

  return createNotificacion(payload, { idNegocio: payload.idNegocio });
}

module.exports = {
  listNotificaciones,
  createNotificacion,
  markNotificacionAsRead,
  markAllNotificacionesAsRead,
  deleteNotificacion,
  notifySystem,
  mapNotificacion,
};

