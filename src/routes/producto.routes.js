const { Router } = require('express');
const {
  listarProductos,
  obtenerProducto,
  registrarProducto,
  actualizarProducto,
} = require('../controllers/producto.controller');
const { requireAuth, requireRoles } = require('../middlewares');

const router = Router();

router.get('/', requireAuth, requireRoles(['admin', 'ventas']), listarProductos);
router.get('/:id', requireAuth, requireRoles(['admin', 'ventas']), obtenerProducto);
router.post('/', requireAuth, requireRoles(['admin', 'ventas']), registrarProducto);
router.patch('/:id', requireAuth, requireRoles(['admin', 'ventas']), actualizarProducto);

module.exports = router;
