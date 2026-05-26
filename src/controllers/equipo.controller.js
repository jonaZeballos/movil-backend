const equipoService = require('../services/equipo.service');

async function listarEquipos(req, res, next) {
  try {
    const equipos = await equipoService.listEquipos(req.query, req.auth);

    return res.json({
      mensaje: 'Equipos obtenidos correctamente',
      data: equipos,
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerEquipo(req, res, next) {
  try {
    const equipo = await equipoService.getEquipo(req.params.id, req.auth);

    return res.json({
      mensaje: 'Equipo obtenido correctamente',
      data: equipo,
    });
  } catch (error) {
    return next(error);
  }
}

async function registrarEquipo(req, res, next) {
  try {
    const equipo = await equipoService.createEquipo(req.body, req.auth);

    return res.status(201).json({
      mensaje: 'Equipo registrado correctamente',
      data: equipo,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listarEquipos,
  obtenerEquipo,
  registrarEquipo,
};
