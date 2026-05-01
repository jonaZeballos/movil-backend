const clienteService = require('../services/cliente.service');

async function listarClientes(req, res, next) {
  try {
    const clientes = await clienteService.listClientes(req.query);

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
    const cliente = await clienteService.getCliente(req.params.id);

    return res.json({
      mensaje: 'Cliente obtenido correctamente',
      data: cliente,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarCliente(req, res, next) {
  try {
    const cliente = await clienteService.createCliente(req.body);

    return res.status(201).json({
      mensaje: 'Cliente registrado correctamente',
      data: cliente,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarClientes,
  obtenerCliente,
  registrarCliente,
};
