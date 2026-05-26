const ventaService = require('../services/venta.service');

async function listarVentas(req, res, next) {
  try {
    const ventas = await ventaService.listVentas(req.auth);

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
    const venta = await ventaService.getVenta(req.params.id, req.auth);

    return res.json({
      mensaje: 'Venta obtenida correctamente',
      data: venta,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerReciboVenta(req, res, next) {
  try {
    const recibo = await ventaService.getReciboVenta(req.params.id, req.auth);

    return res.json({
      mensaje: 'Recibo obtenido correctamente',
      data: recibo,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerWhatsappReciboVenta(req, res, next) {
  try {
    const whatsapp = await ventaService.getWhatsappReciboVenta(req.params.id, req.auth);

    return res.json({
      mensaje: 'Link de WhatsApp para recibo obtenido correctamente',
      data: whatsapp,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarVenta(req, res, next) {
  try {
    const venta = await ventaService.createVenta(req.body, req.auth);

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
  obtenerReciboVenta,
  obtenerWhatsappReciboVenta,
  registrarVenta,
};
