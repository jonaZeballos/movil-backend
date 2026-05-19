const { Router } = require('express');
const {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
  actualizarOrden,
  actualizarEstadoOrden,
  actualizarObservacionesOrden,
} = require('../controllers/orden.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico']), listarOrdenes);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico']), obtenerOrden);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico']), crearOrden);
router.patch('/:id/estado', requireAuth, requireRoles(['admin', 'tecnico']), actualizarEstadoOrden);
router.patch('/:id/observaciones', requireAuth, requireRoles(['admin', 'tecnico']), actualizarObservacionesOrden);
router.patch('/:id', requireAuth, requireRoles(['admin', 'tecnico']), actualizarOrden);

module.exports = router;
