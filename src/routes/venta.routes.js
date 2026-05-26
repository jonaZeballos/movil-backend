const { Router } = require('express');
const {
  listarVentas,
  obtenerVenta,
  obtenerReciboVenta,
  obtenerWhatsappReciboVenta,
  registrarVenta,
} = require('../controllers/venta.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'ventas']), listarVentas);
router.get('/:id/whatsapp', requireAuth, requireRoles(['admin', 'ventas']), obtenerWhatsappReciboVenta);
router.get('/:id/recibo', requireAuth, requireRoles(['admin', 'ventas']), obtenerReciboVenta);
router.get('/:id', requireAuth, requireRoles(['admin', 'ventas']), obtenerVenta);
router.post('/', requireAuth, requireRoles(['admin', 'ventas']), registrarVenta);

module.exports = router;
