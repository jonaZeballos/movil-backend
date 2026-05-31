const ordenService = require('../services/orden.service');

async function listarOrdenes(req, res, next) {
  try {
    const ordenes = await ordenService.listOrdenes(req.query, req.auth);

    return res.json({
      mensaje: 'Ordenes obtenidas correctamente',
      data: ordenes,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerOrden(req, res, next) {
  try {
    const orden = await ordenService.getOrden(req.params.id, req.auth);

    return res.json({
      mensaje: 'Orden obtenida correctamente',
      data: orden,
    });
  } catch (error) {
    return next(error);
  }
}

async function crearOrden(req, res, next) {
  try {
    const orden = await ordenService.createOrden(req.body, req.auth);

    return res.status(201).json({
      mensaje: 'Orden creada correctamente',
      data: orden,
    });
  } catch (error) {
    return next(error);
  }
}

async function crearOrdenesLote(req, res, next) {
  try {
    const ordenes = await ordenService.createOrdenesLote(req.body, req.auth);

    return res.status(201).json({
      mensaje: `Se crearon ${ordenes.length} ordenes de servicio`,
      data: ordenes,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarOrden(req, res, next) {
  try {
    const orden = await ordenService.updateOrden(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Orden actualizada correctamente',
      data: orden,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarEstadoOrden(req, res, next) {
  try {
    const orden = await ordenService.updateEstadoOrden(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Estado de orden actualizado correctamente',
      data: orden,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarObservacionesOrden(req, res, next) {
  try {
    const orden = await ordenService.updateObservacionesOrden(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Observaciones de orden actualizadas correctamente',
      data: orden,
    });
  } catch (error) {
    return next(error);
  }
}

async function anularOrden(req, res, next) {
  try {
    const orden = await ordenService.anularOrden(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Orden anulada correctamente',
      data: orden,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
  crearOrdenesLote,
  actualizarOrden,
  actualizarEstadoOrden,
  actualizarObservacionesOrden,
  anularOrden,
};
