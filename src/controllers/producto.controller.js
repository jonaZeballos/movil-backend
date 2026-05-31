const productoService = require('../services/producto.service');

async function listarProductos(req, res, next) {
  try {
    const productos = await productoService.listProductos(req.query, req.auth);

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
    const producto = await productoService.getProducto(req.params.id, req.auth);

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
    const producto = await productoService.createProducto(req.body, req.auth);

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
    const producto = await productoService.updateProducto(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Producto actualizado correctamente',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function desactivarProducto(req, res, next) {
  try {
    const producto = await productoService.desactivarProducto(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Producto desactivado correctamente',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function restaurarProducto(req, res, next) {
  try {
    const producto = await productoService.restaurarProducto(req.params.id, req.auth);

    return res.json({
      mensaje: 'Producto restaurado correctamente',
      data: producto,
    });
  } catch (error) {
    return next(error);
  }
}

async function eliminarProducto(req, res, next) {
  try {
    const result = await productoService.eliminarProducto(req.params.id, req.auth);

    return res.json({
      mensaje: 'Producto eliminado correctamente',
      data: result,
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
  desactivarProducto,
  restaurarProducto,
  eliminarProducto,
};
