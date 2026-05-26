const notificacionService = require('../services/notificacion.service');

async function listarNotificaciones(req, res, next) {
  try {
    const notificaciones = await notificacionService.listNotificaciones(req.query, req.auth);

    return res.json({
      mensaje: 'Notificaciones obtenidas correctamente',
      data: notificaciones,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarNotificacion(req, res, next) {
  try {
    const notificacion = await notificacionService.createNotificacion(req.body, req.auth);

    return res.status(201).json({
      mensaje: 'Notificacion registrada correctamente',
      data: notificacion,
    });
  } catch (error) {
    return next(error);
  }
}

async function marcarNotificacionLeida(req, res, next) {
  try {
    const notificacion = await notificacionService.markNotificacionAsRead(req.params.id, req.auth);

    return res.json({
      mensaje: 'Notificacion marcada como leida correctamente',
      data: notificacion,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarNotificaciones,
  registrarNotificacion,
  marcarNotificacionLeida,
};
