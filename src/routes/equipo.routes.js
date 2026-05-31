const { Router } = require('express');
const {
  listarEquipos,
  obtenerEquipo,
  registrarEquipo,
  darBajaEquipo,
  restaurarEquipo,
} = require('../controllers/equipo.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico']), listarEquipos);
router.patch('/:id/baja', requireAuth, requireRoles(['admin']), darBajaEquipo);
router.patch('/:id/restaurar', requireAuth, requireRoles(['admin']), restaurarEquipo);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico']), obtenerEquipo);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico']), registrarEquipo);

module.exports = router;
