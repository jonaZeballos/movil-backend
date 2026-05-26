const cotizacionService = require('../services/cotizacion.service');

async function listarCotizaciones(req, res, next) {
  try {
    const cotizaciones = await cotizacionService.listCotizaciones(req.query);

    return res.json({
      mensaje: 'Cotizaciones obtenidas correctamente',
      data: cotizaciones,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerCotizacion(req, res, next) {
  try {
    const cotizacion = await cotizacionService.getCotizacion(req.params.id);

    return res.json({
      mensaje: 'Cotizacion obtenida correctamente',
      data: cotizacion,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarCotizacion(req, res, next) {
  try {
    const cotizacion = await cotizacionService.createCotizacion(req.body);

    return res.status(201).json({
      mensaje: 'Cotizacion generada correctamente',
      data: cotizacion,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarCotizaciones,
  obtenerCotizacion,
  registrarCotizacion,
};
