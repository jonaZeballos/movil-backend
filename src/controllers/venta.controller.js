const ventaService = require('../services/venta.service');

async function listarVentas(req, res, next) {
  try {
    const ventas = await ventaService.listVentas();

    return res.json({
      mensaje: 'Ventas obtenidas correctamente',
      data: ventas,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerVenta(req, res, next) {
  try {
    const venta = await ventaService.getVenta(req.params.id);

    return res.json({
      mensaje: 'Venta obtenida correctamente',
      data: venta,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarVenta(req, res, next) {
  try {
    const venta = await ventaService.createVenta(req.body);

    return res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      data: venta,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarVentas,
  obtenerVenta,
  registrarVenta,
};
