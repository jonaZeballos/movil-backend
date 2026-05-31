const { Router } = require('express');
const {
  listarOrdenes,
  obtenerOrden,
  crearOrden,
  crearOrdenesLote,
  actualizarOrden,
  actualizarEstadoOrden,
  actualizarObservacionesOrden,
  anularOrden,
} = require('../controllers/orden.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico']), listarOrdenes);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico']), obtenerOrden);
router.post('/lote', requireAuth, requireRoles(['admin', 'tecnico']), crearOrdenesLote);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico']), crearOrden);
router.patch('/:id/anular', requireAuth, requireRoles(['admin']), anularOrden);
router.patch('/:id/estado', requireAuth, requireRoles(['admin', 'tecnico']), actualizarEstadoOrden);
router.patch('/:id/observaciones', requireAuth, requireRoles(['admin', 'tecnico']), actualizarObservacionesOrden);
router.patch('/:id', requireAuth, requireRoles(['admin', 'tecnico']), actualizarOrden);

module.exports = router;
