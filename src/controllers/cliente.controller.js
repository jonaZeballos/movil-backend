const clienteService = require('../services/cliente.service');

async function listarClientes(req, res, next) {
  try {
    const clientes = await clienteService.listClientes(req.query, req.auth);

    return res.json({
      mensaje: 'Clientes obtenidos correctamente',
      data: clientes,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerCliente(req, res, next) {
  try {
    const cliente = await clienteService.getCliente(req.params.id, req.auth);

    return res.json({
      mensaje: 'Cliente obtenido correctamente',
      data: cliente,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerHistorialCliente(req, res, next) {
  try {
    const historial = await clienteService.getHistorialCliente(req.params.id, req.auth);

    return res.json({
      mensaje: 'Historial de cliente obtenido correctamente',
      data: historial,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarCliente(req, res, next) {
  try {
    const cliente = await clienteService.createCliente(req.body, req.auth);

    return res.status(201).json({
      mensaje: 'Cliente registrado correctamente',
      data: cliente,
    });
  } catch (error) {
    return next(error);
  }
}

async function agregarClienteListaNegra(req, res, next) {
  try {
    const cliente = await clienteService.agregarClienteListaNegra(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Cliente agregado a lista negra correctamente',
      data: cliente,
    });
  } catch (error) {
    return next(error);
  }
}

async function quitarClienteListaNegra(req, res, next) {
  try {
    const cliente = await clienteService.quitarClienteListaNegra(req.params.id, req.auth);

    return res.json({
      mensaje: 'Cliente quitado de lista negra correctamente',
      data: cliente,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarClientes,
  obtenerCliente,
  obtenerHistorialCliente,
  registrarCliente,
  agregarClienteListaNegra,
  quitarClienteListaNegra,
};
