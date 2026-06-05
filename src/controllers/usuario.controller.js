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
    const usuario = await usuarioService.registrarUsuarioTecnico(req.body, req.auth);

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
    const usuario = await usuarioService.registrarUsuarioVentas(req.body, req.auth);

    return res.status(201).json({
      mensaje: 'Usuario de ventas registrado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await usuarioService.listarUsuarios(req.auth);

    return res.json({
      mensaje: 'Usuarios obtenidos correctamente',
      data: usuarios,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerPerfilActual(req, res, next) {
  try {
    const usuario = await usuarioService.getPerfilActual(req.auth);

    return res.json({
      mensaje: 'Perfil obtenido correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarPerfilActual(req, res, next) {
  try {
    const usuario = await usuarioService.updatePerfilActual(req.body, req.auth);

    return res.json({
      mensaje: 'Perfil actualizado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function actualizarPasswordActual(req, res, next) {
  try {
    const result = await usuarioService.updatePasswordActual(req.body, req.auth);

    return res.json({
      mensaje: 'Contrasena actualizada correctamente',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function bloquearUsuario(req, res, next) {
  try {
    const usuario = await usuarioService.bloquearUsuario(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Usuario bloqueado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function desbloquearUsuario(req, res, next) {
  try {
    const usuario = await usuarioService.desbloquearUsuario(req.params.id, req.auth);

    return res.json({
      mensaje: 'Usuario desbloqueado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarUsuarioCliente(req, res, next) {
  try {
    const usuario = await usuarioService.registrarUsuarioCliente(req.body, req.auth);

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

async function cambiarRolUsuario(req, res, next) {
  try {
    const usuario = await usuarioService.cambiarRolUsuario(req.params.id, req.body, req.auth);

    return res.json({
      mensaje: 'Rol de usuario actualizado correctamente',
      data: usuario,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registrarUsuario,
  registrarUsuarioTecnico,
  registrarUsuarioVentas,
  listarUsuarios,
  obtenerPerfilActual,
  actualizarPerfilActual,
  actualizarPasswordActual,
  bloquearUsuario,
  desbloquearUsuario,
  registrarUsuarioCliente,
  loginUsuario,
  cambiarRolUsuario,
};
