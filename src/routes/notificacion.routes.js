const { Router } = require('express');
const {
  listarNotificaciones,
  registrarNotificacion,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} = require('../controllers/notificacion.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), listarNotificaciones);
router.post('/', requireAuth, requireRoles(['admin']), registrarNotificacion);
router.patch('/leidas', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), marcarTodasNotificacionesLeidas);
router.patch('/:id/leida', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), marcarNotificacionLeida);

module.exports = router;
