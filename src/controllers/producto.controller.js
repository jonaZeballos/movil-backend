const productoService = require('../services/producto.service');

async function listarProductos(req, res, next) {
  try {
    const productos = await productoService.listProductos(req.query);

    return res.json({
      mensaje: 'Productos obtenidos correctamente',
      data: productos,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerProducto(req, res, next) {
  try {
    const producto = await productoService.getProducto(req.params.id);

    return res.json({
      mensaje: 'Producto obtenido correctamente',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarProducto(req, res, next) {
  try {
    const producto = await productoService.createProducto(req.body);

    return res.status(201).json({
      mensaje: 'Producto registrado correctamente',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarProducto(req, res, next) {
  try {
    const producto = await productoService.updateProducto(req.params.id, req.body);

    return res.json({
      mensaje: 'Producto actualizado correctamente',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarProductos,
  obtenerProducto,
  registrarProducto,
  actualizarProducto,
};
