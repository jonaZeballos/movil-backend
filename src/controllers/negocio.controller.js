const negocioService = require('../services/negocio.service');

async function obtenerNegocioActual(req, res, next) {
  try {
    const negocio = await negocioService.getNegocioActual(req.auth);

    return res.json({
      mensaje: 'Negocio obtenido correctamente',
      data: negocio,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarNegocioActual(req, res, next) {
  try {
    const negocio = await negocioService.updateNegocioActual(req.body, req.auth);

    return res.json({
      mensaje: 'Negocio actualizado correctamente',
      data: negocio,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  obtenerNegocioActual,
  actualizarNegocioActual,
};
