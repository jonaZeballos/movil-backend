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

module.exports = {
  registrarUsuario,
};
