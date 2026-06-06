const cotizacionService = require('../services/cotizacion.service');

async function listarCotizaciones(req, res, next) {
  try {
    const cotizaciones = await cotizacionService.listCotizaciones(req.query, req.auth);

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
    const cotizacion = await cotizacionService.getCotizacion(req.params.id, req.auth);

    return res.json({
      mensaje: 'Cotizacion obtenida correctamente',
      data: cotizacion,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerWhatsappCotizacion(req, res, next) {
  try {
    const whatsapp = await cotizacionService.getWhatsappCotizacion(req.params.id, req.auth);

    return res.json({
      mensaje: 'Link de WhatsApp para cotizacion obtenido correctamente',
      data: whatsapp,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarCotizacion(req, res, next) {
  try {
    const cotizacion = await cotizacionService.createCotizacion(req.body, req.auth);

    return res.status(201).json({
      mensaje: 'Cotizacion generada correctamente',
      data: cotizacion,
    });
  } catch (error) {
    return next(error);
  }
}


async function completarPagoCotizacion(req, res, next) {
  try {
    const cotizacion = await cotizacionService.completarPagoCotizacion(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Pago de cotizacion registrado correctamente',
      data: cotizacion,
    });
  } catch (error) {
    return next(error);
  }
}
module.exports = {
  listarCotizaciones,
  obtenerCotizacion,
  obtenerWhatsappCotizacion,
  registrarCotizacion,
  completarPagoCotizacion,
};

