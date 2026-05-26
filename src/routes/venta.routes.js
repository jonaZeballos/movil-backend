const { Router } = require('express');
const {
  listarVentas,
  obtenerVenta,
  registrarVenta,
} = require('../controllers/venta.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'ventas']), listarVentas);
router.get('/:id', requireAuth, requireRoles(['admin', 'ventas']), obtenerVenta);
router.post('/', requireAuth, requireRoles(['admin', 'ventas']), registrarVenta);

module.exports = router;
