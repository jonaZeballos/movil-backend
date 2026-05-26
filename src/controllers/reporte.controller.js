const reporteService = require('../services/reporte.service');

async function obtenerResumen(req, res, next) {
  try {
    const reporte = await reporteService.getReporteResumen(req.query, req.auth);

    return res.json({
      mensaje: 'Resumen obtenido correctamente',
      data: reporte,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerReporteServicios(req, res, next) {
  try {
    const reporte = await reporteService.getReporteServicios(req.query, req.auth);

    return res.json({
      mensaje: 'Reporte de servicios obtenido correctamente',
      data: reporte,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerReporteVentas(req, res, next) {
  try {
    const reporte = await reporteService.getReporteVentas(req.query, req.auth);

    return res.json({
      mensaje: 'Reporte de ventas obtenido correctamente',
      data: reporte,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerReporteInventario(req, res, next) {
  try {
    const reporte = await reporteService.getReporteInventario(req.query, req.auth);

    return res.json({
      mensaje: 'Reporte de inventario obtenido correctamente',
      data: reporte,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  obtenerResumen,
  obtenerReporteServicios,
  obtenerReporteVentas,
  obtenerReporteInventario,
};
