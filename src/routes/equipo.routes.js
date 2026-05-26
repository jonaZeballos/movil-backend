const { Router } = require('express');
const {
  listarEquipos,
  obtenerEquipo,
  registrarEquipo,
} = require('../controllers/equipo.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico']), listarEquipos);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico']), obtenerEquipo);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico']), registrarEquipo);

module.exports = router;
