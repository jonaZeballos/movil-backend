const usuarioService = require('../services/usuario.service');

async function registrarUsuario(req, res, next) {
  try {
    const usuario = await usuarioService.registrarUsuario(req.body);

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarUsuarioTecnico(req, res, next) {
  try {
    const usuario = await usuarioService.registrarUsuarioTecnico(req.body);

    return res.status(201).json({
      mensaje: 'Usuario tecnico registrado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarUsuarioVentas(req, res, next) {
  try {
    const usuario = await usuarioService.registrarUsuarioVentas(req.body);

    return res.status(201).json({
      mensaje: 'Usuario de ventas registrado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarUsuarioCliente(req, res, next) {
  try {
    const usuario = await usuarioService.registrarUsuarioCliente(req.body);

    return res.status(201).json({
      mensaje: 'Cliente registrado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function loginUsuario(req, res, next) {
  try {
    const login = await usuarioService.loginUsuario(req.body);

    return res.json({
      mensaje: 'Login correcto',
      data: login,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registrarUsuario,
  registrarUsuarioTecnico,
  registrarUsuarioVentas,
  registrarUsuarioCliente,
  loginUsuario,
};
