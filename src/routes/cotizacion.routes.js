const { Router } = require('express');
const {
  listarCotizaciones,
  obtenerCotizacion,
  obtenerWhatsappCotizacion,
  registrarCotizacion,
} = require('../controllers/cotizacion.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), listarCotizaciones);
router.get('/:id/whatsapp', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), obtenerWhatsappCotizacion);
router.get('/:id', requireAuth, requireRoles(['admin', 'tecnico', 'ventas']), obtenerCotizacion);
router.post('/', requireAuth, requireRoles(['admin', 'tecnico']), registrarCotizacion);

module.exports = router;
