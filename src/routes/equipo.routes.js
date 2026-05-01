const { Router } = require('express');
const {
  listarEquipos,
  obtenerEquipo,
  registrarEquipo,
} = require('../controllers/equipo.controller');
const { requireAuth } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, listarEquipos);
router.get('/:id', requireAuth, obtenerEquipo);
router.post('/', requireAuth, registrarEquipo);

module.exports = router;
